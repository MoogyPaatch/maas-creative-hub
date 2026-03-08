import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Clock } from "lucide-react";
import type { ConversationSummary } from "@/types";

interface Props {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const ConversationHistory = ({ conversations, activeId, onSelect, onClose }: Props) => {
  if (conversations.length <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-y-0 left-0 z-20 w-64 border-r border-border bg-card shadow-xl"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Conversations</h3>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Fermer
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
          {conversations.map((conv, i) => (
            <button
              key={conv.conversation_id}
              onClick={() => onSelect(conv.conversation_id)}
              className={`w-full rounded-lg px-3 py-2.5 text-left transition-all ${
                conv.conversation_id === activeId
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "hover:bg-muted text-foreground border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium truncate">
                  {conv.target_agent
                    ? `Session ${conv.target_agent}`
                    : `Conversation ${conversations.length - i}`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(conv.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {conv.message_count > 0 && (
                  <span className="ml-auto">{conv.message_count} msg</span>
                )}
              </div>
              {conv.last_message_preview && (
                <p className="mt-1 text-[10px] text-muted-foreground/70 truncate">
                  {conv.last_message_preview}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ConversationHistory;
