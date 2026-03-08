import { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Loader2, Check, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ChatMessage, BriefData } from "@/types";

interface BriefField {
  key: keyof BriefData;
  label: string;
  type: "text" | "tags" | "textarea";
  placeholder: string;
}

const BRIEF_FIELDS: BriefField[] = [
  { key: "brand", label: "Marque", type: "text", placeholder: "Ex : Brooks, Nike, Sephora…" },
  { key: "product", label: "Produit / Service", type: "text", placeholder: "Ex : Nouvelle chaussure de trail" },
  { key: "objective", label: "Objectif", type: "textarea", placeholder: "Ex : Lancement produit, notoriété, conversion…" },
  { key: "audience", label: "Audience cible", type: "text", placeholder: "Ex : Runners 25-45 ans, urbains" },
  { key: "key_message", label: "Message clé", type: "textarea", placeholder: "Ex : La chaussure qui s'adapte à tous les terrains" },
  { key: "tone", label: "Ton / Territoire", type: "tags", placeholder: "Ex : Inspirant, audacieux, expert" },
  { key: "channels", label: "Canaux", type: "tags", placeholder: "Ex : Instagram, TV, Affichage" },
  { key: "budget", label: "Budget", type: "text", placeholder: "Ex : 500K€, À définir" },
  { key: "timing", label: "Timing", type: "text", placeholder: "Ex : Lancement mars 2026" },
  { key: "kpis", label: "KPIs", type: "tags", placeholder: "Ex : Reach, Engagement, Ventes" },
];

/**
 * Extract structured brief fields from agent messages.
 * The agent reformulates user input — we parse the agent's understanding.
 */
