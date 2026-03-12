import { motion } from "framer-motion";
import { CheckCircle2, MessageSquare, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  gate: string;
  validationId: string;
  content: string;
  onApprove: (id: string, feedback: string | null) => Promise<void> | void;
  onReject: (id: string, feedback: string) => Promise<void> | void;
}

const ValidationPanel = ({ gate, validationId, content, onApprove, onReject }: Props) => {
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitted, setSubmitted] = useState<"approved" | "rejected" | null>(null);
  const [submittedFeedback, setSubmittedFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const gateLabels: Record<string, string> = {
    brief_creatif: "Brief Créatif",
    dc_visual: "Direction Créative",
    piste_creative: "Direction Créative",
    ppm: "Pré-Production",
    ppm_valide: "Pré-Production",
    masters: "Validation Masters",
    assets_finaux: "Assets Finaux",
    asset_upload: "Upload Assets",
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(validationId, null);
      setSubmitted("approved");
      toast.success("Validation approuvée");
    } catch {
      toast.error("Erreur lors de l'approbation");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) return;
    setLoading(true);
    try {
      await onReject(validationId, feedback.trim());
      setSubmittedFeedback(feedback.trim());
      setSubmitted("rejected");
      toast.success("Modifications demandées");
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
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

      {submitted ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            {submitted === "approved" ? "Validation approuvée" : "Modifications demandées"}
          </div>
          {submitted === "rejected" && submittedFeedback && (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              {submittedFeedback}
            </div>
          )}
        </div>
      ) : showFeedback ? (
        <div className="space-y-3">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Décrivez les modifications souhaitées..."
            className="h-24 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={!feedback.trim() || loading}
              className="flex items-center gap-2 rounded-lg bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Envoyer les modifications
            </button>
            <button
              onClick={() => setShowFeedback(false)}
              disabled={loading}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approuver
          </button>
          <button
            onClick={() => setShowFeedback(true)}
            disabled={loading}
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
