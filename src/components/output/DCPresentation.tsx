import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Download,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import type { MessageMetadata, DCPiste } from "@/types";

interface Props {
  metadata: MessageMetadata;
  onSelectPiste?: (pisteId: string) => void;
}

/* ─── Single Slide ─── */
function PisteSlide({
  piste,
  index,
  onSelect,
}: {
  piste: DCPiste;
  index: number;
  onSelect?: (id: string) => void;
}) {
  return (
    <div className="flex h-full w-full flex-col lg:flex-row overflow-hidden bg-card">
      {/* Visual half */}
      {piste.thumbnail_url ? (
        <div className="relative h-1/2 w-full lg:h-full lg:w-1/2 overflow-hidden bg-muted">
          <img
            src={piste.thumbnail_url}
            alt={piste.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-card/60 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6">
            <span className="rounded-full bg-primary/90 px-4 py-1.5 text-xs font-bold tracking-wide text-primary-foreground uppercase">
              Piste {index + 1}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex h-1/2 w-full lg:h-full lg:w-1/2 items-center justify-center bg-muted">
          <span className="rounded-full bg-primary/90 px-4 py-1.5 text-sm font-bold text-primary-foreground">
            Piste {index + 1}
          </span>
        </div>
      )}

      {/* Content half */}
      <div className="flex h-1/2 w-full lg:h-full lg:w-1/2 flex-col justify-center p-8 lg:p-12 overflow-y-auto scrollbar-thin">
        <h3 className="mb-2 text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">
          {piste.title}
        </h3>
        {piste.headline && piste.headline !== piste.title && (
          <p className="mb-6 text-base font-medium text-primary italic lg:text-lg">
            "{piste.headline}"
          </p>
        )}

        <div className="mb-8 space-y-5">
          <Section label="Concept" text={piste.concept} />
          <Section label="Direction visuelle" text={piste.tone} />
          <Section label="Justification stratégique" text={piste.justification} />
        </div>

        <button
          onClick={() => onSelect?.(piste.id)}
          className="flex h-11 w-fit items-center gap-2 rounded-lg bg-primary px-7 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md"
        >
          <Sparkles className="h-4 w-4" />
          Choisir cette piste
        </button>
      </div>
    </div>
  );
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </h4>
      <p className="text-sm leading-relaxed text-foreground">{text}</p>
    </div>
  );
}

/* ─── Thumbnail Strip ─── */
function Thumbnails({
  pistes,
  current,
  onSelect,
}: {
  pistes: DCPiste[];
  current: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex gap-2 lg:flex-col">
      {pistes.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onSelect(i)}
          className={`relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all lg:h-16 lg:w-28 ${
            i === current
              ? "border-primary shadow-md"
              : "border-border opacity-60 hover:opacity-100"
          }`}
        >
          {p.thumbnail_url ? (
            <img
              src={p.thumbnail_url}
              alt={p.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] font-bold text-muted-foreground">
              {i + 1}
            </div>
          )}
          <div className="absolute bottom-0.5 right-1 rounded bg-background/80 px-1 text-[9px] font-bold text-foreground">
            {i + 1}
          </div>
        </button>
      ))}
    </div>
  );
}

/* ─── Main Component ─── */
const DCPresentation = ({ metadata, onSelectPiste }: Props) => {
  const pistes = metadata.pistes || [];
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const prev = useCallback(
    () => setCurrent((c) => (c > 0 ? c - 1 : pistes.length - 1)),
    [pistes.length]
  );
  const next = useCallback(
    () => setCurrent((c) => (c < pistes.length - 1 ? c + 1 : 0)),
    [pistes.length]
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

  if (!pistes.length) return null;

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
        <PisteSlide
          piste={pistes[current]}
          index={current}
          onSelect={onSelectPiste}
        />
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
            Direction Créative — Piste {current + 1}/{pistes.length}
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
          <Thumbnails pistes={pistes} current={current} onSelect={setCurrent} />
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
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">
            Direction Créative
          </span>
          <span className="text-xs text-muted-foreground">
            — {current + 1}/{pistes.length}
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
        {/* Sidebar thumbnails */}
        <div className="hidden w-32 flex-shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-border py-4 lg:flex scrollbar-thin">
          <Thumbnails pistes={pistes} current={current} onSelect={setCurrent} />
        </div>

        {/* Slide area */}
        <div className="relative flex-1 overflow-hidden">
          {slideContent}
          <NavButtons onPrev={prev} onNext={next} />
        </div>
      </div>

      {/* Mobile thumbnails */}
      <div className="flex items-center gap-2 overflow-x-auto border-t border-border px-4 py-2 lg:hidden scrollbar-thin">
        <Thumbnails pistes={pistes} current={current} onSelect={setCurrent} />
      </div>
    </div>
  );
};

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

export default DCPresentation;