function extractBriefFromMessages(messages: ChatMessage[]): Partial<BriefData> {
  const brief: Partial<BriefData> = {};
  const agentMessages = messages
    .filter((m) => m.role === "agent")
    .map((m) => m.content)
    .join("\n\n");

  const patterns: Record<string, RegExp[]> = {
    brand: [
      /(?:marque|brand|client)\s*[:：]\s*(.+)/i,
      /(?:pour|chez|de la marque)\s+([A-Z][a-zA-Zé]+)/,
    ],
    product: [
      /(?:produit|product|offre|service)\s*[:：]\s*(.+)/i,
      /(?:lancement|lancer|nouveau(?:x|lle)?)\s+(.+?)(?:\.|,|$)/i,
    ],
    objective: [
      /(?:objectif|objective|but|goal)\s*[:：]\s*(.+)/i,
      /(?:l'objectif est|on vise|pour)\s+(.+?)(?:\.|$)/i,
    ],
    audience: [
      /(?:audience|cible|target|public)\s*[:：]\s*(.+)/i,
      /(?:cibl(?:e|er|ant)|destiné[es]? (?:à|aux))\s+(.+?)(?:\.|,|$)/i,
    ],
    key_message: [
      /(?:message\s*cl[ée]|key.?message|insight)\s*[:：]\s*(.+)/i,
    ],
    tone: [
      /(?:ton|tone|tonalité|territoire)\s*[:：]\s*(.+)/i,
    ],
    channels: [
      /(?:canaux|channels?|médias?|supports?)\s*[:：]\s*(.+)/i,
    ],
    budget: [
      /(?:budget)\s*[:：]\s*(.+)/i,
    ],
    timing: [
      /(?:timing|calendrier|deadline|échéance|date)\s*[:：]\s*(.+)/i,
    ],
    kpis: [
      /(?:kpis?|indicateurs?)\s*[:：]\s*(.+)/i,
    ],
  };

  for (const [field, regexes] of Object.entries(patterns)) {
    for (const re of regexes) {
      const match = agentMessages.match(re);
      if (match?.[1]) {
        const value = match[1].trim();
        if (["tone", "channels", "kpis"].includes(field)) {
          (brief as any)[field] = value.split(/[,;\/]/).map((s: string) => s.trim()).filter(Boolean);
        } else {
          (brief as any)[field] = value;
        }
        break;
      }
    }
  }

  return brief;
}

interface Props {
  messages: ChatMessage[];
  onBriefChange?: (brief: Partial<BriefData>) => void;
}

const LiveBriefPreview = ({ messages, onBriefChange }: Props) => {
  const extracted = useMemo(() => extractBriefFromMessages(messages), [messages]);
  const [overrides, setOverrides] = useState<Partial<BriefData>>({});
  const [editingField, setEditingField] = useState<string | null>(null);

  // Merge: overrides take priority over AI-extracted
  const merged = useMemo(() => {
    const result: Partial<BriefData> = { ...extracted };
    for (const [k, v] of Object.entries(overrides)) {
      if (v !== undefined && v !== "" && (!Array.isArray(v) || v.length > 0)) {
        (result as any)[k] = v;
      }
    }
    return result;
  }, [extracted, overrides]);

  useEffect(() => {
    onBriefChange?.(merged);
  }, [merged, onBriefChange]);

  const filledCount = BRIEF_FIELDS.filter((f) => {
    const val = merged[f.key];
    return val && (Array.isArray(val) ? val.length > 0 : String(val).length > 0);
  }).length;

  const progress = Math.round((filledCount / BRIEF_FIELDS.length) * 100);

  const handleFieldChange = useCallback((key: string, value: string) => {
    const field = BRIEF_FIELDS.find((f) => f.key === key);
    if (field?.type === "tags") {
      setOverrides((prev) => ({ ...prev, [key]: value.split(",").map((s) => s.trim()).filter(Boolean) }));
    } else {
      setOverrides((prev) => ({ ...prev, [key]: value }));
    }
  }, []);

  const agentMessages = messages.filter((m) => m.role === "agent");
  const userMessages = messages.filter((m) => m.role === "user");
  const isCollecting = userMessages.length > 0;
  const hasAgentResponse = agentMessages.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto p-6 scrollbar-thin"
    >
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center bg-foreground">
              <FileText className="h-4 w-4 text-background" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Brief Client</h2>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {isCollecting ? "Rempli par Marcel AI en temps réel" : "En attente de vos informations"}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1 bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-foreground"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
              {filledCount}/{BRIEF_FIELDS.length}
            </span>
          </div>
        </div>

        {/* Brief fields */}
        <div className="space-y-1">
          {BRIEF_FIELDS.map((field, i) => {
            const val = merged[field.key];
            const displayValue = Array.isArray(val) ? val.join(", ") : String(val || "");
            const isFilled = displayValue.length > 0;
            const isEditing = editingField === field.key;

            return (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group"
              >
                <div
                  className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 transition-colors
                    ${isEditing ? "bg-muted/50" : "hover:bg-muted/30"}`}
                >
                  {/* Status dot */}
                  <div className="mt-1.5 shrink-0">
                    {isFilled ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex h-4 w-4 items-center justify-center bg-foreground"
                      >
                        <Check className="h-2.5 w-2.5 text-background" />
                      </motion.div>
                    ) : (
                      <div className="h-4 w-4 border border-border" />
                    )}
                  </div>

                  {/* Label + Value */}
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {field.label}
                    </label>

                    {isEditing ? (
                      <div className="mt-1">
                        {field.type === "textarea" ? (
                          <textarea
                            autoFocus
                            className="w-full bg-transparent border-none text-sm text-foreground resize-none outline-none placeholder:text-muted-foreground/50 min-h-[60px]"
                            value={displayValue}
                            placeholder={field.placeholder}
                            onChange={(e) => handleFieldChange(String(field.key), e.target.value)}
                            onBlur={() => setEditingField(null)}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") setEditingField(null);
                            }}
                          />
                        ) : (
                          <input
                            autoFocus
                            className="w-full bg-transparent border-none text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                            value={displayValue}
                            placeholder={field.placeholder}
                            onChange={(e) => handleFieldChange(String(field.key), e.target.value)}
                            onBlur={() => setEditingField(null)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "Escape") setEditingField(null);
                            }}
                          />
                        )}
                        {field.type === "tags" && (
                          <p className="text-[9px] text-muted-foreground mt-0.5">Séparez par des virgules</p>
                        )}
                      </div>
                    ) : (
                      <div
                        className="mt-0.5 cursor-text flex items-center gap-2"
                        onClick={() => setEditingField(field.key)}
                      >
                        {isFilled ? (
                          field.type === "tags" && Array.isArray(val) ? (
                            <div className="flex flex-wrap gap-1.5">
                              {val.map((tag, ti) => (
                                <span
                                  key={ti}
                                  className="border border-border px-2 py-0.5 text-xs font-medium text-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-foreground leading-relaxed">{displayValue}</p>
                          )
                        ) : (
                          <p className="text-sm text-muted-foreground/40 italic">{field.placeholder}</p>
                        )}
                        <Pencil className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-colors shrink-0" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Hint */}
        {!isCollecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-xs text-muted-foreground">
              Décrivez votre projet dans le chat — Marcel remplira ce brief automatiquement.
              <br />
              <span className="text-muted-foreground/60">Vous pouvez aussi cliquer sur chaque champ pour le remplir manuellement.</span>
            </p>
          </motion.div>
        )}

        {/* Collecting indicator */}
        {isCollecting && hasAgentResponse && filledCount < BRIEF_FIELDS.length && (
          <div className="mt-6 flex items-center gap-2 justify-center">
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Marcel analyse vos échanges…
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LiveBriefPreview;
