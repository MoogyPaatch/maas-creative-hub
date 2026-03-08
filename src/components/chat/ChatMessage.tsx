import { motion } from "framer-motion";
import type { ChatMessage } from "@/types";
import ReactMarkdown from "react-markdown";

interface Props {
  message: ChatMessage;
  isLast: boolean;
  onQuickReply?: (id: string) => void;
}

const ChatMessage = ({ message, isLast, onQuickReply }: Props) => {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
          <span className="text-xs font-bold text-primary-foreground">M</span>
        </div>
      )}

      <div className={`max-w-[85%] space-y-2 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-chat-user text-chat-user-foreground rounded-br-md"
              : "bg-chat-agent text-chat-agent-foreground rounded-bl-md"
          }`}
        >
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>

        {isLast && message.quickReplies && message.quickReplies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            {message.quickReplies.map((qr) => (
              <button
                key={qr.id}
                onClick={() => onQuickReply?.(qr.id)}
                className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary/5"
              >
                {qr.label}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
