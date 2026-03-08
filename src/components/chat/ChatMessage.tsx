import { motion } from "framer-motion";
import type { ChatMessage as ChatMessageType } from "@/types";
import ReactMarkdown from "react-markdown";
import { useState } from "react";

interface Props {
  message: ChatMessageType;
  showQuickReplies: boolean;
  onQuickReply?: (id: string) => void;
}

const ChatMessageBubble = ({ message, showQuickReplies, onQuickReply }: Props) => {
  const isUser = message.role === "user";
  const [hovered, setHovered] = useState(false);

  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`group flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isUser && (
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary" aria-hidden>
          <span className="text-xs font-bold text-primary-foreground">M</span>
          {/* Glow pulse */}
          <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-20" style={{ animationDuration: "3s" }} />
        </div>
      )}

      <div className={`max-w-[85%] space-y-2 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed transition-shadow duration-200 ${
            isUser
              ? "bg-chat-user text-chat-user-foreground rounded-br-md shadow-sm"
              : "bg-chat-agent text-chat-agent-foreground rounded-bl-md hover:shadow-md"
          }`}
        >
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5 prose-p:text-inherit prose-headings:text-inherit prose-strong:text-inherit prose-li:text-inherit prose-a:text-primary">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>

        {/* Timestamp on hover */}
        {time && (
          <motion.span
            initial={false}
            animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : -4 }}
            transition={{ duration: 0.15 }}
            className={`block text-[10px] text-muted-foreground/60 ${isUser ? "text-right pr-1" : "pl-1"}`}
          >
            {time}
          </motion.span>
        )}

        {showQuickReplies && !isUser && message.quickReplies && message.quickReplies.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
            className="flex flex-wrap gap-2 pt-1"
            role="group"
            aria-label="Réponses rapides"
          >
            {message.quickReplies.map((qr) => (
              <motion.button
                key={qr.id}
                variants={{
                  hidden: { opacity: 0, y: 8, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
                onClick={() => onQuickReply?.(qr.id)}
                className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary/5 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5 active:scale-95"
              >
                {qr.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessageBubble;
