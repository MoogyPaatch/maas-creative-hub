import { useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Download,
  Film,
  Users,
  MapPin,
  Wrench,
  Image,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  FileText,
} from "lucide-react";
import type { MessageMetadata } from "@/types";
import type { LucideIcon } from "lucide-react";

interface Props {
  metadata: MessageMetadata;
}

interface Slide {
  icon: LucideIcon;
  title: string;
  content: ReactNode;
}

/* ─── Slide Builders ─── */

function buildSlides(metadata: MessageMetadata): Slide[] {
  const slides: Slide[] = [];

  // Title slide
  slides.push({
    icon: FileText,
    title: "Dossier PPM",
    content: (
      <div className="flex h-full flex-col items-center justify-center text-center p-12">
        <span className="mb-6 rounded-full bg-primary/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-primary">
          Pré-Production Meeting
        </span>
        <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-foreground lg:text-4xl">
          Dossier de Pré-Production
        </h2>
        {metadata.summary && (
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{metadata.summary}</p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          {metadata.storyboard_count && (
            <span className="flex items-center gap-1.5"><Film className="h-4 w-4 text-primary" /> {metadata.storyboard_count} frames</span>
          )}
          {metadata.casting_count && (
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> {metadata.casting_count} rôles</span>
          )}
          {metadata.settings_count && (
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {metadata.settings_count} décors</span>
          )}
          {metadata.mockup_count && (
            <span className="flex items-center gap-1.5"><Image className="h-4 w-4 text-primary" /> {metadata.mockup_count} maquettes</span>
          )}
        </div>
      </div>
    ),
  });

  // Storyboard slides (3 frames per slide)
  if (metadata.storyboard && metadata.storyboard.length > 0) {
    const frames = metadata.storyboard;
    const perSlide = 3;
    for (let i = 0; i < frames.length; i += perSlide) {
      const chunk = frames.slice(i, i + perSlide);
      const isFirst = i === 0;
      slides.push({
        icon: Film,
        title: isFirst ? "Storyboard" : `Storyboard (${i + 1}–${i + chunk.length})`,
        content: (
          <div className="flex h-full flex-col p-8 lg:p-12">
            <div className="mb-6 flex items-center gap-2">
              <Film className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Storyboard</h3>
              <span className="text-sm text-muted-foreground">— Frames {i + 1}–{i + chunk.length} / {frames.length}</span>
            </div>
            <div className="grid flex-1 gap-6 sm:grid-cols-3">
              {chunk.map((frame) => (
                <div key={frame.frame_number} className="flex flex-col rounded-xl border border-border bg-muted/30 overflow-hidden">
                  <div className="flex h-32 items-center justify-center bg-muted">
                    <span className="text-4xl font-black text-muted-foreground/20">{frame.frame_number}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{frame.duration}</span>
                      <span className="text-[10px] text-muted-foreground">{frame.camera}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">{frame.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      });
    }
  }

  // Casting
  if (metadata.casting && metadata.casting.length > 0) {
    slides.push({
      icon: Users,
      title: "Casting",
      content: (
        <div className="flex h-full flex-col p-8 lg:p-12">
          <div className="mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-bold text-foreground">Casting</h3>
            <span className="text-sm text-muted-foreground">— {metadata.casting_count} rôles</span>
          </div>
          <div className="grid flex-1 gap-5 sm:grid-cols-2">
            {metadata.casting!.map((c, i) => (
              <div key={i} className="rounded-xl border border-border bg-muted/30 p-6">
                <h4 className="mb-2 text-lg font-bold text-foreground">{c.role}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  // Décors
  if (metadata.settings && metadata.settings.length > 0) {
    slides.push({
      icon: MapPin,
      title: "Décors",
      content: (
        <div className="flex h-full flex-col p-8 lg:p-12">
          <div className="mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-bold text-foreground">Décors</h3>
            <span className="text-sm text-muted-foreground">— {metadata.settings_count} lieux</span>
          </div>
          <div className="grid flex-1 gap-5 sm:grid-cols-2">
            {metadata.settings!.map((s, i) => (
              <div key={i} className="rounded-xl border border-border bg-muted/30 p-6">
                <h4 className="mb-2 text-lg font-bold text-foreground">{s.name}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  // Notes de production
  if (metadata.production_notes) {
    slides.push({
      icon: Wrench,
      title: "Production",
      content: (
        <div className="flex h-full flex-col items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-xl space-y-8">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Notes de Production</h3>
            </div>
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-muted/30 p-6">
                <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Budget</h4>
                <p className="text-lg font-semibold text-foreground">{metadata.production_notes.budget_range}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-6">
                <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Planning</h4>
                <p className="text-lg font-semibold text-foreground">{metadata.production_notes.timeline}</p>
              </div>
            </div>
          </div>
        </div>
      ),
    });
  }

  // Maquettes
  if (metadata.mockups && metadata.mockups.length > 0) {
    slides.push({
      icon: Image,
      title: "Maquettes",
      content: (
        <div className="flex h-full flex-col p-8 lg:p-12">
          <div className="mb-6 flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-bold text-foreground">Maquettes</h3>
            <span className="text-sm text-muted-foreground">— {metadata.mockup_count} formats</span>
          </div>
          <div className="grid flex-1 gap-5 sm:grid-cols-2">
            {metadata.mockups!.map((m, i) => (
              <div key={i} className="rounded-xl border border-border bg-muted/30 p-6">
                <span className="mb-3 inline-block rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
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

/* ─── Thumbnail Strip ─── */
function Thumbnails({
  slides,
  current,
  onSelect,
}: {
  slides: Slide[];
  current: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex gap-2 lg:flex-col">
      {slides.map((s, i) => {
        const Icon = s.icon;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`relative flex h-14 w-24 flex-shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border-2 transition-all lg:h-16 lg:w-28 ${
              i === current
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border opacity-60 hover:opacity-100"
            }`}
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-[9px] font-medium text-muted-foreground leading-tight text-center px-1 truncate w-full">
              {s.title}
            </span>
            <div className="absolute bottom-0.5 right-1 rounded bg-background/80 px-1 text-[9px] font-bold text-foreground">
              {i + 1}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Nav Arrows ─── */
function NavButtons({
  onPrev,
  onNext,
  large,
}: {
  onPrev: () => void;
  onNext: () => void;
  large?: boolean;
}) {
  const size = large ? "h-12 w-12" : "h-9 w-9";
  const iconSize = large ? "h-6 w-6" : "h-4 w-4";
  return (
    <>
      <button
        onClick={onPrev}
        className={`absolute left-3 top-1/2 -translate-y-1/2 ${size} flex items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur transition hover:bg-background`}
      >
        <ChevronLeft className={iconSize} />
      </button>
      <button
        onClick={onNext}
        className={`absolute right-3 top-1/2 -translate-y-1/2 ${size} flex items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur transition hover:bg-background`}
      >
        <ChevronRight className={iconSize} />
      </button>
    </>
  );
}

/* ─── Main Component ─── */
const PPMPresentation = ({ metadata }: Props) => {
  const slides = useMemo(() => buildSlides(metadata), [metadata]);
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const prev = useCallback(
    () => setCurrent((c) => (c > 0 ? c - 1 : slides.length - 1)),
    [slides.length]
  );
  const next = useCallback(
    () => setCurrent((c) => (c < slides.length - 1 ? c + 1 : 0)),
    [slides.length]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape" && fullscreen) setFullscreen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next, fullscreen]);

  if (!slides.length) return null;

  const slideContent = (
    <AnimatePresence mode="wait">
      <motion.div
        key={current}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.25 }}
        className="h-full w-full"
      >
        {slides[current].content}
      </motion.div>
    </AnimatePresence>
  );

  /* ─── Fullscreen overlay ─── */
  if (fullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex flex-col bg-background"
      >
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <span className="text-sm font-semibold text-foreground">
            Dossier PPM — {slides[current].title} ({current + 1}/{slides.length})
          </span>
          <button
            onClick={() => setFullscreen(false)}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" /> Fermer
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden">
          {slideContent}
          <NavButtons onPrev={prev} onNext={next} large />
        </div>

        <div className="flex items-center justify-center border-t border-border py-3">
          <Thumbnails slides={slides} current={current} onSelect={setCurrent} />
        </div>
      </motion.div>
    );
  }

  /* ─── Inline view ─── */
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Dossier PPM</span>
          <span className="text-xs text-muted-foreground">
            — {slides[current].title} · {current + 1}/{slides.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {metadata.slides_url && (
            <a
              href={metadata.slides_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-foreground transition hover:bg-muted"
            >
              <ExternalLink className="h-3 w-3" /> Google Slides
            </a>
          )}
          {metadata.pptx_url && (
            <a
              href={metadata.pptx_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-foreground transition hover:bg-muted"
            >
              <Download className="h-3 w-3" /> PPTX
            </a>
          )}
          <button
            onClick={() => setFullscreen(true)}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-foreground transition hover:bg-muted"
          >
            <Maximize2 className="h-3 w-3" /> Plein écran
          </button>
        </div>
      </div>

      {/* Body: thumbnails + slide */}
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden w-32 flex-shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-border py-4 lg:flex scrollbar-thin">
          <Thumbnails slides={slides} current={current} onSelect={setCurrent} />
        </div>

        <div className="relative flex-1 overflow-hidden">
          {slideContent}
          <NavButtons onPrev={prev} onNext={next} />
        </div>
      </div>

      {/* Mobile thumbnails */}
      <div className="flex items-center gap-2 overflow-x-auto border-t border-border px-4 py-2 lg:hidden scrollbar-thin">
        <Thumbnails slides={slides} current={current} onSelect={setCurrent} />
      </div>
    </div>
  );
};

export default PPMPresentation;
