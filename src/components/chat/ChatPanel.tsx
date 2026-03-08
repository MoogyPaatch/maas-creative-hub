import { useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import ChatMessageBubble from "./ChatMessage";
import ChatInput from "./ChatInput";
import ThinkingIndicator from "./ThinkingIndicator";
import type { ChatMessage } from "@/types";

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary" aria-hidden>
            <span className="text-xs font-bold text-primary-foreground">M</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Marcel AI</p>
            <p className="text-[10px] text-muted-foreground">Agence créative IA</p>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin"
        role="log"
        aria-label="Conversation"
      >
        {messages.map((msg, i) => (
          <ChatMessageBubble
            key={i}
            message={msg}
            isLast={i === messages.length - 1}
            onQuickReply={onQuickReply}
          />
        ))}
        <AnimatePresence>
          {thinking && <ThinkingIndicator label={thinking} />}
        </AnimatePresence>
      </div>

      <ChatInput onSend={onSendMessage} onAttach={onAttach} disabled={isStreaming} />
    </div>
  );
};

export default ChatPanel;
