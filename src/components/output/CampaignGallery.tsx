import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Package,
} from "lucide-react";
import type { MessageMetadata, ProductionAsset } from "@/types";

interface Props {
  metadata: MessageMetadata;
  onOpenCanvas?: () => void;
}

const sectionIcons: Record<string, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  document: FileText,
};

const sectionLabels: Record<string, string> = {
  image: "Images",
  video: "Vidéos",
  audio: "Audio",
  document: "Documents",
};

/* ─── Lightbox ─── */
function Lightbox({
  images,
  index,
  onClose,
  onNav,
}: {
  images: ProductionAsset[];
  index: number;
  onClose: () => void;
  onNav: (i: number) => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNav(Math.max(0, index - 1));
      if (e.key === "ArrowRight") onNav(Math.min(images.length - 1, index + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, images.length, onClose, onNav]);

  const img = images[index];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-foreground/10 p-2 text-white hover:bg-foreground/20 transition"
      >
        <X className="h-5 w-5" />
      </button>

      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNav(index - 1); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-foreground/10 p-3 text-white hover:bg-foreground/20 transition"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {index < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNav(index + 1); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-foreground/10 p-3 text-white hover:bg-foreground/20 transition"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      <motion.div
        key={img.id}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="max-h-[85vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={img.url}
          alt={img.title}
          className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
        />
        <div className="mt-3 text-center">
          <p className="text-sm font-medium text-white">{img.title}</p>
          <p className="text-xs text-white/50">{img.format}</p>
        </div>
      </motion.div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/40">
        {index + 1} / {images.length}
      </div>
    </motion.div>
  );
}

/* ─── Audio Player ─── */
function AudioPlayer({ asset }: { asset: ProductionAsset }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
    >
      <button
        onClick={toggle}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{asset.title}</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="shrink-0 text-xs text-muted-foreground">
        {asset.duration || asset.format}
      </div>
      <audio
        ref={audioRef}
        src={asset.url}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          setProgress(el.duration ? (el.currentTime / el.duration) * 100 : 0);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
    </motion.div>
  );
}

/* ─── Main Gallery ─── */
const CampaignGallery = ({ metadata, onOpenCanvas }: Props) => {
  const assets = metadata.production_assets || [];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const grouped = assets.reduce<Record<string, ProductionAsset[]>>((acc, a) => {
    (acc[a.type] = acc[a.type] || []).push(a);
    return acc;
  }, {});

  const images = grouped.image || [];
  const videos = grouped.video || [];
  const audios = grouped.audio || [];
  const documents = grouped.document || [];

  const stats = [
    images.length && `${images.length} image${images.length > 1 ? "s" : ""}`,
    videos.length && `${videos.length} vidéo${videos.length > 1 ? "s" : ""}`,
    audios.length && `${audios.length} audio`,
    documents.length && `${documents.length} doc${documents.length > 1 ? "s" : ""}`,
  ].filter(Boolean);

  const handleNav = useCallback((i: number) => setLightboxIndex(i), []);

  const sectionOrder: Array<"image" | "video" | "audio" | "document"> = ["image", "video", "audio", "document"];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 border-b border-border bg-card/60 px-6 py-5 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {metadata.campaign_title || "Assets de Campagne"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{stats.join(" · ")}</p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenCanvas && (
              <button
                onClick={onOpenCanvas}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition"
              >
                <PenTool className="h-4 w-4" />
                Canevas
              </button>
            )}
            {metadata.zip_url && (
              <a
                href={metadata.zip_url}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition"
              >
                <Package className="h-4 w-4" />
                Tout télécharger
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-10">
        {sectionOrder.map((type) => {
          const items = grouped[type];
          if (!items?.length) return null;
          const Icon = sectionIcons[type];

          return (
            <section key={type}>
              <div className="mb-4 flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {sectionLabels[type]}
                </h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {items.length}
                </span>
              </div>

              {/* Images Grid */}
              {type === "image" && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {items.map((asset, i) => (
                    <motion.button
                      key={asset.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => setLightboxIndex(i)}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                    >
                      <img
                        src={asset.thumbnail_url || asset.url}
                        alt={asset.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                        <p className="truncate text-xs font-medium text-white">{asset.title}</p>
                        <p className="text-[10px] text-white/60">{asset.format}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Videos Grid */}
              {type === "video" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {items.map((asset, i) => (
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="overflow-hidden rounded-xl border border-border bg-black"
                    >
                      <video
                        controls
                        poster={asset.thumbnail_url}
                        className="aspect-video w-full"
                        preload="metadata"
                      >
                        <source src={asset.url} />
                      </video>
                      <div className="flex items-center justify-between bg-card px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{asset.title}</p>
                          <p className="text-xs text-muted-foreground">{asset.format}{asset.duration ? ` · ${asset.duration}` : ""}</p>
                        </div>
                        <a href={asset.url} download className="text-muted-foreground hover:text-foreground transition">
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Audio List */}
              {type === "audio" && (
                <div className="space-y-3">
                  {items.map((asset, i) => (
                    <AudioPlayer key={asset.id} asset={asset} />
                  ))}
                </div>
              )}

              {/* Documents */}
              {type === "document" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {items.map((asset, i) => (
                    <motion.a
                      key={asset.id}
                      href={asset.url}
                      download
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{asset.title}</p>
                        <p className="text-xs text-muted-foreground">{asset.format}{asset.file_size ? ` · ${asset.file_size}` : ""}</p>
                      </div>
                      <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </motion.a>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={images}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNav={handleNav}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CampaignGallery;
