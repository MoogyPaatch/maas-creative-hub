import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  createConversation,
  getConversation,
  getProject,
  getProjectStatus,
  getProjectConversations,
  getBrief,
  getPPM,
  getBrandAssets,
  mapBrandAsset,
  sendMessageSSE,
  approveValidation,
  rejectValidation,
  uploadFile,
  validateClientBrief,
  downloadDossierPDF,
  createShareLink,
  submitDeclinaisonConfig,
  approvePPMGate,
} from "@/lib/api";
import type { ClientBriefValidateRequest } from "@/lib/api";
import { parseSSEStream } from "@/lib/sse";
import type { ThinkingEvent } from "@/lib/sse";
import { accumulateThinking } from "@/components/chat/ThinkingIndicator";
import type { ThinkingState } from "@/components/chat/ThinkingIndicator";
import ChatPanel from "@/components/chat/ChatPanel";
import OutputPanel from "@/components/output/OutputPanel";
import WorkflowStepper from "@/components/layout/WorkflowStepper";
import ConversationHistory from "@/components/chat/ConversationHistory";
import { AnimatePresence } from "framer-motion";
import type { ChatMessage, ProjectStatus, ConversationSummary, ClientBriefDraft, BrandAsset } from "@/types";
import { EMPTY_BRIEF_DRAFT, CLIENT_BRIEF_REQUIRED_FIELDS } from "@/types";
import { ArrowLeft, Loader2, History, Shield, Download, Share2, Copy, Check } from "lucide-react";
import logoBlack from "@/assets/logo-marcel-black.png";
import logoWhite from "@/assets/logo-marcel-white.png";

/** Artifact types that should appear ONLY in the output panel, not as long chat messages */
const PANEL_ONLY_TYPES = new Set(["dc_copy_result", "ppm_presentation", "dc_presentation", "creative_brief", "campaign_gallery"]);
const PANEL_ONLY_NOTIFS: Record<string, string> = {
  dc_presentation: "Les pistes créatives sont prêtes. Consultez le panneau à droite.",
  dc_copy_result: "Les contenus rédactionnels sont prêts. Consultez le panneau à droite.",
  ppm_presentation: "Le dossier PPM est prêt. Consultez le panneau à droite.",
  creative_brief: "Le brief créatif stratégique est prêt. Consultez le panneau à droite.",
  campaign_gallery: "Les assets de campagne sont disponibles. Consultez le panneau à droite.",
};

/** Map raw quick_reply IDs to user-friendly labels (for historical messages loaded from DB) */
const QR_LABEL_MAP: Record<string, string> = {
  has_brief: "J'ai un brief",
  describe_here: "Je décris ici",
  upload_brief: "J'envoie un document",
  approve: "Approuver ✓",
  reject: "Demander des modifications",
  skip: "Passer",
  validate: "Valider",
  launch_declinaisons: "Lancer les declinaisons",
  skip_declinaisons: "Passer les declinaisons",
};

/** Internal pipeline messages that should be hidden from the chat (noise for the user) */
const INTERNAL_MSG_PATTERNS = [
  /^Brief valide recu/i,
  /^Analyse termin[eé]e/i,
  /^Plan de recherche gen[eé]r[eé]/i,
  /^Debut des analyses/i,
  /^Synthese recherche termin[eé]e/i,
  /^Brief cr[eé]atif re[cç]u/i,
  /^Lancement de la direction/i,
  /^Analyse du contexte visuel/i,
  /^Validation confirm[eé]e\. Passage/i,
  /^Les masters sont valid[eé]s/i,
  /^Configuration des d[eé]clinaisons/i,
];

