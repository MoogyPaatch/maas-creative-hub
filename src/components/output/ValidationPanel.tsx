import { motion } from "framer-motion";
import { CheckCircle2, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useState } from "react";

interface Props {
  gate: string;
  validationId: string;
  content: string;
  onApprove: (id: string, feedback: string | null) => void;
  onReject: (id: string, feedback: string) => void;
}

const ValidationPanel = ({ gate, validationId, content, onApprove, onReject }: Props) => {
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const gateLabels: Record<string, string> = {
    brief_creatif: "Brief Créatif",
    dc_visual: "Direction Créative",
    ppm: "Pré-Production",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl rounded-2xl border-2 border-warning/30 bg-warning/5 p-6"
    >
      <div className="mb-4">
        <span className="rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning">
          Validation requise
        </span>
        <h3 className="mt-3 text-lg font-bold text-foreground">
          {gateLabels[gate] || gate}
        </h3>
      </div>

      {content && (
        <div className="mb-6 max-h-64 overflow-y-auto rounded-xl border border-border bg-card p-5 prose prose-sm max-w-none scrollbar-thin">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}

      {showFeedback ? (
        <div className="space-y-3">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Décrivez les modifications souhaitées..."
            className="h-24 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (feedback.trim()) onReject(validationId, feedback.trim());
              }}
              disabled={!feedback.trim()}
              className="rounded-lg bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
            >
              Envoyer les modifications
            </button>
            <button
              onClick={() => setShowFeedback(false)}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => onApprove(validationId, null)}
            className="flex items-center gap-2 rounded-lg bg-success px-6 py-2.5 text-sm font-semibold text-success-foreground transition-all hover:bg-success/90 hover:shadow-md"
          >
            <CheckCircle2 className="h-4 w-4" /> Approuver
          </button>
          <button
            onClick={() => setShowFeedback(true)}
            className="flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <MessageSquare className="h-4 w-4" /> Demander des modifications
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ValidationPanel;
