import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film,
  Users,
  MapPin,
  Package,
  FileText,
  CheckCircle2,
  MessageSquare,
  Loader2,
  Printer,
  Share2,
  Headphones,
  Monitor,
  Mic,
  Layout,
  Clock,
  Camera,
  Layers,
  X,
  Maximize2,
  Download,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { MessageMetadata } from "@/types";
import { approvePPMGate } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  metadata: MessageMetadata;
  projectId?: string;
  currentStep?: string;
  onPPMApprove?: (action: "approve" | "revision", feedback?: string) => Promise<void>;
}

/* ── Helpers ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safe = (v: any, fallback = "") => (v != null ? String(v) : fallback);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type R = Record<string, any>;

/* ── Image Lightbox ── */
function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-foreground transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>
      <motion.img
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}

/* ── Clickable Image ── */
function ClickableImage({
  src,
  alt,
  className,
  aspectClass,
}: {
  src: string;
  alt: string;
  className?: string;
  aspectClass?: string;
}) {
  const [lightbox, setLightbox] = useState(false);
  const [error, setError] = useState(false);

  if (error || !src) return null;

  return (
    <>
      <div
        className={`group relative cursor-pointer overflow-hidden ${aspectClass || "aspect-video"} ${className || ""}`}
        onClick={() => setLightbox(true)}
      >
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setError(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
          <Maximize2 className="h-6 w-6 text-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      </div>
      <AnimatePresence>
        {lightbox && <ImageLightbox src={src} alt={alt} onClose={() => setLightbox(false)} />}
      </AnimatePresence>
    </>
  );
}

/* ── Reusable Sub-Components ── */
function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-4.5 w-4.5 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function InfoChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-primary/20 bg-primary/5" : "border-border bg-muted/50"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

/* ── Data extraction helpers ── */

/**
 * Extract storyboard sequences from metadata.
 * Backend sends storyboard at top-level AND inside video_specs.storyboard.
 * Also check composed_scenes for image URLs.
 */
function extractStoryboard(metadata: MessageMetadata): R[] {
  const videoSpecs = metadata.video_specs as R | undefined;
  // Priority: top-level storyboard > video_specs.storyboard > empty
  let sb = metadata.storyboard as R[] | undefined;
  if (!sb || !Array.isArray(sb) || sb.length === 0) {
    sb = videoSpecs?.storyboard as R[] | undefined;
  }
  if (!sb || !Array.isArray(sb)) return [];

  // Backend may send NESTED format: [{scenes: [...], duration_target}, ...]
  // Flatten to individual sequences if nested
  if (sb.length > 0 && sb[0].scenes && Array.isArray(sb[0].scenes)) {
    const flat: R[] = [];
    sb.forEach((group) => {
      const scenes = Array.isArray(group.scenes) ? group.scenes : [];
      scenes.forEach((scene: R) => {
        // Inherit group-level duration_target if scene has no timing
        if (!scene.timing && !scene.duration && group.duration_target) {
          scene.group_duration = group.duration_target;
        }
        flat.push(scene);
      });
    });
    sb = flat;
  }

  // Enrich with composed_scenes URLs if missing
  const composed = (metadata.composed_scenes || []) as R[];
  if (composed.length > 0) {
    const urlMap: Record<number, string> = {};
    composed.forEach((s) => {
      if (s.sequence_index != null && s.composed_image_url) {
        urlMap[s.sequence_index] = s.composed_image_url;
      }
    });
    sb.forEach((seq, i) => {
      if (!seq.composed_image_url && urlMap[i]) {
        seq.composed_image_url = urlMap[i];
      }
    });
  }

  return sb;
}

/**
 * Extract casting/characters, excluding voix-off entries.
 * Backend sends both `casting` and `characters` arrays.
 */
function extractCasting(metadata: MessageMetadata): R[] {
  const raw = (metadata.characters || metadata.casting || []) as R[];
  if (!Array.isArray(raw)) return [];
  // Filter out voix-off/voiceover entries — they belong in format specs
  return raw.filter((item) => {
    const role = safe(item.role || item.name).toLowerCase();
    return !role.includes("voix") && !role.includes("voiceover") && !role.includes("voice-over") && !role.includes("narrateur") && !role.includes("narrator");
  });
}

/**
 * Extract voiceover entries from casting (for display in Formats tab).
 */
function extractVoiceoverFromCasting(metadata: MessageMetadata): R[] {
  const raw = (metadata.characters || metadata.casting || []) as R[];
  if (!Array.isArray(raw)) return [];
  return raw.filter((item) => {
    const role = safe(item.role || item.name).toLowerCase();
    return role.includes("voix") || role.includes("voiceover") || role.includes("voice-over") || role.includes("narrateur") || role.includes("narrator");
  });
}

function extractProducts(metadata: MessageMetadata): R[] {
  const raw = metadata.products as R[] | undefined;
  if (!raw || !Array.isArray(raw)) return [];
  return raw;
}

function extractLocations(metadata: MessageMetadata): R[] {
  const raw = (metadata.locations || metadata.settings || []) as R[];
  if (!Array.isArray(raw)) return [];
  return raw;
}

/* ── Sub-Tab Type ── */
type PPMSubTab = "storyboard" | "casting" | "products" | "locations" | "formats" | "summary";

/* ── Storyboard Tab Content ── */
function StoryboardTab({ storyboard }: { storyboard: R[] }) {
  if (storyboard.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Aucune sequence storyboard disponible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <SectionHeader icon={Film} title="Storyboard" subtitle={`${storyboard.length} sequences`} />
      {storyboard.map((seq, idx) => {
        const seqNum = safe(seq.sequence || seq.frame_number, String(idx + 1));
        const composedUrl = seq.composed_image_url || seq.image_url;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground shadow-lg shadow-primary/20">
                  {seqNum}
                </span>
                {(seq.timing || seq.duration) && (
                  <span className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">
                    <Clock className="h-3 w-3 text-primary" /> {safe(seq.timing || seq.duration)}
                  </span>
                )}
              </div>
              {seq.transition && (
                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  &rarr; {safe(seq.transition)}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-0 md:flex-row">
              {/* Composed image */}
              {composedUrl && (
                <div className="w-full md:w-1/2">
                  <ClickableImage
                    src={composedUrl}
                    alt={`Sequence ${seqNum}`}
                    aspectClass="aspect-video"
                    className="border-b border-border md:border-b-0 md:border-r"
                  />
                </div>
              )}

              {/* Text content */}
              <div className={`flex flex-col gap-2.5 p-5 text-sm ${composedUrl ? "md:w-1/2" : "w-full"}`}>
                {(seq.composition || seq.camera) && (
                  <div className="flex items-start gap-2">
                    <Camera className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                    <span className="font-medium text-foreground">{safe(seq.composition || seq.camera)}</span>
                  </div>
                )}
                {seq.subject && (
                  <p className="leading-relaxed text-foreground/70">{safe(seq.subject)}</p>
                )}
                {seq.description && !seq.subject && (
                  <p className="leading-relaxed text-foreground/70">{safe(seq.description)}</p>
                )}
                {seq.visual && !seq.subject && !seq.description && (
                  <p className="leading-relaxed text-foreground/70">{safe(seq.visual)}</p>
                )}
                {seq.environment && (
                  <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Decor :</span> {safe(seq.environment)}
                  </div>
                )}
                {seq.motion && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Mouvement :</span> {safe(seq.motion)}
                  </p>
                )}
                {seq.color_mood && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Palette :</span> {safe(seq.color_mood)}
                  </p>
                )}
                {seq.text_overlay && (
                  <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-xs">
                    <span className="font-semibold text-primary">Texte :</span>{" "}
                    <span className="text-foreground">{safe(seq.text_overlay)}</span>
                  </div>
                )}
                {seq.text_on_screen && !seq.text_overlay && (
                  <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-xs">
                    <span className="font-semibold text-primary">Texte :</span>{" "}
                    <span className="text-foreground">{safe(seq.text_on_screen)}</span>
                  </div>
                )}
                {seq.voiceover && (
                  <p className="text-xs italic text-muted-foreground">
                    <span className="font-semibold text-foreground/70">Voix-off :</span> {safe(seq.voiceover)}
                  </p>
                )}
                {seq.sound && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground/70">Son :</span> {safe(seq.sound)}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ── Entity Grid (Casting / Products / Locations) ── */
function EntityGrid({
  items,
  icon: Icon,
  title,
  emptyLabel,
  aspectClass,
}: {
  items: R[];
  icon: React.ElementType;
  title: string;
  emptyLabel: string;
  aspectClass?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SectionHeader icon={Icon} title={title} subtitle={`${items.length} elements`} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const imgUrl = item.image_url || item.thumbnail_url || item.url;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg hover:shadow-primary/5"
            >
              {imgUrl && (
                <ClickableImage
                  src={imgUrl}
                  alt={item.name || item.role || "Entity"}
                  aspectClass={aspectClass || "aspect-[3/4]"}
                />
              )}
              <div className="p-5">
                <h4 className="mb-1 text-base font-bold text-foreground">
                  {safe(item.name || item.role)}
                </h4>
                {item.role && item.name && (
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">{safe(item.role)}</p>
                )}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {safe(item.description || item.physical_description)}
                </p>
                {item.wardrobe && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground/70">Tenue :</span> {safe(item.wardrobe)}
                  </p>
                )}
                {item.attitude && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground/70">Attitude :</span> {safe(item.attitude)}
                  </p>
                )}
                {item.context && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground/70">Contexte :</span> {safe(item.context)}
                  </p>
                )}
                {item.ambiance && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground/70">Ambiance :</span> {safe(item.ambiance)}
                  </p>
                )}
                {item.lighting && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground/70">Lumiere :</span> {safe(item.lighting)}
                  </p>
                )}
                {item.time_of_day && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground/70">Heure :</span> {safe(item.time_of_day)}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Formats Tab (Video, Print, Social, Audio, Digital) ── */
function FormatsTab({ metadata, voiceoverEntries }: { metadata: MessageMetadata; voiceoverEntries: R[] }) {
  const detected = metadata.detected_formats || [];
  const videoSpecs = metadata.video_specs as R | undefined;
  const printSpecs = metadata.print_specs as R | undefined;
  const socialSpecs = metadata.social_specs as R | undefined;
  const audioSpecs = metadata.audio_specs as R | undefined;
  const digitalSpecs = metadata.digital_specs as R | undefined;

  const hasAnyContent = detected.length > 0 || videoSpecs || printSpecs || socialSpecs || audioSpecs || digitalSpecs;

  if (!hasAnyContent) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Aucune specification de format disponible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <SectionHeader
        icon={Film}
        title="Specifications par Format"
        subtitle={detected.length > 0 ? `${detected.length} format${detected.length > 1 ? "s" : ""} de production` : undefined}
      />

      {/* Format chips */}
      {detected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {detected.map((fmt: string) => (
            <span
              key={fmt}
              className="rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-xs font-bold uppercase tracking-wider text-primary"
            >
              {fmt}
            </span>
          ))}
        </div>
      )}

      {/* Video specs */}
      {videoSpecs && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            <h4 className="text-base font-bold text-foreground">Video</h4>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {videoSpecs.production_notes?.total_duration && (
              <InfoChip label="Duree" value={safe(videoSpecs.production_notes.total_duration)} accent />
            )}
            {videoSpecs.production_notes?.aspect_ratio && (
              <InfoChip label="Ratio" value={safe(videoSpecs.production_notes.aspect_ratio)} />
            )}
            {videoSpecs.production_notes?.resolution && (
              <InfoChip label="Resolution" value={safe(videoSpecs.production_notes.resolution)} />
            )}
            {videoSpecs.production_notes?.style_reference && (
              <InfoChip label="Reference" value={safe(videoSpecs.production_notes.style_reference)} />
            )}
          </div>
          {/* Voiceover from video_specs */}
          {videoSpecs.voiceover && (
            <div className="mt-4 rounded-xl border border-border bg-muted p-4">
              <div className="mb-2 flex items-center gap-2">
                <Mic className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Voix-off</span>
                {videoSpecs.voiceover.estimated_duration && (
                  <span className="text-xs text-muted-foreground">{safe(videoSpecs.voiceover.estimated_duration)}</span>
                )}
              </div>
              {videoSpecs.voiceover.full_text && (
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/70">
                  {safe(videoSpecs.voiceover.full_text)}
                </p>
              )}
            </div>
          )}
          {/* Voiceover entries from casting (moved here from Casting tab) */}
          {voiceoverEntries.length > 0 && !videoSpecs.voiceover && (
            <div className="mt-4 space-y-3">
              {voiceoverEntries.map((vo, i) => (
                <div key={i} className="rounded-xl border border-border bg-muted p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Mic className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">{safe(vo.name || vo.role || "Voix-off")}</span>
                  </div>
                  {(vo.description || vo.physical_description) && (
                    <p className="text-sm leading-relaxed text-foreground/70">
                      {safe(vo.description || vo.physical_description)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Print specs */}
      {printSpecs && (printSpecs.formats as R[] | undefined)?.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            <h4 className="text-base font-bold text-foreground">Print</h4>
            <span className="text-xs text-muted-foreground">{(printSpecs.formats as R[]).length} formats</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(printSpecs.formats as R[]).map((fmt, i) => (
              <div key={i} className="rounded-xl border border-border bg-muted p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">{safe(fmt.format_name, `Format ${i + 1}`)}</span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {safe(fmt.aspect_ratio)} {safe(fmt.orientation)}
                  </span>
                </div>
                {fmt.main_visual && <p className="text-xs leading-relaxed text-muted-foreground">{safe(fmt.main_visual)}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social specs */}
      {socialSpecs && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <h4 className="text-base font-bold text-foreground">Social Media</h4>
          </div>
          {(socialSpecs.platforms as R[] | undefined)?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {(socialSpecs.platforms as R[]).map((p, i) => (
                <span key={i} className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground">
                  {safe(p.platform)}
                </span>
              ))}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            {(socialSpecs.feed_posts as R[] | undefined)?.length > 0 && (
              <InfoChip label="Feed Posts" value={String((socialSpecs.feed_posts as R[]).length)} accent />
            )}
            {(socialSpecs.stories_reels as R[] | undefined)?.length > 0 && (
              <InfoChip label="Stories/Reels" value={String((socialSpecs.stories_reels as R[]).length)} />
            )}
            {(socialSpecs.carousels as R[] | undefined)?.length > 0 && (
              <InfoChip label="Carousels" value={String((socialSpecs.carousels as R[]).length)} />
            )}
          </div>
        </div>
      )}

      {/* Audio specs */}
      {audioSpecs && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Headphones className="h-5 w-5 text-primary" />
            <h4 className="text-base font-bold text-foreground">Audio</h4>
          </div>
          {(audioSpecs.scripts as R[] | undefined)?.map((script, i) => (
            <div key={i} className="mb-3 rounded-xl border border-border bg-muted p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{safe(script.type, `Script ${i + 1}`)}</span>
                {script.duration_target && (
                  <span className="text-xs text-muted-foreground">{safe(script.duration_target)}s</span>
                )}
              </div>
              {script.full_text && (
                <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{safe(script.full_text)}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Digital specs */}
      {digitalSpecs && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            <h4 className="text-base font-bold text-foreground">Digital</h4>
          </div>
          {((digitalSpecs.digital as R)?.banners || digitalSpecs.banners) && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(((digitalSpecs.digital as R)?.banners || digitalSpecs.banners) as R[]).slice(0, 6).map((b, i) => (
                <div key={i} className="rounded-xl border border-border bg-muted p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{safe(b.format_name, `Banner ${i + 1}`)}</span>
                    {b.dimensions && <span className="text-[10px] text-muted-foreground">{safe(b.dimensions)}</span>}
                  </div>
                  {b.headline && <p className="text-xs font-medium text-primary">{safe(b.headline)}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Summary Tab ── */
function SummaryTab({ metadata }: { metadata: MessageMetadata }) {
  const videoSpecs = metadata.video_specs as R | undefined;
  const hasSummary = !!metadata.summary;
  const hasProductionNotes = metadata.production_notes && (metadata.production_notes.budget_range || metadata.production_notes.timeline);
  const hasMockups = metadata.mockups && metadata.mockups.length > 0;
  const hasStats = metadata.storyboard_count || metadata.casting_count || metadata.settings_count || metadata.mockup_count;

  if (!hasSummary && !hasProductionNotes && !hasMockups && !hasStats) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Aucun resume disponible.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Summary text */}
      {hasSummary && (
        <div>
          <SectionHeader icon={FileText} title="Resume Complet" />
          <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground prose-ul:my-1 prose-li:my-0.5">
            <ReactMarkdown>{metadata.summary!}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Stats overview */}
      {hasStats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metadata.storyboard_count && (
            <InfoChip label="Storyboard" value={`${metadata.storyboard_count} frames`} accent />
          )}
          {metadata.casting_count && (
            <InfoChip label="Casting" value={`${metadata.casting_count} roles`} />
          )}
          {metadata.settings_count && (
            <InfoChip label="Decors" value={`${metadata.settings_count} lieux`} />
          )}
          {metadata.mockup_count && (
            <InfoChip label="Maquettes" value={`${metadata.mockup_count} formats`} />
          )}
        </div>
      )}

      {/* Production notes */}
      {hasProductionNotes && (
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Package className="h-4 w-4 text-primary" /> Notes de Production
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {metadata.production_notes!.budget_range && (
              <InfoChip label="Budget" value={metadata.production_notes!.budget_range} accent />
            )}
            {metadata.production_notes!.timeline && (
              <InfoChip label="Planning" value={metadata.production_notes!.timeline} />
            )}
          </div>
        </div>
      )}

      {/* Mockups */}
      {hasMockups && (
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Layout className="h-4 w-4 text-primary" /> Maquettes
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {metadata.mockups!.map((m, i) => (
              <div key={i} className="rounded-xl border border-border bg-muted p-4">
                <span className="mb-2 inline-block rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {m.format}
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── PPM Approval Footer ── */
function PPMApprovalFooter({
  projectId,
  onPPMApprove,
}: {
  projectId: string;
  onPPMApprove?: (action: "approve" | "revision", feedback?: string) => Promise<void>;
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<"approved" | "revision" | null>(null);

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (onPPMApprove) {
        await onPPMApprove("approve");
      } else {
        await approvePPMGate(projectId, "approve");
      }
      setSubmitted("approved");
      toast.success("PPM approuve - lancement de la production");
    } catch {
      toast.error("Erreur lors de l'approbation du PPM");
    } finally {
      setLoading(false);
    }
  };

  const handleRevision = async () => {
    if (!feedback.trim()) return;
    setLoading(true);
    try {
      if (onPPMApprove) {
        await onPPMApprove("revision", feedback.trim());
      } else {
        await approvePPMGate(projectId, "revision", feedback.trim());
      }
      setSubmitted("revision");
      toast.success("Modifications demandees");
    } catch {
      toast.error("Erreur lors de l'envoi des modifications");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="border-t border-border bg-card/80 px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          {submitted === "approved" ? "PPM approuve" : "Modifications demandees"}
        </div>
        {submitted === "revision" && feedback && (
          <div className="mt-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
            {feedback}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-card/80 px-6 py-4">
      {showFeedback ? (
        <div className="space-y-3">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Decrivez les modifications souhaitees..."
            className="h-24 w-full resize-none rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex gap-3">
            <button
              onClick={handleRevision}
              disabled={!feedback.trim() || loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary disabled:opacity-50"
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
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approuver le PPM
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
  );
}

/* ── Download/View Buttons Bar ── */
function PPMActionBar({ metadata }: { metadata: MessageMetadata }) {
  const pptxUrl = metadata.pptx_url;
  const slidesUrl = metadata.slides_url;
  const pptxUrls = (metadata as R).pptx_urls as Record<string, string> | undefined;
  const slidesUrls = (metadata as R).slides_urls as Record<string, string> | undefined;

  // Collect all available channel-specific URLs
  const channels = Object.keys(pptxUrls || slidesUrls || {});
  const hasMultipleChannels = channels.length > 1;

  // If no URLs at all, don't render
  if (!pptxUrl && !slidesUrl && channels.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/60 px-6 py-3">
      {/* Primary buttons (first/main URLs) */}
      {slidesUrl && (
        <a
          href={slidesUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/80"
        >
          <ExternalLink className="h-3 w-3" /> Voir les slides
        </a>
      )}
      {pptxUrl && (
        <a
          href={pptxUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/80"
        >
          <Download className="h-3 w-3" /> PPTX
        </a>
      )}

      {/* Per-channel buttons if multiple channels */}
      {hasMultipleChannels && channels.map((ch) => {
        const chPptx = pptxUrls?.[ch];
        const chSlides = slidesUrls?.[ch];
        return (
          <div key={ch} className="flex items-center gap-1">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              {ch}
            </span>
            {chSlides && (
              <a
                href={chSlides}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-[10px] font-medium text-foreground/70 transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                <ExternalLink className="h-2.5 w-2.5" /> Slides
              </a>
            )}
            {chPptx && (
              <a
                href={chPptx}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-[10px] font-medium text-foreground/70 transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                <Download className="h-2.5 w-2.5" /> PPTX
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Component ── */
const PPMPresentation = ({ metadata, projectId, currentStep, onPPMApprove }: Props) => {
  // Extract data using robust helpers
  const storyboard = useMemo(() => extractStoryboard(metadata), [metadata]);
  const characters = useMemo(() => extractCasting(metadata), [metadata]);
  const voiceoverEntries = useMemo(() => extractVoiceoverFromCasting(metadata), [metadata]);
  const products = useMemo(() => extractProducts(metadata), [metadata]);
  const locations = useMemo(() => extractLocations(metadata), [metadata]);
  const detected = metadata.detected_formats || [];
  const videoSpecs = metadata.video_specs as R | undefined;
  const hasFormats = detected.length > 0 || !!videoSpecs || !!metadata.print_specs || !!metadata.social_specs || !!metadata.audio_specs || !!metadata.digital_specs;

  const [activeTab, setActiveTab] = useState<PPMSubTab>("storyboard");

  // Build tabs list — always show Storyboard and Summary; show others when data exists
  const tabs = useMemo(() => {
    const t: { id: PPMSubTab; label: string; icon: React.ElementType; count?: number }[] = [];
    t.push({ id: "storyboard", label: "Storyboard", icon: Film, count: storyboard.length || undefined });
    if (characters.length > 0) {
      t.push({ id: "casting", label: "Casting", icon: Users, count: characters.length });
    }
    if (products.length > 0) {
      t.push({ id: "products", label: "Produits", icon: Package, count: products.length });
    }
    if (locations.length > 0) {
      t.push({ id: "locations", label: "Decors", icon: MapPin, count: locations.length });
    }
    if (hasFormats) {
      t.push({ id: "formats", label: "Formats", icon: Layers });
    }
    t.push({ id: "summary", label: "Resume", icon: FileText });
    return t;
  }, [characters.length, products.length, locations.length, storyboard.length, hasFormats]);

  // Hide approval footer once pipeline has moved past PPM
  const PAST_PPM_STEPS = new Set(["prod", "prod_image", "prod_video", "prod_audio", "delivery", "delivered", "livre"]);
  const showApproval = projectId && !PAST_PPM_STEPS.has(currentStep || "");

  const projectTitle = videoSpecs?.project_title || metadata.campaign_title || "";

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              {projectTitle || "Dossier PPM"}
            </h2>
            <p className="text-xs text-muted-foreground">Pre-Production Meeting</p>
          </div>
        </div>
      </div>

      {/* Action bar: download PPTX, view slides */}
      <PPMActionBar metadata={metadata} />

      {/* Sub-tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2 scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-0.5 text-[10px] ${isActive ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "storyboard" && <StoryboardTab storyboard={storyboard} />}
        {activeTab === "casting" && (
          <EntityGrid
            items={characters}
            icon={Users}
            title="Casting / Personnages"
            emptyLabel="Aucun personnage defini."
            aspectClass="aspect-[3/4]"
          />
        )}
        {activeTab === "products" && (
          <EntityGrid
            items={products}
            icon={Package}
            title="Produits / Objets"
            emptyLabel="Aucun produit defini."
            aspectClass="aspect-square"
          />
        )}
        {activeTab === "locations" && (
          <EntityGrid
            items={locations}
            icon={MapPin}
            title="Decors / Lieux"
            emptyLabel="Aucun decor defini."
            aspectClass="aspect-video"
          />
        )}
        {activeTab === "formats" && <FormatsTab metadata={metadata} voiceoverEntries={voiceoverEntries} />}
        {activeTab === "summary" && <SummaryTab metadata={metadata} />}
      </div>

      {/* Approval footer */}
      {showApproval && <PPMApprovalFooter projectId={projectId!} onPPMApprove={onPPMApprove} />}
    </div>
  );
};

export default PPMPresentation;
