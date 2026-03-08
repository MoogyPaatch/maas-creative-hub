import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  createConversation,
  getConversation,
  getProject,
  getProjectStatus,
  getBrief,
  sendMessageSSE,
  approveValidation,
  rejectValidation,
} from "@/lib/api";
import { parseSSEStream } from "@/lib/sse";
import ChatPanel from "@/components/chat/ChatPanel";
import OutputPanel from "@/components/output/OutputPanel";
import WorkflowStepper from "@/components/layout/WorkflowStepper";
import type { ChatMessage, ProjectStatus, PipelineStep } from "@/types";
import { ArrowLeft, Loader2 } from "lucide-react";

const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [artifacts, setArtifacts] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus | null>(null);
  const [briefData, setBriefData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<"chat" | "output">("chat");

  // Initialize conversation
  useEffect(() => {
    if (!id || !user) return;

    const isAgency = user?.role === "agency" || user?.role === "admin";

    const init = async () => {
      try {
        const [status, project] = await Promise.all([
          getProjectStatus(id).catch(() => null),
          getProject(id),
        ]);
        if (status) setProjectStatus(status);
        getBrief(id).then(setBriefData).catch(() => {});

        const currentStep = status?.current_step || project.supervisor_phase || "commercial";
        const targetAgent = isAgency ? (currentStep || "commercial") : null;

        // Try to load existing conversation first
        let conv: any = null;
        if (project.latest_conversation_id) {
          conv = await getConversation(project.latest_conversation_id).catch(() => null);
        }
        // Fallback: create new conversation with correct target_agent
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

        const existingArtifacts: ChatMessage[] = (conv.artifacts || []).map((a: any) => ({
          role: "agent",
          content: a.content || "",
          metadata: a.metadata,
        }));
        setArtifacts(existingArtifacts);
      } catch (err) {
        console.error("Init error:", err);
        toast.error("Erreur de chargement du projet");
        try {
          const isAgency = user?.role === "agency" || user?.role === "admin";
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
  }, [id, user]);

  const handleSSEStream = useCallback(async (stream: ReadableStream<Uint8Array> | null) => {
    if (!stream) return;
    setIsStreaming(true);
    setThinking("Traitement en cours...");

    await parseSSEStream(
      stream,
      (msg) => {
        setThinking(null);
        setMessages((prev) => [...prev, msg]);
        // Check for artifacts
        if (msg.metadata?.type) {
          setArtifacts((prev) => [...prev, msg]);
          setMobileTab("output"); // Auto-switch on mobile
        }
      },
      () => {
        setThinking(null);
        setIsStreaming(false);
        // Refresh project status and brief
        if (id) {
          getProjectStatus(id).then(setProjectStatus).catch(() => {});
          getBrief(id).then(setBriefData).catch(() => {});
        }
      },
      (label) => setThinking(label)
    );
  }, [id]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!conversationId) return;
    setMessages((prev) => [...prev, { role: "user", content: text, timestamp: new Date() }]);
    try {
      const stream = await sendMessageSSE(conversationId, "text", text);
      await handleSSEStream(stream);
    } catch (err) {
      toast.error("Impossible d'envoyer le message. Vérifiez votre connexion.");
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: "Désolé, une erreur est survenue. Veuillez réessayer." },
      ]);
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
      toast.error("Erreur lors de l'envoi de la réponse rapide");
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
      toast.error("Erreur lors de la sélection de la piste");
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

  // File attach placeholder
  const handleAttach = useCallback((files: FileList) => {
    const names = Array.from(files).map(f => f.name).join(", ");
    toast.info(`Fichier(s) reçu(s) : ${names} — l'upload sera disponible prochainement.`);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/projects")}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="hidden sm:flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-primary-foreground">M</span>
          </div>
          <span className="hidden sm:inline text-sm font-semibold text-foreground">
            {projectStatus?.project_name || "Nouvelle campagne"}
          </span>
        </div>

        <div className="flex-1 px-2 sm:px-8 overflow-hidden">
          <WorkflowStepper
            pipeline={projectStatus?.pipeline || []}
            currentStep={projectStatus?.current_step || "commercial"}
          />
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{user?.email}</span>
        </div>
      </header>

      {/* Desktop: Split View */}
      <div className="hidden md:flex flex-1 overflow-hidden">
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
          <OutputPanel
            artifacts={artifacts}
            briefData={briefData}
            onSelectPiste={handleSelectPiste}
            onApprove={handleApprove}
            onReject={handleReject}
            currentStep={projectStatus?.current_step || "commercial"}
          />
        </div>
      </div>

      {/* Mobile: Tabbed View */}
      <div className="flex flex-col flex-1 overflow-hidden md:hidden">
        <div className="flex border-b border-border bg-card">
          <button
            onClick={() => setMobileTab("chat")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              mobileTab === "chat" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            Conversation
          </button>
          <button
            onClick={() => setMobileTab("output")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              mobileTab === "output" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            Livrables {artifacts.length > 0 && `(${artifacts.length})`}
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
            <OutputPanel
              artifacts={artifacts}
              briefData={briefData}
              onSelectPiste={handleSelectPiste}
              onApprove={handleApprove}
              onReject={handleReject}
              currentStep={projectStatus?.current_step || "commercial"}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
