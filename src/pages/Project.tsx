import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  createConversation,
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
  const [loading, setLoading] = useState(true);

  // Initialize conversation
  useEffect(() => {
    if (!id || !user) return;

    const isAgency = user?.role === "agency" || user?.role === "admin";

    const init = async () => {
      try {
        // Try to get existing project status
        const status = await getProjectStatus(id).catch(() => null);
        if (status) setProjectStatus(status);

        // Get project to find latest conversation
        const project = await getProject(id);
        if (project.latest_conversation_id) {
          // Create conversation to get messages
          const conv = await createConversation(id, isAgency, isAgency ? (project.supervisor_phase || "commercial") : null);
          setConversationId(conv.conversation_id);
          
          // Map existing messages
          const existingMessages: ChatMessage[] = (conv.messages || []).map((m: any) => ({
            role: m.role === "user" ? "user" : "agent",
            content: m.content || "",
            quickReplies: m.quick_replies?.map((qr: any) => ({ id: qr.id, label: qr.label })),
            metadata: m.metadata,
          }));
          setMessages(existingMessages);

          // Artifacts
          const existingArtifacts: ChatMessage[] = (conv.artifacts || []).map((a: any) => ({
            role: "agent",
            content: a.content || "",
            metadata: a.metadata,
          }));
          setArtifacts(existingArtifacts);
        } else {
          // New conversation
          const conv = await createConversation(id, isAgency, isAgency ? "commercial" : null);
          setConversationId(conv.conversation_id);
          const existingMessages: ChatMessage[] = (conv.messages || []).map((m: any) => ({
            role: m.role === "user" ? "user" : "agent",
            content: m.content || "",
            quickReplies: m.quick_replies?.map((qr: any) => ({ id: qr.id, label: qr.label })),
            metadata: m.metadata,
          }));
          setMessages(existingMessages);
        }
      } catch (err) {
        console.error("Init error:", err);
        // Fallback: create new conversation
        try {
          const conv = await createConversation(id, isAgency, isAgency ? "commercial" : null);
          setConversationId(conv.conversation_id);
          const existingMessages: ChatMessage[] = (conv.messages || []).map((m: any) => ({
            role: m.role === "user" ? "user" : "agent",
            content: m.content || "",
            quickReplies: m.quick_replies?.map((qr: any) => ({ id: qr.id, label: qr.label })),
            metadata: m.metadata,
          }));
          setMessages(existingMessages);
        } catch {
          // ignore
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
        }
      },
      () => {
        setThinking(null);
        setIsStreaming(false);
        // Refresh project status
        if (id) {
          getProjectStatus(id).then(setProjectStatus).catch(() => {});
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
    // Find label for display
    const lastAgentMsg = [...messages].reverse().find((m) => m.role === "agent" && m.quickReplies);
    const label = lastAgentMsg?.quickReplies?.find((qr) => qr.id === qrId)?.label || qrId;
    setMessages((prev) => [...prev, { role: "user", content: label, timestamp: new Date() }]);
    try {
      const stream = await sendMessageSSE(conversationId, "quick_reply", qrId);
      await handleSSEStream(stream);
    } catch {
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
      setIsStreaming(false);
      setThinking(null);
    }
  }, [conversationId, handleSSEStream]);

  const handleApprove = useCallback(async (validationId: string, feedback: string | null) => {
    try {
      const stream = await approveValidation(validationId, feedback);
      await handleSSEStream(stream);
    } catch {
      setIsStreaming(false);
    }
  }, [handleSSEStream]);

  const handleReject = useCallback(async (validationId: string, feedback: string) => {
    try {
      const stream = await rejectValidation(validationId, feedback);
      await handleSSEStream(stream);
    } catch {
      setIsStreaming(false);
    }
  }, [handleSSEStream]);

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
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-primary-foreground">M</span>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {projectStatus?.project_name || "Nouvelle campagne"}
          </span>
        </div>

        <div className="flex-1 px-8">
          <WorkflowStepper
            pipeline={projectStatus?.pipeline || []}
            currentStep={projectStatus?.current_step || "commercial"}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{user?.email}</span>
        </div>
      </header>

      {/* Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Panel - 40% */}
        <div className="w-[40%] min-w-[360px] border-r border-border">
          <ChatPanel
            messages={messages}
            thinking={thinking}
            onSendMessage={handleSendMessage}
            onQuickReply={handleQuickReply}
            isStreaming={isStreaming}
          />
        </div>

        {/* Output Panel - 60% */}
        <div className="relative flex-1">
          <OutputPanel
            artifacts={artifacts}
            onSelectPiste={handleSelectPiste}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
