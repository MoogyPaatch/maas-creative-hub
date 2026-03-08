import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import CreativeBrief from "./CreativeBrief";
import DCPresentation from "./DCPresentation";
import DCCopyResult from "./DCCopyResult";
import PPMPresentation from "./PPMPresentation";
import ValidationPanel from "./ValidationPanel";
import type { ChatMessage } from "@/types";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface Props {
  artifacts: ChatMessage[];
  onSelectPiste?: (pisteId: string) => void;
  onApprove?: (id: string, feedback: string | null) => void;
  onReject?: (id: string, feedback: string) => void;
}

const OutputPanel = ({ artifacts, onSelectPiste, onApprove, onReject }: Props) => {
  const typedArtifacts = artifacts.filter((a) => a.metadata?.type);
  const [activeIndex, setActiveIndex] = useState(typedArtifacts.length - 1);

  // Auto-select latest artifact when new ones arrive
  useEffect(() => {
    if (typedArtifacts.length > 0) {
      setActiveIndex(typedArtifacts.length - 1);
    }
  }, [typedArtifacts.length]);

  const activeArtifact = typedArtifacts[activeIndex] || null;

  if (!activeArtifact?.metadata) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Sparkles className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Espace créatif</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Les livrables créatifs apparaîtront ici au fil de la conversation — brief stratégique, pistes visuelles, PPM et assets finaux.
          </p>
        </motion.div>
      </div>
    );
  }

  const { metadata } = activeArtifact;

  const labels: Record<string, string> = {
    creative_brief: "Brief",
    dc_presentation: "Pistes DC",
    dc_copy_result: "Copy",
    ppm_presentation: "PPM",
    validation_required: "Validation",
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Artifact content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {metadata.type === "creative_brief" && metadata.content && (
            <CreativeBrief key={`brief-${activeIndex}`} content={metadata.content} />
          )}
          {metadata.type === "dc_presentation" && (
            <DCPresentation key={`dc-${activeIndex}`} metadata={metadata} onSelectPiste={onSelectPiste} />
          )}
          {metadata.type === "dc_copy_result" && (
            <DCCopyResult key={`copy-${activeIndex}`} metadata={metadata} />
          )}
          {metadata.type === "ppm_presentation" && (
            <PPMPresentation key={`ppm-${activeIndex}`} metadata={metadata} />
          )}
          {metadata.type === "validation_required" && onApprove && onReject && (
            <div key={`validation-${activeIndex}`} className="flex h-full items-center justify-center p-8">
              <ValidationPanel
                gate={metadata.gate || ""}
                validationId={metadata.validation_id || ""}
                content={metadata.content || ""}
                onApprove={onApprove}
                onReject={onReject}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Clickable artifact tabs */}
      {typedArtifacts.length > 1 && (
        <div className="flex justify-center border-t border-border bg-card/50 px-4 py-3 backdrop-blur-sm">
          <div className="flex gap-1.5 rounded-full border border-border bg-card px-2 py-1">
            {typedArtifacts.map((a, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  i === activeIndex
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {labels[a.metadata!.type] || a.metadata!.type}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputPanel;
