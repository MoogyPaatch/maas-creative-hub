import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, MessageSquare, Target, Megaphone, Users, DollarSign, Clock, Zap } from "lucide-react";
import type { ChatMessage } from "@/types";

interface Props {
  messages: ChatMessage[];
}

interface BriefField {
  key: string;
  label: string;
  icon: React.ElementType;
  value: string | null;
}

/**
 * Extracts brief-like information from conversation messages in real-time.
 * Parses agent responses to identify brand, product, objective, etc.
 */
function extractBriefFromMessages(messages: ChatMessage[]): BriefField[] {
  const allText = messages
    .filter((m) => m.role === "agent" || m.role === "user")
    .map((m) => m.content)
    .join("\n");

  const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content);
  const agentMessages = messages.filter((m) => m.role === "agent").map((m) => m.content);

  // Try to extract structured info from agent summaries
  const fields: BriefField[] = [];

  // Brand / Client
  const brandMatch = allText.match(/(?:marque|brand|client)\s*[:—]\s*(.+)/i)
    || agentMessages.join(" ").match(/campagne\s+(?:sur|pour)\s+(.+?)(?:\s+avec|\s*[.,])/i);
  fields.push({
    key: "brand",
    label: "Marque / Client",
    icon: Megaphone,
    value: brandMatch?.[1]?.trim() || null,
  });

  // Product
  const productMatch = allText.match(/(?:produit|product)\s*[:—]\s*(.+)/i);
  fields.push({
    key: "product",
    label: "Produit",
    icon: Target,
    value: productMatch?.[1]?.trim() || null,
  });

  // Objective
  const objectiveMatch = allText.match(/(?:objectif|objective|but)\s*[:—]\s*(.+)/i)
    || agentMessages.join(" ").match(/objectif\s+de\s+(.+?)(?:\.|$)/i);
  fields.push({
    key: "objective",
    label: "Objectif",
    icon: Zap,
    value: objectiveMatch?.[1]?.trim() || null,
  });

  // Target audience
  const audienceMatch = allText.match(/(?:cible|audience|target)\s*[:—]\s*(.+)/i);
  fields.push({
    key: "audience",
    label: "Cible",
    icon: Users,
    value: audienceMatch?.[1]?.trim() || null,
  });

  // Budget
  const budgetMatch = allText.match(/(?:budget)\s*[:—]\s*(.+)/i);
  fields.push({
    key: "budget",
    label: "Budget",
    icon: DollarSign,
    value: budgetMatch?.[1]?.trim() || null,
  });

  // Timing
  const timingMatch = allText.match(/(?:timing|deadline|calendrier|délai)\s*[:—]\s*(.+)/i);
  fields.push({
    key: "timing",
    label: "Timing",
    icon: Clock,
    value: timingMatch?.[1]?.trim() || null,
  });

  // If no structured data found, use the last substantive user message as context
  if (fields.every((f) => !f.value) && userMessages.length > 0) {
    const lastSubstantive = userMessages.filter((m) => m.length > 10 && !m.startsWith("📎")).pop();
    if (lastSubstantive) {
      fields[0].value = lastSubstantive;
    }
  }

  return fields;
}

const LiveBriefPreview = ({ messages }: Props) => {
  const fields = useMemo(() => extractBriefFromMessages(messages), [messages]);
  const filledFields = fields.filter((f) => f.value);
  const emptyFields = fields.filter((f) => !f.value);
  const progress = Math.round((filledFields.length / fields.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto p-8 scrollbar-thin"
    >
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center bg-foreground">
              <FileText className="h-5 w-5 text-background" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Brief en construction</h2>
              <p className="text-xs text-muted-foreground font-medium">
                Se remplit au fil de la conversation
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="h-1 flex-1 bg-secondary overflow-hidden">
              <motion.div
                className="h-full bg-foreground"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {filledFields.length}/{fields.length}
            </span>
          </div>
        </div>

        {/* Filled fields */}
        <div className="space-y-4 mb-8">
          <AnimatePresence mode="popLayout">
            {filledFields.map((field, i) => {
              const Icon = field.icon;
              return (
                <motion.div
                  key={field.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className="border border-border p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-3.5 w-3.5 text-foreground" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {field.label}
                    </span>
                  </div>
                  <p className="text-sm text-foreground font-medium leading-relaxed">{field.value}</p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty fields - what's still needed */}
        {emptyFields.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              En attente d'informations
            </p>
            <div className="grid grid-cols-2 gap-2">
              {emptyFields.map((field) => {
                const Icon = field.icon;
                return (
                  <div
                    key={field.key}
                    className="flex items-center gap-2 border border-dashed border-border p-3"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
                    <span className="text-xs text-muted-foreground/60 font-medium">{field.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Conversation summary */}
        {messages.length > 2 && (
          <div className="mt-8 border-t border-border pt-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Derniers échanges
              </span>
            </div>
            <div className="space-y-2">
              {messages.slice(-4).map((msg, i) => (
                <div
                  key={i}
                  className={`text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider mr-2">
                    {msg.role === "user" ? "Vous" : "Marcel"}
                  </span>
                  {msg.content.length > 120 ? msg.content.slice(0, 120) + "…" : msg.content}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LiveBriefPreview;
