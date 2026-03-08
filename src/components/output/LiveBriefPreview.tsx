import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Loader2, Check, Pencil, ChevronDown, Send } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import type { ClientBriefDraft } from "@/types";
import {
  CLIENT_BRIEF_FIELD_DEFS,
  CLIENT_BRIEF_REQUIRED_FIELDS,
  CLIENT_BRIEF_ENRICHMENT_FIELDS,
} from "@/types";

interface Props {
  briefDraft: ClientBriefDraft;
  changedFields?: Set<string>;
  onFieldChange?: (key: keyof ClientBriefDraft, value: string) => void;
  onValidate?: () => void;
  isStreaming?: boolean;
}

const EMPTY_DRAFT: ClientBriefDraft = {
  brand: null, product: null, objective: null, target: null, tone: null,
  formats: null, promise: null, reason_to_believe: null,
  creative_references: null, constraints: null, additional_context: null,
};

const LiveBriefPreview = ({
  briefDraft,
  changedFields,
  onFieldChange,
  onValidate,
  isStreaming = false,
}: Props) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  const draft = briefDraft || EMPTY_DRAFT;

  const requiredFields = CLIENT_BRIEF_FIELD_DEFS.filter((f) => f.tier === "required");
  const quasiFields = CLIENT_BRIEF_FIELD_DEFS.filter((f) => f.tier === "quasi");
  const enrichmentFields = CLIENT_BRIEF_FIELD_DEFS.filter((f) => f.tier === "enrichment");

  const allMainFields = [...requiredFields, ...quasiFields];

  const filledCount = CLIENT_BRIEF_FIELD_DEFS.filter((f) => {
    const val = draft[f.key];
    return val && val.trim().length > 0;
  }).length;
  const totalFields = CLIENT_BRIEF_FIELD_DEFS.length;
  const progress = Math.round((filledCount / totalFields) * 100);

  const canValidate = CLIENT_BRIEF_REQUIRED_FIELDS.every((k) => {
    const val = draft[k];
    return val && val.trim().length > 0;
  });

  // Check if enrichment section has any values
  const hasEnrichmentValues = CLIENT_BRIEF_ENRICHMENT_FIELDS.some((k) => {
    const val = draft[k];
    return val && val.trim().length > 0;
  });

  const [enrichmentOpen, setEnrichmentOpen] = useState(hasEnrichmentValues);

  const renderField = useCallback(
    (field: (typeof CLIENT_BRIEF_FIELD_DEFS)[0], index: number) => {
      const val = draft[field.key] || "";
      const isFilled = val.trim().length > 0;
      const isEditing = editingField === field.key;
      const justChanged = changedFields?.has(field.key);

      return (
        <motion.div
          key={field.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02 }}
          className="group"
        >
          <div
            className={`relative flex items-start gap-3 px-4 py-3 border-b border-border/50 transition-colors
              ${isEditing ? "bg-muted/50" : "hover:bg-muted/30"}
              ${justChanged ? "animate-brief-field-flash" : ""}`}
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
                {field.tier === "required" && (
                  <span className="ml-1 text-destructive">*</span>
                )}
              </label>

              {isEditing ? (
                <div className="mt-1">
                  <textarea
                    autoFocus
                    className="w-full bg-transparent border-none text-sm text-foreground resize-none outline-none placeholder:text-muted-foreground/50 min-h-[40px]"
                    value={val}
                    placeholder={field.placeholder}
                    rows={field.key === "additional_context" ? 3 : 1}
                    onChange={(e) => onFieldChange?.(field.key, e.target.value)}
                    onBlur={() => setEditingField(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingField(null);
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        setEditingField(null);
                      }
                    }}
                  />
                </div>
              ) : (
                <div
                  className="mt-0.5 cursor-text flex items-center gap-2"
                  onClick={() => setEditingField(field.key)}
                >
                  {isFilled ? (
                    <p className="text-sm text-foreground leading-relaxed">{val}</p>
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
    },
    [draft, editingField, changedFields, onFieldChange]
  );

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
                Rempli par Marcel AI en temps réel
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
              {filledCount}/{totalFields}
            </span>
          </div>
        </div>

        {/* Required + Quasi fields */}
        <div className="space-y-0">
          {allMainFields.map((field, i) => renderField(field, i))}
        </div>

        {/* Enrichment — collapsible */}
        <Collapsible open={enrichmentOpen} onOpenChange={setEnrichmentOpen} className="mt-4">
          <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${enrichmentOpen ? "rotate-0" : "-rotate-90"}`}
            />
            Détails supplémentaires
            {hasEnrichmentValues && (
              <span className="ml-auto text-[10px] font-medium text-foreground/60">
                {CLIENT_BRIEF_ENRICHMENT_FIELDS.filter((k) => draft[k]?.trim()).length}/{CLIENT_BRIEF_ENRICHMENT_FIELDS.length}
              </span>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-0">
              {enrichmentFields.map((field, i) => renderField(field, allMainFields.length + i))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Validate button */}
        {onValidate && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={onValidate}
              disabled={!canValidate || isStreaming}
              className={`flex items-center gap-2 px-8 py-3 text-sm font-bold uppercase tracking-wider transition-all ${
                canValidate && !isStreaming
                  ? "bg-foreground text-background hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <Send className="h-4 w-4" />
              Valider le Brief
            </button>
            {!canValidate && (
              <p className="mt-2 text-[10px] text-muted-foreground text-center absolute -bottom-6">
                Les 5 champs obligatoires (*) doivent être remplis
              </p>
            )}
          </div>
        )}

        {/* Streaming indicator */}
        {isStreaming && filledCount < totalFields && (
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
