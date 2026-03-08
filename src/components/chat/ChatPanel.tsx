import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatMessageBubble from "./ChatMessage";
import ChatInput from "./ChatInput";
import ThinkingIndicator from "./ThinkingIndicator";
import { ArrowDown } from "lucide-react";
import type { ChatMessage } from "@/types";
import logoBlack from "@/assets/logo-marcel-black.png";
import logoWhite from "@/assets/logo-marcel-white.png";

interface Props {
  messages: ChatMessage[];
  thinking: string | null;
  onSendMessage: (text: string) => void;
  onQuickReply: (id: string) => void;
  onAttach?: (files: FileList) => void;
  isStreaming: boolean;
}

const ChatPanel = ({ messages, thinking, onSendMessage, onQuickReply, onAttach, isStreaming }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
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

  const lastQRIndex = useMemo(
    () => messages.reduce((acc, msg, i) =>
      msg.role === "agent" && msg.quickReplies?.length ? i : acc, -1
    ),
    [messages]
  );

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
            <p className="text-[10px] text-muted-foreground font-medium">Agence créative IA</p>
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
            <ChatMessageBubble
              key={i}
              message={msg}
              showQuickReplies={i === lastQRIndex}
              onQuickReply={onQuickReply}
            />
          ))}
          <AnimatePresence>
            {thinking && <ThinkingIndicator label={thinking} />}
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

      <ChatInput onSend={onSendMessage} onAttach={onAttach} disabled={isStreaming} />
    </div>
  );
};

export default ChatPanel;
