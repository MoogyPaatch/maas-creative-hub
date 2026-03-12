import { useState } from "react";
import { motion } from "framer-motion";
import {
  Video,
  Image as ImageIcon,
  Music,
  CheckCircle2,
  MessageSquare,
  Loader2,
  Play,
  Pause,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import type { MessageMetadata, ProductionAsset } from "@/types";

interface ChannelInfo {
  asset_ids: string[];
  urls?: string[];
  assembled_url?: string;
  url?: string;
  duration?: number;
  description: string;
}

interface Props {
  metadata: MessageMetadata;
  onApprove: (id: string, feedback: string | null) => Promise<void> | void;
  onReject: (id: string, feedback: string) => Promise<void> | void;
}

const channelIcons: Record<string, React.ElementType> = {
  video: Video,
  image: ImageIcon,
  audio: Music,
};

const channelLabels: Record<string, string> = {
  video: "Video",
  image: "Images",
  audio: "Audio",
};

/* ─── Video Player Card ─── */
function VideoCard({ url, description }: { url: string; description: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-video bg-muted">
        {url ? (
          <video
            src={url}
            className="h-full w-full object-contain"
            controls
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Video className="mr-2 h-6 w-6" />
            Video non disponible
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 px-4 py-3">
        {playing ? (
          <Pause className="h-4 w-4 text-primary" />
        ) : (
          <Play className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-sm text-foreground">{description}</span>
      </div>
    </div>
  );
}

/* ─── Image Gallery Card ─── */
function ImageGalleryCard({ urls, description }: { urls: string[]; description: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (urls.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
        <ImageIcon className="mr-2 h-6 w-6" />
        Images non disponibles
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[4/3] bg-muted">
        <img
          src={urls[selectedIndex]}
          alt={`Master image ${selectedIndex + 1}`}
          className="h-full w-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3 scrollbar-thin">
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                i === selectedIndex ? "border-primary" : "border-transparent hover:border-border"
              }`}
            >
              <img
                src={url}
                alt={`Thumbnail ${i + 1}`}
                className="h-14 w-14 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-foreground">{description}</span>
        {urls.length > 1 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {selectedIndex + 1}/{urls.length}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Audio Player Card ─── */
function AudioCard({ url, description }: { url: string; description: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="p-4">
        {url ? (
          <audio src={url} controls className="w-full" />
        ) : (
          <div className="flex h-16 items-center justify-center text-muted-foreground">
            <Music className="mr-2 h-6 w-6" />
            Audio non disponible
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        <Music className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-foreground">{description}</span>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
const MastersReview = ({ metadata, onApprove, onReject }: Props) => {
  const channels = (metadata.channels || {}) as Record<string, ChannelInfo>;
  const validationId = metadata.validation_id || "";
  const channelKeys = Object.keys(channels);
  const alreadyValidated = !!metadata.already_validated;

  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitted, setSubmitted] = useState<"approved" | "rejected" | null>(
    alreadyValidated ? "approved" : null,
  );
  const [submittedFeedback, setSubmittedFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(validationId, null);
      setSubmitted("approved");
      toast.success("Masters valides");
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
      toast.success("Modifications demandees");
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 border-b border-border bg-card/60 px-6 py-5 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Validation des Masters</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {channelKeys.length} canal{channelKeys.length > 1 ? "aux" : ""} produit{channelKeys.length > 1 ? "s" : ""}
              {" — "}Validez avant de lancer les declinaisons
            </p>
          </div>
        </div>
      </motion.div>

      {/* Channel Cards */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {channelKeys.map((channel, index) => {
          const info = channels[channel];
          const Icon = channelIcons[channel] || ImageIcon;
          const label = channelLabels[channel] || channel;
          const urls = info.urls || [];

          return (
            <motion.section
              key={channel}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {label}
                </h3>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {info.asset_ids.length} asset{info.asset_ids.length > 1 ? "s" : ""}
                </span>
              </div>

              {channel === "video" && (
                <VideoCard
                  url={info.assembled_url || (urls.length > 0 ? urls[0] : "")}
                  description={info.description}
                />
              )}

              {channel === "audio" && (
                <AudioCard
                  url={info.url || (urls.length > 0 ? urls[0] : "")}
                  description={info.description}
                />
              )}

              {(channel === "image" || channel === "print" || channel === "social" || channel === "digital") && (
                <ImageGalleryCard urls={urls} description={info.description} />
              )}

              {/* Fallback for unknown channel types */}
              {!["video", "audio", "image", "print", "social", "digital"].includes(channel) && (
                <ImageGalleryCard urls={urls} description={info.description} />
              )}
            </motion.section>
          );
        })}

        {channelKeys.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Aucun master produit pour le moment.
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 border-t border-border bg-card/60 px-6 py-4 backdrop-blur-sm">
        {submitted ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {submitted === "approved" ? "Masters valides" : "Modifications demandees"}
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
              placeholder="Decrivez les modifications souhaitees..."
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
              Valider les masters
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
      </div>
    </div>
  );
};

export default MastersReview;
