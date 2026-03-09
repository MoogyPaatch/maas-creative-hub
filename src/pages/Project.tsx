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
} from "@/lib/api";
import type { ClientBriefValidateRequest } from "@/lib/api";
import { parseSSEStream } from "@/lib/sse";
import ChatPanel from "@/components/chat/ChatPanel";
import OutputPanel from "@/components/output/OutputPanel";
import WorkflowStepper from "@/components/layout/WorkflowStepper";
import ConversationHistory from "@/components/chat/ConversationHistory";
import { AnimatePresence } from "framer-motion";
import type { ChatMessage, ProjectStatus, ConversationSummary, ClientBriefDraft } from "@/types";
import { EMPTY_BRIEF_DRAFT, CLIENT_BRIEF_REQUIRED_FIELDS } from "@/types";
import { ArrowLeft, Loader2, History, Shield } from "lucide-react";
import logoBlack from "@/assets/logo-marcel-black.png";
import logoWhite from "@/assets/logo-marcel-white.png";

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
  const [thinking, setThinking] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus | null>(null);
  const [briefData, setBriefData] = useState<any>(null);
  const [briefId, setBriefId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<"chat" | "output">("chat");
  const [isValidatingBrief, setIsValidatingBrief] = useState(false);

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
        if (status) setProjectStatus(status);
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
              if (prev.some((a) => a.metadata?.type === "ppm_presentation")) return prev;
              return [...prev, { role: "agent", content: "", metadata: ppmMetadata }];
            });
          }
        }).catch(() => {});
        loadConversationsList();

        const currentStep = status?.current_step || project.supervisor_phase || "commercial";
        const targetAgent = isAgency ? (currentStep || "commercial") : null;

        let conv: any = null;
        if (project.latest_conversation_id) {
          conv = await getConversation(project.latest_conversation_id).catch(() => null);
        }
        if (!conv) {
          conv = await createConversation(id, isAgency, targetAgent);
        }

        setConversationId(conv.conversation_id);
        const existingMessages: ChatMessage[] = (conv.messages || []).map((m: any) => ({
          role: m.role === "user" ? "user" : "agent",
          content: m.content || "",
          quickReplies: m.quick_replies?.map((qr: any) => ({ id: qr.id, label: qr.label })),
          metadata: m.metadata,
        }));
        setMessages(existingMessages);

        // Restore brief draft from conversation messages
        for (const m of existingMessages) {
          if (m.metadata?.type === "client_brief_draft" && m.metadata?.brief_draft) {
            handleBriefDraftUpdate(m.metadata.brief_draft);
          }
        }

        const existingArtifacts: ChatMessage[] = (conv.artifacts || []).map((a: any) => ({
          role: "agent", content: a.content || "", metadata: a.metadata,
        }));
        setArtifacts(existingArtifacts);

        // Also check if conv has brief_client_draft
        if (conv.brief_client_draft) {
          handleBriefDraftUpdate(conv.brief_client_draft);
        }
      } catch (err) {
        console.error("Init error:", err);
        toast.error("Erreur de chargement du projet");
        try {
          const conv = await createConversation(id, isAgency, "commercial");
          setConversationId(conv.conversation_id);
          const existingMessages: ChatMessage[] = (conv.messages || []).map((m: any) => ({
            role: m.role === "user" ? "user" : "agent",
            content: m.content || "",
            quickReplies: m.quick_replies?.map((qr: any) => ({ id: qr.id, label: qr.label })),
            metadata: m.metadata,
          }));
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
    setThinking("Traitement en cours...");
    await parseSSEStream(
      stream,
      (msg) => {
        setThinking(null);
        setMessages((prev) => [...prev, msg]);
        if (msg.metadata?.type && msg.metadata.type !== "client_brief_draft" && msg.metadata.type !== "status_update") {
          setArtifacts((prev) => [...prev, msg]);
          setMobileTab("output");
        }
      },
      () => {
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
      (label) => setThinking(label),
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
    setMessages((prev) => [...prev, { role: "user", content: `Je choisis ${pisteId}`, timestamp: new Date() }]);
    try {
      const stream = await sendMessageSSE(conversationId, "quick_reply", pisteId);
      await handleSSEStream(stream);
    } catch {
      toast.error("Erreur lors de la sélection");
      setIsStreaming(false);
      setThinking(null);
    }
  }, [conversationId, handleSSEStream]);

  const handleApprove = useCallback(async (validationId: string, feedback: string | null) => {
    try {
      const stream = await approveValidation(validationId, feedback);
      await handleSSEStream(stream);
    } catch {
      toast.error("Erreur lors de l'approbation");
      setIsStreaming(false);
    }
  }, [handleSSEStream]);

  const handleReject = useCallback(async (validationId: string, feedback: string) => {
    try {
      const stream = await rejectValidation(validationId, feedback);
      await handleSSEStream(stream);
    } catch {
      toast.error("Erreur lors du rejet");
      setIsStreaming(false);
    }
  }, [handleSSEStream]);

  const handleAttach = useCallback(async (files: FileList) => {
    if (!id) return;
    for (const file of Array.from(files)) {
      if (file.size / (1024 * 1024) > 20) {
        toast.error(`${file.name} dépasse 20 MB`);
        continue;
      }
      try {
        toast.info(`Upload de ${file.name}...`);
        await uploadFile(id, file);
        setMessages((prev) => [...prev, { role: "user", content: `📎 ${file.name}`, timestamp: new Date() }]);
        toast.success(`${file.name} envoyé`);
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (conversationId && (ext === "pdf" || ext === "docx" || ext === "doc")) {
          const stream = await sendMessageSSE(conversationId, "text", "extract-brief", true);
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
      const msgs = (conv.messages || []).map((m: any) => ({
        role: m.role === "user" ? "user" : "agent",
        content: m.content || "",
        quickReplies: m.quick_replies?.map((qr: any) => ({ id: qr.id, label: qr.label })),
        metadata: m.metadata,
      }));
      setMessages(msgs);
      setArtifacts(
        (conv.artifacts || []).map((a: any) => ({ role: "agent", content: a.content || "", metadata: a.metadata }))
      );
      // Restore brief draft
      setClientBriefDraft({ ...EMPTY_BRIEF_DRAFT });
      for (const m of msgs) {
        if (m.metadata?.type === "client_brief_draft" && m.metadata?.brief_draft) {
          handleBriefDraftUpdate(m.metadata.brief_draft);
        }
      }
      if (conv.brief_client_draft) handleBriefDraftUpdate(conv.brief_client_draft);
      setShowHistory(false);
    } catch {
      toast.error("Impossible de charger cette conversation");
    }
  }, [handleBriefDraftUpdate]);

  const hasPendingValidation = projectStatus?.pending_validations?.some((v) => v.status === "pending");

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
    onValidateClientBrief: handleValidateClientBrief,
    onSelectPiste: handleSelectPiste,
    onApprove: handleApprove,
    onReject: handleReject,
    currentStep: projectStatus?.current_step || "commercial",
    isClientView: isClient,
    isStreaming,
    isValidatingBrief,
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
          <img src={logoWhite} alt="Marcel" className="hidden sm:block h-6 w-auto hidden dark:block" />
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

        <div className="hidden sm:flex items-center gap-4">
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
