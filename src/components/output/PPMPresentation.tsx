import { useMemo, useState, type ReactNode } from "react";
import {
  Film,
  Users,
  MapPin,
  Wrench,
  Image,
  FileText,
  CheckCircle2,
  MessageSquare,
  Loader2,
  Printer,
  Share2,
  Headphones,
  Monitor,
  Mic,
  Music,
  Layout,
  Clock,
  Camera,
  Scissors,
  Clapperboard,
  Tv,
  Hash,
  Play,
  Layers,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import SlideShell, { type SlideItem } from "./SlideShell";
import type { MessageMetadata } from "@/types";
import { approvePPMGate } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  metadata: MessageMetadata;
  projectId?: string;
  currentStep?: string;
}

/* ─── Helpers ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safe = (v: any, fallback = "") => (v != null ? String(v) : fallback);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type R = Record<string, any>;

/* ─── Reusable Slide Sub-Components ─── */
function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
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
    <div className={`rounded-xl border p-4 ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

/* ─── Slide Builders ─── */
function buildSlides(metadata: MessageMetadata): SlideItem[] {
  const slides: SlideItem[] = [];
  const detected = metadata.detected_formats || [];

  // ────────────────────────── 1. Title / Overview slide ──────────────────────────
  const videoSpecs = metadata.video_specs as R | undefined;
  const socialSpecs = metadata.social_specs as R | undefined;
  const digitalSpecs = metadata.digital_specs as R | undefined;
  const projectTitle = videoSpecs?.project_title || socialSpecs?.project_title || "";

  // Collect video versions
  const videoVersions: { label: string; data: R }[] = [];
  if (videoSpecs) {
    for (const [key, val] of Object.entries(videoSpecs)) {
      if (key.startsWith("video_specs_") && val && typeof val === "object") {
        const label = key.replace("video_specs_", "");
        videoVersions.push({ label, data: val as R });
      }
    }
    // Fallback: flat storyboard at root level
    if (videoVersions.length === 0 && (videoSpecs.storyboard || metadata.storyboard)) {
      videoVersions.push({ label: "", data: videoSpecs });
    }
  }

  // Count totals
  const totalSequences = videoVersions.reduce((sum, v) => sum + (v.data.storyboard?.length || 0), 0);
  const platforms = (socialSpecs?.platforms || []) as R[];
  const feedPosts = (socialSpecs?.feed_posts || []) as R[];
  const storiesReels = (socialSpecs?.stories_reels || []) as R[];
  const carousels = (socialSpecs?.carousels || []) as R[];

  slides.push({
    icon: FileText,
    title: "Dossier PPM",
    color: "hsl(239, 60%, 55%, 0.2)",
    content: (
      <div className="flex h-full flex-col items-center justify-center p-8 lg:p-12">
        <span className="mb-4 rounded-full bg-primary/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-primary">
          Pré-Production Meeting
        </span>
        <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-foreground lg:text-4xl">
          {projectTitle || "Dossier de Pré-Production"}
        </h2>
        {!projectTitle && metadata.summary && (
          <p className="mb-6 max-w-lg text-center text-sm text-muted-foreground line-clamp-2">
            {metadata.summary.split("\n")[0].replace(/\*\*/g, "")}
          </p>
        )}

        {/* Format chips */}
        {detected.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {detected.map((fmt: string) => (
              <span key={fmt} className="rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-xs font-bold uppercase tracking-wider text-primary">
                {fmt}
              </span>
            ))}
          </div>
        )}

        {/* Stats grid */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {videoVersions.length > 0 && (
            <div className="flex flex-col items-center rounded-xl border border-border bg-muted/30 px-5 py-4">
              <Film className="mb-2 h-5 w-5 text-primary" />
              <span className="text-2xl font-black text-foreground">{videoVersions.length}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {videoVersions.length > 1 ? "versions" : "version"} vidéo
              </span>
              <span className="text-[10px] text-muted-foreground">{totalSequences} séquences</span>
            </div>
          )}
          {platforms.length > 0 && (
            <div className="flex flex-col items-center rounded-xl border border-border bg-muted/30 px-5 py-4">
              <Share2 className="mb-2 h-5 w-5 text-primary" />
              <span className="text-2xl font-black text-foreground">{platforms.length}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">plateformes</span>
              <span className="text-[10px] text-muted-foreground">{feedPosts.length + storiesReels.length + carousels.length} contenus</span>
            </div>
          )}
          {metadata.print_format_count ? (
            <div className="flex flex-col items-center rounded-xl border border-border bg-muted/30 px-5 py-4">
              <Printer className="mb-2 h-5 w-5 text-primary" />
              <span className="text-2xl font-black text-foreground">{metadata.print_format_count}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">formats print</span>
            </div>
          ) : null}
          {metadata.audio_script_count ? (
            <div className="flex flex-col items-center rounded-xl border border-border bg-muted/30 px-5 py-4">
              <Headphones className="mb-2 h-5 w-5 text-primary" />
              <span className="text-2xl font-black text-foreground">{metadata.audio_script_count}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">scripts audio</span>
            </div>
          ) : null}
        </div>
      </div>
    ),
  });

  // ────────────────────────── 2. Video sections (per version) ──────────────────────────
  for (const version of videoVersions) {
    const { label, data } = version;
    const storyboard = (data.storyboard || []) as R[];
    const voiceover = data.voiceover as R | undefined;
    const soundDesignRaw = data.sound_design as R | undefined;
    const endCard = data.end_card as R | undefined;
    // cutdowns removed — déclinaisons are now configured separately after masters validation
    const versionTag = label ? ` (${label})` : "";

    // Storyboard slides — 2 sequences per slide
    if (storyboard.length > 0) {
      const perSlide = 2;
      for (let i = 0; i < storyboard.length; i += perSlide) {
        const chunk = storyboard.slice(i, i + perSlide);
        const isFirst = i === 0;
        slides.push({
          icon: Film,
          title: isFirst ? `Storyboard${versionTag}` : `Séq. ${i + 1}–${i + chunk.length}${versionTag}`,
          color: "hsl(340, 60%, 55%, 0.2)",
          content: (
            <div className="flex h-full flex-col overflow-y-auto p-6 lg:p-8">
              {isFirst && (
                <SectionHeader icon={Film} title={`Storyboard Vidéo${versionTag}`} subtitle={`${storyboard.length} séquences`} />
              )}
              <div className="grid flex-1 gap-5 sm:grid-cols-2">
                {chunk.map((seq, idx) => {
                  const seqNum = safe(seq.sequence || seq.frame_number, String(i + idx + 1));
                  // Get per-sequence sound design if available
                  const seqSound = soundDesignRaw?.[seqNum] as R | undefined;
                  return (
                    <div key={idx} className="flex flex-col rounded-xl border border-border overflow-hidden bg-card">
                      {/* Header bar with gradient */}
                      <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground shadow-sm">{seqNum}</span>
                          {(seq.timing || seq.duration) && (
                            <span className="flex items-center gap-1 rounded-lg bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                              <Clock className="h-3 w-3 text-primary" /> {safe(seq.timing || seq.duration)}
                            </span>
                          )}
                        </div>
                        {seq.transition && (
                          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">→ {safe(seq.transition)}</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2.5 p-5 text-sm">
                        {seq.composition && (
                          <div className="flex items-start gap-2">
                            <Camera className="mt-0.5 h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span className="text-foreground font-medium">{safe(seq.composition || seq.camera)}</span>
                          </div>
                        )}
                        {seq.subject && (
                          <p className="leading-relaxed text-foreground">{safe(seq.subject)}</p>
                        )}
                        {seq.description && !seq.subject && (
                          <p className="leading-relaxed text-foreground">{safe(seq.description)}</p>
                        )}
                        {seq.environment && (
                          <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">Décor :</span> {safe(seq.environment)}
                          </div>
                        )}
                        {seq.motion && (
                          <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Mouvement :</span> {safe(seq.motion)}</p>
                        )}
                        {seq.color_mood && (
                          <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Palette :</span> {safe(seq.color_mood)}</p>
                        )}
                        {seq.text_overlay && (
                          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-xs">
                            <span className="font-semibold text-primary">Texte :</span>{" "}
                            <span className="text-foreground">{safe(seq.text_overlay)}</span>
                          </div>
                        )}
                        {/* Inline sound cue */}
                        {seqSound && (
                          <div className="mt-1 flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                            <Music className="mt-0.5 h-3 w-3 text-primary flex-shrink-0" />
                            <span>{safe(seqSound.music)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ),
        });
      }
    }

    // Voiceover slide
    if (voiceover) {
      const voiceDir = voiceover.voice_direction as R | undefined;
      slides.push({
        icon: Mic,
        title: `Voix-off${versionTag}`,
        color: "hsl(270, 55%, 55%, 0.2)",
        content: (
          <div className="flex h-full flex-col overflow-y-auto p-6 lg:p-10">
            <SectionHeader icon={Mic} title={`Script Voix-off${versionTag}`} subtitle={voiceover.estimated_duration ? safe(voiceover.estimated_duration) : `${safe(voiceover.word_count)} mots`} />
            {voiceover.full_text && (
              <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
                <p className="whitespace-pre-line text-sm leading-[1.8] text-foreground">{safe(voiceover.full_text)}</p>
              </div>
            )}
            {voiceDir && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {voiceDir.gender && <InfoChip label="Genre" value={safe(voiceDir.gender)} />}
                {voiceDir.tone && <InfoChip label="Ton" value={safe(voiceDir.tone)} accent />}
                {voiceDir.pace && <InfoChip label="Rythme" value={safe(voiceDir.pace)} />}
                {voiceDir.age_range && <InfoChip label="Âge" value={safe(voiceDir.age_range)} />}
                {voiceDir.energy_curve && <InfoChip label="Énergie" value={safe(voiceDir.energy_curve)} />}
              </div>
            )}
          </div>
        ),
      });
    }

    // Sound Design slide (per-sequence object format)
    if (soundDesignRaw && Object.keys(soundDesignRaw).length > 0) {
      // Convert object {1: {...}, 2: {...}} to array
      const entries = Object.entries(soundDesignRaw)
        .filter(([k]) => /^\d+$/.test(k))
        .sort(([a], [b]) => Number(a) - Number(b));

      if (entries.length > 0) {
        slides.push({
          icon: Music,
          title: `Son${versionTag}`,
          color: "hsl(180, 55%, 50%, 0.2)",
          content: (
            <div className="flex h-full flex-col overflow-y-auto p-6 lg:p-8">
              <SectionHeader icon={Music} title={`Direction Sonore${versionTag}`} subtitle={`${entries.length} séquences`} />
              <div className="space-y-3">
                {entries.map(([seqNum, sd]) => {
                  const s = sd as R;
                  return (
                    <div key={seqNum} className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-black text-primary">{seqNum}</span>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {s.music && <p className="text-sm text-foreground"><span className="font-semibold">Musique :</span> {safe(s.music)}</p>}
                        {s.sfx && s.sfx !== "Aucun" && <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">SFX :</span> {safe(s.sfx)}</p>}
                        {s.ambiance && s.ambiance !== "Aucun." && <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Ambiance :</span> {safe(s.ambiance)}</p>}
                      </div>
                      {s.music_arc && (
                        <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">{safe(s.music_arc)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ),
        });
      }
    }

    // End Card slide
    if (endCard) {
      slides.push({
        icon: Clapperboard,
        title: `End Card${versionTag}`,
        color: "hsl(45, 70%, 50%, 0.2)",
        content: (
          <div className="flex h-full flex-col items-center justify-center p-8 lg:p-12">
            <SectionHeader icon={Clapperboard} title={`Carton Final${versionTag}`} />
            <div className="w-full max-w-lg space-y-4">
              {endCard.product && <InfoChip label="Produit" value={safe(endCard.product)} accent />}
              {endCard.baseline && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
                  <p className="text-lg font-bold text-foreground">{safe(endCard.baseline)}</p>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {endCard.logo && <InfoChip label="Logo" value={safe(endCard.logo)} />}
                {endCard.cta && <InfoChip label="CTA" value={safe(endCard.cta)} />}
                {endCard.background && <InfoChip label="Fond" value={safe(endCard.background)} />}
              </div>
            </div>
          </div>
        ),
      });
    }

    // Cutdowns slide removed — déclinaisons configured post-masters validation
  }

  // ────────────────────────── 3. Print Specs ──────────────────────────
  const printSpecs = metadata.print_specs as R | undefined;
  const printFormats = (printSpecs?.formats || []) as R[];
  if (printFormats.length > 0) {
    slides.push({
      icon: Printer,
      title: "Print",
      color: "hsl(25, 70%, 50%, 0.2)",
      content: (
        <div className="flex h-full flex-col overflow-y-auto p-6 lg:p-8">
          <SectionHeader icon={Printer} title="Formats Print" subtitle={`${printFormats.length} déclinaisons`} />
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            {printFormats.map((fmt, i) => (
              <div key={i} className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent px-5 py-3">
                  <span className="text-sm font-bold text-foreground">{safe(fmt.format_name, `Format ${i + 1}`)}</span>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {fmt.aspect_ratio && <span className="rounded-md bg-muted px-2 py-0.5">{safe(fmt.aspect_ratio)}</span>}
                    {fmt.orientation && <span className="uppercase">{safe(fmt.orientation)}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 p-5 text-sm">
                  {fmt.main_visual && <p className="leading-relaxed text-foreground">{safe(fmt.main_visual)}</p>}
                  {fmt.composition_grid && (
                    <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Composition :</span> {safe(fmt.composition_grid)}</p>
                  )}
                  {fmt.product_integration && (
                    <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Produit :</span> {safe(fmt.product_integration)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  // ────────────────────────── 4. Social Specs ──────────────────────────
  if (platforms.length > 0 || feedPosts.length > 0) {
    // Feed posts slide
    slides.push({
      icon: Share2,
      title: "Social",
      color: "hsl(210, 70%, 55%, 0.2)",
      content: (
        <div className="flex h-full flex-col overflow-y-auto p-6 lg:p-8">
          <SectionHeader icon={Share2} title="Social Media" subtitle={`${platforms.length} plateformes · ${feedPosts.length + storiesReels.length + carousels.length} contenus`} />

          {/* Platform pills */}
          {platforms.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {platforms.map((p, i) => (
                <span key={i} className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold text-foreground">
                  <Hash className="h-3 w-3 text-primary" />
                  {safe(p.platform, `Plateforme ${i + 1}`)}
                  {p.content_types && Array.isArray(p.content_types) && (
                    <span className="text-muted-foreground">({(p.content_types as string[]).join(", ")})</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Feed posts — improved cards */}
          {feedPosts.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {feedPosts.map((post, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
                  <div className="mb-3 flex items-center gap-2">
                    {post.platform && (
                      <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">{safe(post.platform)}</span>
                    )}
                    {post.format && (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{safe(post.format)}</span>
                    )}
                  </div>
                  {post.visual_description && (
                    <p className="mb-3 text-sm leading-relaxed text-foreground">{safe(post.visual_description)}</p>
                  )}
                  {post.caption && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs italic leading-relaxed text-muted-foreground line-clamp-4">{safe(post.caption)}</p>
                    </div>
                  )}
                  {post.cta && (
                    <p className="mt-2 text-[10px] font-semibold uppercase text-primary">CTA : {safe(post.cta)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    });

    // Stories/Reels + Carousels slide (if any)
    if (storiesReels.length > 0 || carousels.length > 0) {
      slides.push({
        icon: Tv,
        title: "Stories & Reels",
        color: "hsl(330, 65%, 55%, 0.2)",
        content: (
          <div className="flex h-full flex-col overflow-y-auto p-6 lg:p-8">
            <SectionHeader icon={Tv} title="Stories, Reels & Carousels" subtitle={`${storiesReels.length + carousels.length} contenus`} />

            {storiesReels.length > 0 && (
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {storiesReels.map((sr, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase text-primary">{safe(sr.type, "Reel")}</span>
                      <span className="text-xs text-muted-foreground">{safe(sr.platform)}</span>
                    </div>
                    {sr.duration && <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{safe(sr.duration)}</span>}
                    {sr.concept && <p className="mt-2 text-sm text-foreground">{safe(sr.concept)}</p>}
                    {sr.visual_description && <p className="mt-1 text-xs text-muted-foreground">{safe(sr.visual_description)}</p>}
                  </div>
                ))}
              </div>
            )}

            {carousels.length > 0 && (
              <>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                  <Layers className="h-4 w-4 text-primary" /> Carousels — {carousels.length}
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  {carousels.map((car, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-5">
                      <div className="mb-2 flex items-center gap-2">
                        {car.platform && <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">{safe(car.platform)}</span>}
                        {car.slide_count && <span className="text-xs text-muted-foreground">{safe(car.slide_count)} slides</span>}
                      </div>
                      {car.theme && <p className="text-sm font-medium text-foreground">{safe(car.theme)}</p>}
                      {car.visual_description && <p className="mt-1 text-xs text-muted-foreground">{safe(car.visual_description)}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ),
      });
    }
  }

  // ────────────────────────── 5. Audio Specs ──────────────────────────
  const audioSpecs = metadata.audio_specs as R | undefined;
  const audioScripts = (audioSpecs?.scripts || []) as R[];
  const voiceDirection = audioSpecs?.voice_direction as R | undefined;

  if (audioScripts.length > 0 || voiceDirection) {
    slides.push({
      icon: Headphones,
      title: "Audio",
      color: "hsl(300, 50%, 50%, 0.2)",
      content: (
        <div className="flex h-full flex-col overflow-y-auto p-6 lg:p-8">
          <SectionHeader icon={Headphones} title="Production Audio" subtitle={audioScripts.length > 0 ? `${audioScripts.length} scripts` : undefined} />
          {audioScripts.map((script, i) => (
            <div key={i} className="mb-4 rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent px-5 py-3">
                <span className="text-sm font-bold text-foreground">{safe(script.type, `Script ${i + 1}`)}</span>
                {script.duration_target && <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{safe(script.duration_target)}s</span>}
              </div>
              {script.full_text && (
                <div className="p-5">
                  <p className="whitespace-pre-line text-sm leading-[1.8] text-foreground">{safe(script.full_text)}</p>
                </div>
              )}
            </div>
          ))}
          {voiceDirection && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {voiceDirection.tone && <InfoChip label="Ton" value={safe(voiceDirection.tone)} accent />}
              {voiceDirection.gender && (
                <InfoChip label="Voix" value={`${safe(voiceDirection.gender)}${voiceDirection.age_perceived ? `, ${safe(voiceDirection.age_perceived)}` : ""}`} />
              )}
              {voiceDirection.reference && <InfoChip label="Référence" value={safe(voiceDirection.reference)} />}
            </div>
          )}
        </div>
      ),
    });
  }

  // ────────────────────────── 6. Digital Specs ──────────────────────────
  // Handle nested { digital: { banners: [...], ... } } structure
  const digitalInner = (digitalSpecs?.digital || digitalSpecs) as R | undefined;
  const banners = (digitalInner?.banners || []) as R[];
  const landingPage = digitalInner?.landing_page as R | undefined;

  if (banners.length > 0 || landingPage) {
    slides.push({
      icon: Monitor,
      title: "Digital",
      color: "hsl(150, 55%, 45%, 0.2)",
      content: (
        <div className="flex h-full flex-col overflow-y-auto p-6 lg:p-8">
          <SectionHeader icon={Monitor} title="Production Digital" />
          {banners.length > 0 && (
            <>
              <h4 className="mb-3 text-sm font-bold text-foreground">Bannières — {banners.length} formats</h4>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {banners.slice(0, 6).map((b, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{safe(b.format_name, `Banner ${i + 1}`)}</span>
                      {b.dimensions && <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{safe(b.dimensions)}</span>}
                    </div>
                    {b.headline && <p className="text-sm font-medium text-primary">{safe(b.headline)}</p>}
                    {b.main_visual && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{safe(b.main_visual)}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
          {landingPage && (
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-3 flex items-center gap-2">
                <Layout className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">Landing Page</h4>
              </div>
              {(landingPage.hero_section as R | undefined) && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-foreground">{safe((landingPage.hero_section as R).headline)}</p>
                  {(landingPage.hero_section as R).subheadline && (
                    <p className="text-xs text-muted-foreground">{safe((landingPage.hero_section as R).subheadline)}</p>
                  )}
                </div>
              )}
              {landingPage.sections && Array.isArray(landingPage.sections) && (
                <p className="text-xs text-muted-foreground">{(landingPage.sections as unknown[]).length} sections</p>
              )}
            </div>
          )}
        </div>
      ),
    });
  }

  // ────────────────────────── 7. Summary / Markdown slide ──────────────────────────
  if (metadata.summary) {
    slides.push({
      icon: FileText,
      title: "Résumé",
      color: "hsl(220, 50%, 50%, 0.2)",
      content: (
        <div className="flex h-full flex-col overflow-y-auto p-6 lg:p-10">
          <SectionHeader icon={FileText} title="Résumé Complet" />
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground prose-ul:my-1 prose-li:my-0.5">
            <ReactMarkdown>{metadata.summary}</ReactMarkdown>
          </div>
        </div>
      ),
    });
  }

  // ────────────────────────── Legacy: Casting ──────────────────────────
  if (metadata.casting && metadata.casting.length > 0) {
    slides.push({
      icon: Users,
      title: "Casting",
      color: "hsl(160, 60%, 45%, 0.2)",
      content: (
        <div className="flex h-full flex-col overflow-y-auto p-6 lg:p-8">
          <SectionHeader icon={Users} title="Casting" />
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            {metadata.casting!.map((c, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6">
                <h4 className="mb-2 text-base font-bold text-foreground">{c.role}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  // ────────────────────────── Legacy: Décors ──────────────────────────
  if (metadata.settings && metadata.settings.length > 0) {
    slides.push({
      icon: MapPin,
      title: "Décors",
      color: "hsl(30, 70%, 50%, 0.2)",
      content: (
        <div className="flex h-full flex-col overflow-y-auto p-6 lg:p-8">
          <SectionHeader icon={MapPin} title="Décors" />
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            {metadata.settings!.map((s, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6">
                <h4 className="mb-2 text-base font-bold text-foreground">{s.name}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  // ────────────────────────── Legacy: Production notes ──────────────────────────
  if (metadata.production_notes && (metadata.production_notes.budget_range || metadata.production_notes.timeline)) {
    slides.push({
      icon: Wrench,
      title: "Production",
      color: "hsl(200, 60%, 50%, 0.2)",
      content: (
        <div className="flex h-full flex-col items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-xl space-y-6">
            <SectionHeader icon={Wrench} title="Notes de Production" />
            {metadata.production_notes.budget_range && <InfoChip label="Budget" value={metadata.production_notes.budget_range} accent />}
            {metadata.production_notes.timeline && <InfoChip label="Planning" value={metadata.production_notes.timeline} />}
          </div>
        </div>
      ),
    });
  }

  // ────────────────────────── Legacy: Maquettes ──────────────────────────
  if (metadata.mockups && metadata.mockups.length > 0) {
    slides.push({
      icon: Image,
      title: "Maquettes",
      color: "hsl(280, 60%, 55%, 0.2)",
      content: (
        <div className="flex h-full flex-col overflow-y-auto p-6 lg:p-8">
          <SectionHeader icon={Image} title="Maquettes" />
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            {metadata.mockups!.map((m, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6">
                <span className="mb-3 inline-block rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {m.format}
                </span>
                <p className="text-sm leading-relaxed text-foreground">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  return slides;
}

/* ─── PPM Approval Footer ─── */
function PPMApprovalFooter({ projectId }: { projectId: string }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<"approved" | "revision" | null>(null);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approvePPMGate(projectId, "approve");
      setSubmitted("approved");
      toast.success("PPM approuvé avec succès");
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
      await approvePPMGate(projectId, "revision", feedback.trim());
      setSubmitted("revision");
      toast.success("Modifications demandées");
    } catch {
      toast.error("Erreur lors de l'envoi des modifications");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="border-t border-border bg-card/60 px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          {submitted === "approved" ? "PPM approuvé" : "Modifications demandées"}
        </div>
        {submitted === "revision" && feedback && (
          <div className="mt-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            {feedback}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-card/60 px-6 py-4">
      {showFeedback ? (
        <div className="space-y-3">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Décrivez les modifications souhaitées..."
            className="h-24 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex gap-3">
            <button
              onClick={handleRevision}
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

/* ─── Main Component ─── */
const PPMPresentation = ({ metadata, projectId, currentStep }: Props) => {
  const slides = useMemo(() => buildSlides(metadata), [metadata]);

  // Hide approval footer once pipeline has moved past PPM (prod, delivery, etc.)
  const PAST_PPM_STEPS = new Set(["prod", "prod_image", "prod_video", "prod_audio", "delivery", "delivered", "livré"]);
  const showApproval = projectId && !PAST_PPM_STEPS.has(currentStep || "");

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <SlideShell
          slides={slides}
          title="Dossier PPM"
          titleIcon={FileText}
          slidesUrl={metadata.slides_url}
          pptxUrl={metadata.pptx_url}
        />
      </div>
      {showApproval && <PPMApprovalFooter projectId={projectId} />}
    </div>
  );
};

export default PPMPresentation;
