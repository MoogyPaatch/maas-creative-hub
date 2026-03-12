import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatMessageBubble from "./ChatMessage";
import ChatInput from "./ChatInput";
import type { ChatInputHandle } from "./ChatInput";
import ThinkingIndicator from "./ThinkingIndicator";
import type { ThinkingState } from "./ThinkingIndicator";
import { ArrowDown } from "lucide-react";
import type { ChatMessage } from "@/types";
import logoBlack from "@/assets/logo-marcel-black.png";
import logoWhite from "@/assets/logo-marcel-white.png";

interface Props {
  messages: ChatMessage[];
  thinking: ThinkingState | null;
  onSendMessage: (text: string) => void;
  onQuickReply: (id: string) => void;
  onAttach?: (files: FileList) => void;
  isStreaming: boolean;
}

// Detect phase transition messages that mark the end of the brief intake
const BRIEF_VALIDATED_PATTERNS = [
  "brief_client_validate",
  "brief valide",
  "brief valid\u00e9",
  "production en cours",
  "lancement du pipeline",
];

function isBriefTransition(msg: ChatMessage): boolean {
  if (msg.role !== "agent") return false;
  const content = (msg.content || "").toLowerCase();
  const metaType = msg.metadata?.type?.toLowerCase() || "";
  const phase = msg.metadata?.supervisor_phase?.toLowerCase() || "";
  return (
    BRIEF_VALIDATED_PATTERNS.some((p) => content.includes(p) || metaType.includes(p)) ||
    phase === "planner" ||
    phase === "dc_visual"
  );
}

function PhaseDivider({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.5 }}
      animate={{ opacity: 1, scaleX: 1 }}
      className="flex items-center gap-3 py-3"
    >
      <div className="flex-1 border-t border-primary/30" />
      <span className="whitespace-nowrap rounded-full bg-primary/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
        {label}
      </span>
      <div className="flex-1 border-t border-primary/30" />
    </motion.div>
  );
}

const ChatPanel = ({ messages, thinking, onSendMessage, onQuickReply, onAttach, isStreaming }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking, scrollToBottom]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120);
  }, []);

  const lastQRIndex = useMemo(() => {
    const idx = messages.reduce((acc, msg, i) =>
      msg.role === "agent" && msg.quickReplies?.length ? i : acc, -1
    );
    // Hide quick replies if the user already responded after that agent message
    if (idx >= 0) {
      const hasUserReplyAfter = messages.slice(idx + 1).some((m) => m.role === "user");
      if (hasUserReplyAfter) return -1;
    }
    return idx;
  }, [messages]);

  // Track which messages have a divider after them (only the first transition)
  const dividerAfterIndex = useMemo(() => {
    for (let i = 0; i < messages.length; i++) {
      if (isBriefTransition(messages[i])) return i;
    }
    return -1;
  }, [messages]);

  const handleFocusInput = useCallback(() => {
    chatInputRef.current?.focusInput("Precisez votre reponse...");
  }, []);

  const handleTriggerFileUpload = useCallback(() => {
    chatInputRef.current?.triggerFileUpload();
  }, []);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <img src={logoBlack} alt="Marcel" className="h-7 w-auto dark:hidden" />
          <img src={logoWhite} alt="Marcel" className="h-7 w-auto hidden dark:block" />
          <div className="h-4 w-px bg-border" />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-foreground">Marcel AI</p>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" style={{ animationDuration: "2s" }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">Agence creative IA</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="relative flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 space-y-4 overflow-y-auto p-5 scrollbar-thin"
          role="log"
          aria-label="Conversation"
        >
          {messages.map((msg, i) => (
            <div key={i}>
              <ChatMessageBubble
                message={msg}
                showQuickReplies={i === lastQRIndex}
                onQuickReply={onQuickReply}
                onFocusInput={handleFocusInput}
                onTriggerFileUpload={handleTriggerFileUpload}
              />
              {i === dividerAfterIndex && (
                <PhaseDivider label="Brief valide \u2014 Production en cours" />
              )}
            </div>
          ))}
          <AnimatePresence>
            {thinking && <ThinkingIndicator thinkingState={thinking} />}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 z-10 flex h-8 w-8 items-center justify-center border border-border bg-background transition-colors hover:bg-secondary"
              aria-label="Aller en bas"
            >
              <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <ChatInput ref={chatInputRef} onSend={onSendMessage} onAttach={onAttach} disabled={isStreaming} />
    </div>
  );
};

export default ChatPanel;
