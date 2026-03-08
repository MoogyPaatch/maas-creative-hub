import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, MessageSquare, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/types";

interface Props {
  messages: ChatMessage[];
}

/**
 * Instead of regex-parsing user input, we display the agent's
 * interpreted summaries. The backend AI already understands context
 * and reformulates — we just present its understanding cleanly.
 */
function extractAgentSummary(messages: ChatMessage[]): {
  agentUnderstanding: string | null;
  questionsAsked: string[];
  userInputs: string[];
  phase: "waiting" | "collecting" | "confirming";
} {
  const agentMessages = messages.filter((m) => m.role === "agent");
  const userMessages = messages.filter((m) => m.role === "user" && !m.content.startsWith("📎"));

  // The agent's last substantive message contains its current understanding
  const lastAgent = agentMessages.length > 0 ? agentMessages[agentMessages.length - 1] : null;

  // Find the agent message that contains a brief summary (usually starts with "Je retiens", "J'ai bien reçu", etc.)
  const summaryPatterns = [
    /je retiens\b/i,
    /j'ai bien re[cç]u/i,
    /voici ce que j'ai compris/i,
    /récapitul/i,
    /brief.*:/i,
    /campagne\s+(?:sur|pour)\s+/i,
  ];

  let agentUnderstanding: string | null = null;

  // Search from most recent to oldest for a summary
  for (let i = agentMessages.length - 1; i >= 0; i--) {
    const content = agentMessages[i].content;
    if (summaryPatterns.some((p) => p.test(content))) {
      agentUnderstanding = content;
      break;
    }
  }

  // If no explicit summary, use the last agent message if it's not just a greeting
  if (!agentUnderstanding && lastAgent && lastAgent.content.length > 60) {
    agentUnderstanding = lastAgent.content;
  }

  // Extract questions the agent has asked (lines ending with ?)
  const questionsAsked: string[] = [];
  agentMessages.forEach((m) => {
    const lines = m.content.split("\n");
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.endsWith("?") && trimmed.length > 15) {
        questionsAsked.push(trimmed);
      }
    });
  });

  // User inputs (for context display)
  const userInputs = userMessages
    .map((m) => m.content)
    .filter((c) => c.length > 5);

  // Determine phase
  let phase: "waiting" | "collecting" | "confirming" = "waiting";
  if (userMessages.length === 0) {
    phase = "waiting";
  } else if (lastAgent?.content.match(/confirm|c'est bon|on continue|valide/i)) {
    phase = "confirming";
  } else {
    phase = "collecting";
  }

  return { agentUnderstanding, questionsAsked, userInputs, phase };
}

const phaseConfig = {
  waiting: { label: "En attente de vos informations", color: "text-muted-foreground" },
  collecting: { label: "Collecte d'informations en cours", color: "text-foreground" },
  confirming: { label: "En attente de confirmation", color: "text-accent" },
};

const LiveBriefPreview = ({ messages }: Props) => {
  const { agentUnderstanding, questionsAsked, userInputs, phase } = useMemo(
    () => extractAgentSummary(messages),
    [messages]
  );

  const config = phaseConfig[phase];

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
              <p className="text-xs font-medium text-muted-foreground">
                Interprété par Marcel AI en temps réel
              </p>
            </div>
          </div>

          {/* Phase indicator */}
          <div className="flex items-center gap-2">
            {phase === "collecting" && (
              <Loader2 className="h-3 w-3 animate-spin text-foreground" />
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Agent's understanding — the AI-interpreted brief */}
        {agentUnderstanding ? (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Compréhension de Marcel
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={agentUnderstanding.slice(0, 50)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border p-6"
              >
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {agentUnderstanding}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div className="mb-8 border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Décrivez votre projet dans le chat — Marcel interprétera et structurera votre brief ici.
            </p>
          </div>
        )}

        {/* What Marcel is asking */}
        {questionsAsked.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Questions posées par Marcel
              </span>
            </div>
            <div className="space-y-2">
              {questionsAsked.slice(-5).map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-l-2 border-border pl-4 py-1"
                >
                  <p className="text-xs text-muted-foreground leading-relaxed">{q}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* User inputs summary */}
        {userInputs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Vos informations
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {userInputs.slice(-6).map((input, i) => (
                <span
                  key={i}
                  className="border border-border px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  {input.length > 60 ? input.slice(0, 60) + "…" : input}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LiveBriefPreview;
