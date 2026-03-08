import { AnimatePresence } from "framer-motion";
import CreativeBrief from "./CreativeBrief";
import DCPresentation from "./DCPresentation";
import DCCopyResult from "./DCCopyResult";
import PPMPresentation from "./PPMPresentation";
import ValidationPanel from "./ValidationPanel";
import type { ChatMessage, MessageMetadata } from "@/types";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface Props {
  artifacts: ChatMessage[];
  onSelectPiste?: (pisteId: string) => void;
  onApprove?: (id: string, feedback: string | null) => void;
  onReject?: (id: string, feedback: string) => void;
}

const OutputPanel = ({ artifacts, onSelectPiste, onApprove, onReject }: Props) => {
  // Find the latest meaningful artifact to display
  const latestArtifact = [...artifacts].reverse().find(
    (a) => a.metadata?.type
  );

  if (!latestArtifact?.metadata) {
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

  const { metadata } = latestArtifact;

  return (
    <div className="h-full bg-background">
      <AnimatePresence mode="wait">
        {metadata.type === "creative_brief" && metadata.content && (
          <CreativeBrief key="brief" content={metadata.content} />
        )}
        {metadata.type === "dc_presentation" && (
          <DCPresentation key="dc" metadata={metadata} onSelectPiste={onSelectPiste} />
        )}
        {metadata.type === "dc_copy_result" && (
          <DCCopyResult key="copy" metadata={metadata} />
        )}
        {metadata.type === "ppm_presentation" && (
          <PPMPresentation key="ppm" metadata={metadata} />
        )}
        {metadata.type === "validation_required" && onApprove && onReject && (
          <div key="validation" className="flex h-full items-center justify-center p-8">
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

      {/* Show all artifacts as tabs if multiple */}
      {artifacts.filter((a) => a.metadata?.type).length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="flex gap-1 rounded-full border border-border bg-card/80 px-2 py-1 backdrop-blur-sm">
            {artifacts
              .filter((a) => a.metadata?.type)
              .map((a, i) => {
                const labels: Record<string, string> = {
                  creative_brief: "Brief",
                  dc_presentation: "Pistes DC",
                  dc_copy_result: "Copy",
                  ppm_presentation: "PPM",
                  validation_required: "Validation",
                };
                return (
                  <span
                    key={i}
                    className={`rounded-full px-3 py-1 text-[10px] font-medium ${
                      a === latestArtifact
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {labels[a.metadata!.type] || a.metadata!.type}
                  </span>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputPanel;