const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAgency = user?.role === "agency" || user?.role === "admin";
  const isClient = !isAgency;

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [artifacts, setArtifacts] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState<ThinkingState | null>(null);
  const thinkingRef = useRef<ThinkingState | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus | null>(null);
  const [briefData, setBriefData] = useState<any>(null);
  const [briefId, setBriefId] = useState<string | null>(null);
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<"chat" | "output">("chat");
  const [isValidatingBrief, setIsValidatingBrief] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [forceAssetsSignal, setForceAssetsSignal] = useState(0);
  const [highlightAssetCategories, setHighlightAssetCategories] = useState<string[]>([]);

  // Client brief draft state (SSE-driven)
  const [clientBriefDraft, setClientBriefDraft] = useState<ClientBriefDraft>({ ...EMPTY_BRIEF_DRAFT });
  const [changedBriefFields, setChangedBriefFields] = useState<Set<string>>(new Set());
  const changedFieldsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // Handle SSE brief draft updates (null fields don't overwrite)
  const handleBriefDraftUpdate = useCallback((draft: Partial<ClientBriefDraft>) => {
    const newChanged = new Set<string>();
    setClientBriefDraft((prev) => {
      const next = { ...prev };
      for (const [key, value] of Object.entries(draft)) {
        if (value !== null && value !== undefined) {
          if (next[key as keyof ClientBriefDraft] !== value) {
            newChanged.add(key);
          }
          (next as any)[key] = value;
        }
      }
      return next;
    });

    if (newChanged.size > 0) {
      setChangedBriefFields(newChanged);
      clearTimeout(changedFieldsTimeoutRef.current);
      changedFieldsTimeoutRef.current = setTimeout(() => setChangedBriefFields(new Set()), 1200);
    }
  }, []);

  // Manual field edit
  const handleClientBriefFieldChange = useCallback((key: keyof ClientBriefDraft, value: string) => {
    setClientBriefDraft((prev) => ({ ...prev, [key]: value || null }));
  }, []);

  // Validate brief
  const handleValidateClientBrief = useCallback(async () => {
    if (!conversationId || isValidatingBrief) return;

    // Check required fields
    const missingFields = CLIENT_BRIEF_REQUIRED_FIELDS.filter(
      (field) => !clientBriefDraft[field] || clientBriefDraft[field]!.trim() === ""
    );
    if (missingFields.length > 0) {
      toast.error("Veuillez remplir tous les champs obligatoires (Marque, Objectif, Cible, Tonalité, Formats)");
      return;
    }

    setIsValidatingBrief(true);
    try {
      const payload: ClientBriefValidateRequest = {
        brand: clientBriefDraft.brand || "",
        product: clientBriefDraft.product || undefined,
        objective: clientBriefDraft.objective || "",
        target: clientBriefDraft.target || "",
        tone: clientBriefDraft.tone || "",
        formats: clientBriefDraft.formats || "",
        promise: clientBriefDraft.promise || undefined,
        reason_to_believe: clientBriefDraft.reason_to_believe || undefined,
        creative_references: clientBriefDraft.creative_references || undefined,
        constraints: clientBriefDraft.constraints || undefined,
        additional_context: clientBriefDraft.additional_context || undefined,
      };

      const stream = await validateClientBrief(conversationId, payload);
      if (stream) await handleSSEStream(stream);
    } catch {
      toast.error("Erreur lors de la validation du brief");
    } finally {
      setIsValidatingBrief(false);
    }
  }, [conversationId, clientBriefDraft, isValidatingBrief]);

  const loadConversationsList = useCallback(async () => {
    if (!id) return;
    try {
      const convs = await getProjectConversations(id);
      setConversations(
        (convs || []).map((c: any) => ({
          conversation_id: c.conversation_id || c.id,
          created_at: c.created_at,
          total_messages: c.total_messages || 0,
          last_message_preview: c.last_message_preview || c.last_message,
          target_agent: c.target_agent,
        }))
      );
    } catch {}
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;
    const init = async () => {
      try {
        const [status, project] = await Promise.all([
          getProjectStatus(id).catch(() => null),
          getProject(id),
        ]);
        if (status) {
          setProjectStatus(status);
        } else if (project) {
          // Fallback: derive basic status from project data
          const phase = project.supervisor_phase || "commercial";
          const PHASE_ORDER = ["commercial", "planner", "dc_visual", "dc_copy", "ppm", "prod_image", "prod_video", "prod_audio", "delivered"];
          const phaseIdx = PHASE_ORDER.indexOf(phase);
          setProjectStatus({
            project_name: project.name || project.brand_name || "Nouvelle campagne",
            current_step: phase,
            pipeline: [
              { step: "commercial", label: "Brief", status: phaseIdx > 0 ? "done" : phaseIdx === 0 ? "active" : "pending" },
              { step: "dc_visual", label: "Création", status: phaseIdx > 3 ? "done" : (phaseIdx >= 1 && phaseIdx <= 3) ? "active" : "pending" },
              { step: "ppm", label: "PPM", status: phaseIdx > 4 ? "done" : phaseIdx === 4 ? "active" : "pending" },
              { step: "delivered", label: "Livré", status: phaseIdx >= 8 ? "done" : (phaseIdx >= 5 && phaseIdx <= 7) ? "active" : "pending" },
            ],
            pending_validations: [],
          });
        }
        getBrief(id).then((brief) => {
          if (brief) {
            setBriefData(brief);
            setBriefId(brief.id);
          }
        }).catch(() => {});
        getBrandAssets(id).then((assets) => {
          setBrandAssets(assets);
        }).catch(() => {});
        getPPM(id).then((ppmData) => {
          if (ppmData) {
            const ppmMetadata = {
              type: "ppm_presentation" as const,
              summary: `PPM – ${ppmData.status || "en cours"}`,
              storyboard: ppmData.frames || [],
              storyboard_count: (ppmData.frames || []).length,
              casting: ppmData.casting_direction || [],
              casting_count: (ppmData.casting_direction || []).length,
              settings: ppmData.settings_direction || [],
              settings_count: (ppmData.settings_direction || []).length,
              mockups: ppmData.finalized_mockups || [],
              mockup_count: (ppmData.finalized_mockups || []).length,
              production_notes: ppmData.production_notes || {},
              slides_url: null,
              pptx_url: null,
            };
            setArtifacts((prev) => {
              if (prev.some((a) => a.metadata?.type === "ppm_presentation")) return prev;
              return [...prev, { role: "agent", content: "", metadata: ppmMetadata }];
            });
          }
        }).catch(() => {});
        loadConversationsList();

        const currentStep = status?.current_step || project.supervisor_phase || "commercial";
        const VALID_TARGETS = ["commercial", "planner", "dc", "dc_visual", "dc_copy", "ppm", "prod"];
        const resolvedTarget = VALID_TARGETS.includes(currentStep)
          ? currentStep
          : currentStep.startsWith("prod_") ? "prod" : "commercial";
        const targetAgent = isAgency ? resolvedTarget : null;

        let conv: any = null;
        if (project.latest_conversation_id) {
          conv = await getConversation(project.latest_conversation_id).catch(() => null);
        }
        if (!conv) {
          conv = await createConversation(id, isAgency, targetAgent);
        }

        setConversationId(conv.conversation_id);
        const existingMessages: ChatMessage[] = (conv.messages || [])
          .map((m: any) => {
            const mType = m.metadata?.type;
            // Filter by metadata type (works for SSE-cached messages)
            if (m.role !== "user" && mType && PANEL_ONLY_TYPES.has(mType)) {
              return {
                role: "agent" as const,
                content: PANEL_ONLY_NOTIFS[mType] || "Nouveau contenu disponible dans le panneau à droite.",
                metadata: m.metadata,
              };
            }
            const content = m.content || "";
            // Hide internal pipeline status messages from agent
            if (m.role !== "user" && INTERNAL_MSG_PATTERNS.some((re) => re.test(content))) {
              return null; // will be filtered out below
            }
            // Fallback: truncate excessively long agent messages (DB doesn't persist metadata.type)
            if (m.role !== "user" && content.length > 800) {
              return {
                role: "agent" as const,
                content: "Contenu détaillé disponible dans le panneau à droite. →",
              };
            }
            // Map raw quick_reply IDs to friendly labels for user messages
            const displayContent = m.role === "user" && QR_LABEL_MAP[content.trim()]
              ? QR_LABEL_MAP[content.trim()]
              : content;
            return {
              role: m.role === "user" ? ("user" as const) : ("agent" as const),
              content: displayContent,
              quickReplies: m.quick_replies?.map((qr: any) => ({ id: qr.id, label: qr.label })),
              metadata: m.metadata,
            };
          })
          .filter((m): m is ChatMessage => m !== null);
        setMessages(existingMessages);

        // Restore artifacts and brief draft from message history (BUG 3 fix)
        const artifactTypes = [
          "creative_brief", "dc_presentation", "dc_copy_result",
          "ppm_presentation", "campaign_gallery", "validation_required", "delivery"
        ];
        const restoredArtifacts: ChatMessage[] = [];
        let restoredBrief: Partial<ClientBriefDraft> = {};

        for (const m of existingMessages) {
          const meta = m.metadata;
          if (!meta?.type) continue;
          if (artifactTypes.includes(meta.type)) {
            // For validation_required, keep only the latest
            if (meta.type === "validation_required") {
              const existingIdx = restoredArtifacts.findIndex((a) => a.metadata?.type === "validation_required");
              if (existingIdx >= 0) restoredArtifacts.splice(existingIdx, 1);
            }
            restoredArtifacts.push({
              role: "agent",
              content: m.content || "",
              metadata: meta,
              timestamp: m.timestamp ? new Date(m.timestamp as any) : new Date(),
            });
          }
          if (meta.type === "client_brief_draft" && meta.brief_draft) {
            restoredBrief = { ...restoredBrief, ...meta.brief_draft };
          }
        }

        // Merge with any artifacts from conv.artifacts (if backend returns them)
        // Backend artifacts have DB-enriched data (e.g., campaign_gallery with real URLs)
        const backendArtifacts: ChatMessage[] = (conv.artifacts || []).map((a: any) => ({
          role: "agent" as const, content: a.content || "", metadata: a.metadata,
        }));
        // For types where backend has richer data, prefer backend artifact over message-restored
        const DB_ENRICHED_TYPES = new Set(["campaign_gallery"]);
        const mergedArtifacts = restoredArtifacts.length > 0
          ? restoredArtifacts.map((a) => {
              if (a.metadata?.type && DB_ENRICHED_TYPES.has(a.metadata.type)) {
                const backendVersion = backendArtifacts.find((b) => b.metadata?.type === a.metadata?.type);
                return backendVersion || a;
              }
              return a;
            })
          : backendArtifacts;
        if (mergedArtifacts.length > 0) setArtifacts(mergedArtifacts);

        if (Object.keys(restoredBrief).length > 0) {
          handleBriefDraftUpdate(restoredBrief as Partial<ClientBriefDraft>);
        }

        // Also check if conv has brief_client_draft
        if (conv.brief_client_draft) {
          handleBriefDraftUpdate(conv.brief_client_draft);
        }
      } catch (err) {
        console.error("Init error:", err);
        toast.error("Erreur de chargement du projet");
        try {
          const conv = await createConversation(id, isAgency, isAgency ? "commercial" : null);
          setConversationId(conv.conversation_id);
          const existingMessages: ChatMessage[] = (conv.messages || []).map((m: any) => {
            const mType = m.metadata?.type;
            if (m.role !== "user" && mType && PANEL_ONLY_TYPES.has(mType)) {
              return {
                role: "agent" as const,
                content: PANEL_ONLY_NOTIFS[mType] || "Nouveau contenu disponible dans le panneau à droite.",
              };
            }
            const content = m.content || "";
            if (m.role !== "user" && content.length > 800) {
              return {
                role: "agent" as const,
                content: "Contenu détaillé disponible dans le panneau à droite. →",
              };
            }
            return {
              role: m.role === "user" ? ("user" as const) : ("agent" as const),
              content,
              quickReplies: m.quick_replies?.map((qr: any) => ({ id: qr.id, label: qr.label })),
              metadata: m.metadata,
            };
          });
          setMessages(existingMessages);
        } catch {
          toast.error("Impossible de créer la conversation");
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, user, isAgency, loadConversationsList]);

  useEffect(() => {
    if (!id) return;
    pollRef.current = setInterval(() => {
      getProjectStatus(id)
        .then((s) => {
          setProjectStatus((prev) => {
            if (JSON.stringify(prev?.pipeline) !== JSON.stringify(s.pipeline)) return s;
            return prev;
          });
        })
        .catch(() => {});
    }, 10_000);
    return () => clearInterval(pollRef.current);
  }, [id]);

  const handleSSEStream = useCallback(async (stream: ReadableStream<Uint8Array> | null) => {
    if (!stream) return;
    setIsStreaming(true);
    thinkingRef.current = { agentName: "Traitement", progress: 0, tasks: [{ label: "Traitement en cours...", status: "active" as const }], taskTotal: 0 };
    setThinking(thinkingRef.current);
    await parseSSEStream(
      stream,
      (msg) => {
        thinkingRef.current = null;
        setThinking(null);
        const msgType = msg.metadata?.type;
        const isPanelOnly = msgType && PANEL_ONLY_TYPES.has(msgType);

        if (isPanelOnly) {
          const notifText = PANEL_ONLY_NOTIFS[msgType!] || "Nouveau contenu disponible dans le panneau à droite.";
          setMessages((prev) => [...prev, { role: "agent", content: notifText, timestamp: new Date() }]);
        } else {
          setMessages((prev) => [...prev, msg]);
        }

        // Handle asset_request or show_upload_ui — switch to assets tab and highlight categories
        if (msg.metadata?.type === "asset_request" || msg.metadata?.show_upload_ui || msg.metadata?.action === "show_upload_ui") {
          setForceAssetsSignal((prev) => prev + 1);
          setMobileTab("output");
          const categories = msg.metadata?.requested_asset_categories;
          if (Array.isArray(categories) && categories.length > 0) {
            setHighlightAssetCategories(categories);
          }
          toast.info("Vous pouvez uploader vos fichiers dans le panneau de droite");
        }

        if (msg.metadata?.type && msg.metadata.type !== "client_brief_draft" && msg.metadata.type !== "status_update") {
          // Types that should only have one tab (replace existing on re-emit)
          const SINGLETON_TYPES = new Set(["validation_required", "campaign_gallery", "dc_presentation", "ppm_presentation"]);
          setArtifacts((prev) => {
            if (msg.metadata?.type && SINGLETON_TYPES.has(msg.metadata.type)) {
              const without = prev.filter((a) => a.metadata?.type !== msg.metadata?.type);
              return [...without, msg];
            }
            return [...prev, msg];
          });
          setMobileTab("output");
        }
      },
      () => {
        thinkingRef.current = null;
        setThinking(null);
        setIsStreaming(false);
        if (id) {
          getProjectStatus(id).then(setProjectStatus).catch(() => {});
          getBrief(id).then((brief) => {
            if (brief) {
              setBriefData(brief);
              setBriefId(brief.id);
            }
          }).catch(() => {});
          getPPM(id).then((ppmData) => {
            if (ppmData) {
              const ppmMetadata = {
                type: "ppm_presentation" as const,
                summary: `PPM – ${ppmData.status || "en cours"}`,
                storyboard: ppmData.frames || [],
                storyboard_count: (ppmData.frames || []).length,
                casting: ppmData.casting_direction || [],
                casting_count: (ppmData.casting_direction || []).length,
                settings: ppmData.settings_direction || [],
                settings_count: (ppmData.settings_direction || []).length,
                mockups: ppmData.finalized_mockups || [],
                mockup_count: (ppmData.finalized_mockups || []).length,
                production_notes: ppmData.production_notes || {},
                slides_url: null,
                pptx_url: null,
              };
              setArtifacts((prev) => {
                const idx = prev.findIndex((a) => a.metadata?.type === "ppm_presentation");
                const newArtifact: ChatMessage = { role: "agent", content: "", metadata: ppmMetadata };
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = newArtifact;
                  return updated;
                }
                return [...prev, newArtifact];
              });
            }
          }).catch(() => {});
        }
      },
      (event: ThinkingEvent) => {
        const next = accumulateThinking(thinkingRef.current, event);
        thinkingRef.current = next;
        setThinking(next);
      },
      handleBriefDraftUpdate,
      (action, options, validationData) => {
        console.log("Action required:", { action, options, validationData });
      },
      () => {
        toast.info("Le traitement continue en arrière-plan. Rafraîchissez la page dans quelques instants.");
      }
    );
  }, [id, handleBriefDraftUpdate]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!conversationId) return;
    setMessages((prev) => [...prev, { role: "user", content: text, timestamp: new Date() }]);
    try {
      const stream = await sendMessageSSE(conversationId, "text", text);
      await handleSSEStream(stream);
    } catch {
      toast.error("Impossible d'envoyer le message.");
      setMessages((prev) => [...prev, { role: "agent", content: "Désolé, une erreur est survenue. Veuillez réessayer." }]);
      setIsStreaming(false);
      setThinking(null);
    }
  }, [conversationId, handleSSEStream]);

  const handleQuickReply = useCallback(async (qrId: string) => {
    if (!conversationId) return;
    const lastAgentMsg = [...messages].reverse().find((m) => m.role === "agent" && m.quickReplies);
    const label = lastAgentMsg?.quickReplies?.find((qr) => qr.id === qrId)?.label || qrId;
    setMessages((prev) => [...prev, { role: "user", content: label, timestamp: new Date() }]);
    try {
      const stream = await sendMessageSSE(conversationId, "quick_reply", qrId);
      await handleSSEStream(stream);
    } catch {
      toast.error("Erreur lors de l'envoi");
      setIsStreaming(false);
      setThinking(null);
    }
  }, [conversationId, messages, handleSSEStream]);

  const handleSelectPiste = useCallback(async (pisteId: string) => {
    if (!conversationId) return;
    // Find piste title from artifacts for a user-friendly message
    let pisteLabel = pisteId;
    for (const a of artifacts) {
      const pistes = a.metadata?.pistes;
      if (pistes) {
        const found = pistes.find((p: { id: string; title: string }) => p.id === pisteId);
        if (found?.title) { pisteLabel = found.title; break; }
      }
    }
    setMessages((prev) => [...prev, { role: "user", content: `Je choisis la piste "${pisteLabel}"`, timestamp: new Date() }]);
    try {
      const stream = await sendMessageSSE(conversationId, "quick_reply", pisteId);
      await handleSSEStream(stream);
    } catch {
      toast.error("Erreur lors de la sélection");
      setIsStreaming(false);
      setThinking(null);
    }
  }, [conversationId, artifacts, handleSSEStream]);

  const handleApprove = useCallback(async (validationId: string, feedback: string | null) => {
    try {
      const stream = await approveValidation(validationId, feedback);
      await handleSSEStream(stream);
    } catch {
      toast.error("Erreur lors de l'approbation");
      setIsStreaming(false);
    }
  }, [handleSSEStream]);

  const handlePPMApprove = useCallback(async (action: "approve" | "revision", feedback?: string) => {
    if (!conversationId || !id) return;
    try {
      // 1. POST to gates/ppm endpoint to update DB (validation, storyboard)
      await approvePPMGate(id, action, feedback || "");
      // 2. Send a message via SSE to trigger the graph (prod or revision)
      const messageText = action === "approve" ? "approve" : `reject: ${feedback || "modifications demandées"}`;
      const stream = await sendMessageSSE(conversationId, "quick_reply", messageText);
      await handleSSEStream(stream);
    } catch {
      toast.error("Erreur lors de la validation PPM");
      setIsStreaming(false);
    }
  }, [conversationId, id, handleSSEStream]);

  const handleReject = useCallback(async (validationId: string, feedback: string) => {
    try {
      const stream = await rejectValidation(validationId, feedback);
      await handleSSEStream(stream);
    } catch {
      toast.error("Erreur lors du rejet");
      setIsStreaming(false);
    }
  }, [handleSSEStream]);

  const handleLaunchDeclinaisons = useCallback(async (config: Record<string, Record<string, boolean>>) => {
    if (!conversationId) return;
    try {
      // 1. Submit the config to backend state
      await submitDeclinaisonConfig(conversationId, config);
      // 2. Send quick reply to trigger prod_declinaisons
      const stream = await sendMessageSSE(conversationId, "quick_reply", "launch_declinaisons");
      await handleSSEStream(stream);
    } catch {
      toast.error("Erreur lors du lancement des declinaisons");
      setIsStreaming(false);
    }
  }, [conversationId, handleSSEStream]);

  const handleSkipDeclinaisons = useCallback(async () => {
    if (!conversationId) return;
    try {
      const stream = await sendMessageSSE(conversationId, "quick_reply", "skip_declinaisons");
      await handleSSEStream(stream);
    } catch {
      toast.error("Erreur lors du passage des declinaisons");
      setIsStreaming(false);
    }
  }, [conversationId, handleSSEStream]);

  const handleAssetUploadComplete = useCallback(async (filename: string) => {
    if (!conversationId) return;
    const step = projectStatus?.current_step || "";
    if (step === "brand_visuals" || step === "product_intake" || step === "commercial") {
      try {
        const stream = await sendMessageSSE(conversationId, "text", `UPLOAD_DONE: ${filename}`, true);
        await handleSSEStream(stream);
      } catch {
        // Silent — upload itself succeeded, notification to supervisor is best-effort
      }
    }
  }, [conversationId, projectStatus, handleSSEStream]);

  const handleAttach = useCallback(async (files: FileList) => {
    if (!id) return;
    for (const file of Array.from(files)) {
      if (file.size / (1024 * 1024) > 20) {
        toast.error(`${file.name} dépasse 20 MB`);
        continue;
      }
      try {
        toast.info(`Upload de ${file.name}...`);
        const uploadedAsset = await uploadFile(id, file);
        setBrandAssets((prev) => [...prev, mapBrandAsset(uploadedAsset)]);
        setMessages((prev) => [...prev, { role: "user", content: `📎 ${file.name}`, timestamp: new Date() }]);
        toast.success(`${file.name} envoyé`);
        const ext = file.name.split(".").pop()?.toLowerCase();
        const extractable = ["pdf", "docx", "doc", "txt", "md", "png", "jpg", "jpeg", "webp"];
        if (conversationId && ext && extractable.includes(ext)) {
          const stream = await sendMessageSSE(
            conversationId,
            "text",
            `Fichier uploadé : ${file.name}`,
            true,
          );
          await handleSSEStream(stream);
        }
      } catch {
        toast.error(`Échec de l'upload de ${file.name}`);
      }
    }
  }, [id, conversationId, handleSSEStream]);

  const handleSelectConversation = useCallback(async (convId: string) => {
    try {
      const conv = await getConversation(convId);
      setConversationId(conv.conversation_id);
      const msgs: ChatMessage[] = (conv.messages || []).map((m: any) => ({
        role: m.role === "user" ? "user" : "agent",
        content: m.content || "",
        quickReplies: m.quick_replies?.map((qr: any) => ({ id: qr.id, label: qr.label })),
        metadata: m.metadata,
      }));
      setMessages(msgs);

      // Restore artifacts from message history
      const artifactTypes = [
        "creative_brief", "dc_presentation", "dc_copy_result",
        "ppm_presentation", "campaign_gallery", "validation_required", "delivery"
      ];
      const restoredArtifacts: ChatMessage[] = [];
      setClientBriefDraft({ ...EMPTY_BRIEF_DRAFT });

      for (const m of msgs) {
        const meta = m.metadata;
        if (!meta?.type) continue;
        if (artifactTypes.includes(meta.type)) {
          // For validation_required, keep only the latest
          if (meta.type === "validation_required") {
            const existingIdx = restoredArtifacts.findIndex((a) => a.metadata?.type === "validation_required");
            if (existingIdx >= 0) restoredArtifacts.splice(existingIdx, 1);
          }
          restoredArtifacts.push({ role: "agent", content: m.content || "", metadata: meta, timestamp: new Date() });
        }
        if (meta.type === "client_brief_draft" && meta.brief_draft) {
          handleBriefDraftUpdate(meta.brief_draft);
        }
      }

      const backendArtifacts = (conv.artifacts || []).map((a: any) => ({ role: "agent" as const, content: a.content || "", metadata: a.metadata }));
      const DB_ENRICHED = new Set(["campaign_gallery"]);
      const merged = restoredArtifacts.length > 0
        ? restoredArtifacts.map((a) => {
            if (a.metadata?.type && DB_ENRICHED.has(a.metadata.type)) {
              return backendArtifacts.find((b) => b.metadata?.type === a.metadata?.type) || a;
            }
            return a;
          })
        : backendArtifacts;
      setArtifacts(merged);

      if (conv.brief_client_draft) handleBriefDraftUpdate(conv.brief_client_draft);
      setShowHistory(false);
    } catch {
      toast.error("Impossible de charger cette conversation");
    }
  }, [handleBriefDraftUpdate]);

  const hasPendingValidation = projectStatus?.pending_validations?.some((v) => v.status === "pending");

  const handleDownloadDossier = useCallback(async () => {
    if (!id) return;
    try {
      toast.info("Préparation du dossier PDF...");
      const blob = await downloadDossierPDF(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dossier-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Dossier téléchargé");
    } catch {
      toast.error("Impossible de télécharger le dossier");
    }
  }, [id]);

  const handleShare = useCallback(async () => {
    if (!id) return;
    try {
      const result = await createShareLink(id);
      setShareUrl(result.share_url);
      setShowShareDialog(true);
    } catch {
      toast.error("Impossible de créer le lien de partage");
    }
  }, [id]);

  const handleCopyShareUrl = useCallback(() => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }




  const outputPanelProps = {
    artifacts,
    briefData,
    messages,
    clientBriefDraft,
    changedBriefFields,
    onClientBriefFieldChange: handleClientBriefFieldChange,
    onValidateClientBrief: (projectStatus?.current_step || "commercial") === "commercial" ? handleValidateClientBrief : undefined,
    onSelectPiste: handleSelectPiste,
    onApprove: handleApprove,
    onReject: handleReject,
    onPPMApprove: handlePPMApprove,
    onLaunchDeclinaisons: handleLaunchDeclinaisons,
    onSkipDeclinaisons: handleSkipDeclinaisons,
    brandAssets,
    onBrandAssetsChange: setBrandAssets,
    highlightAssetCategories,
    currentStep: projectStatus?.current_step || "commercial",
    isClientView: isClient,
    isStreaming,
    isValidatingBrief,
    projectId: id,
    forceAssetsSignal,
    onAssetUploadComplete: handleAssetUploadComplete,
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/projects")}
            className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <img src={logoBlack} alt="Marcel" className="hidden sm:block h-6 w-auto dark:hidden" />
          <img src={logoWhite} alt="Marcel" className="hidden h-6 w-auto dark:sm:block" />
          <div className="h-4 w-px bg-border hidden sm:block" />
          <span className="hidden sm:inline text-sm font-bold text-foreground truncate max-w-[200px]">
            {projectStatus?.project_name || "Nouvelle campagne"}
          </span>
          {isAgency && (
            <span className="hidden lg:flex items-center gap-1 border border-accent text-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
              <Shield className="h-3 w-3" />
              Agence
            </span>
          )}
          {hasPendingValidation && (
            <span className="flex items-center gap-1 bg-accent text-accent-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider animate-pulse">
              Action requise
            </span>
          )}
        </div>

        <div className="flex-1 px-4 sm:px-8 overflow-hidden">
          <WorkflowStepper
            pipeline={projectStatus?.pipeline || []}
            currentStep={projectStatus?.current_step || "commercial"}
            isClientView={isClient}
          />
        </div>

        <div className="hidden sm:flex items-center gap-2">
          {isAgency && (
            <>
              <button
                onClick={handleDownloadDossier}
                className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Télécharger le dossier"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={handleShare}
                className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Partager"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </>
          )}
          {isAgency && conversations.length > 1 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex h-8 w-8 items-center justify-center transition-colors ${
                showHistory ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Historique"
            >
              <History className="h-4 w-4" />
            </button>
          )}
          <span className="text-[10px] text-muted-foreground font-medium">{user?.email}</span>
        </div>
      </header>

      {/* Share dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowShareDialog(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">Lien de partage</h3>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl || ""}
                className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground"
              />
              <button
                onClick={handleCopyShareUrl}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copié" : "Copier"}
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Ce lien donne accès en lecture seule au dossier.</p>
          </div>
        </div>
      )}

      {/* Desktop */}
      <div className="hidden md:flex flex-1 overflow-hidden relative">
        <AnimatePresence>
          {showHistory && (
            <ConversationHistory
              conversations={conversations}
              activeId={conversationId}
              onSelect={handleSelectConversation}
              onClose={() => setShowHistory(false)}
            />
          )}
        </AnimatePresence>

        <div className="w-[40%] min-w-[360px] border-r border-border">
          <ChatPanel
            messages={messages}
            thinking={thinking}
            onSendMessage={handleSendMessage}
            onQuickReply={handleQuickReply}
            onAttach={handleAttach}
            isStreaming={isStreaming}
          />
        </div>
        <div className="relative flex-1">
          <OutputPanel {...outputPanelProps} />
        </div>
      </div>

      {/* Mobile */}
      <div className="flex flex-col flex-1 overflow-hidden md:hidden">
        <div className="flex border-b border-border">
          <button
            onClick={() => setMobileTab("chat")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              mobileTab === "chat" ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground"
            }`}
          >
            Conversation
          </button>
          <button
            onClick={() => setMobileTab("output")}
            className={`relative flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              mobileTab === "output" ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground"
            }`}
          >
            Livrables {artifacts.length > 0 && `(${artifacts.length})`}
            {hasPendingValidation && mobileTab !== "output" && (
              <span className="absolute top-2 right-4 h-2 w-2 bg-accent animate-ping" />
            )}
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {mobileTab === "chat" ? (
            <ChatPanel
              messages={messages}
              thinking={thinking}
              onSendMessage={handleSendMessage}
              onQuickReply={handleQuickReply}
              onAttach={handleAttach}
              isStreaming={isStreaming}
            />
          ) : (
            <OutputPanel {...outputPanelProps} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
