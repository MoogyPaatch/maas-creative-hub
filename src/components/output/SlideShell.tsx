import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Monitor,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ─── Types ─── */
export interface SlideItem {
  icon: LucideIcon;
  title: string;
  color?: string; // hsl accent for thumbnail gradient
  content: ReactNode;
}

interface Props {
  slides: SlideItem[];
  title: string;
  titleIcon?: LucideIcon;
  subtitle?: string;
  slidesUrl?: string;
  pptxUrl?: string;
  headerExtra?: ReactNode;
}

/* ─── Cinematic transition variants ─── */
const slideVariants = {
  enter: {
    opacity: 0,
    scale: 0.96,
    filter: "blur(4px)",
  },
  center: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    filter: "blur(2px)",
  },
};

const slideTransition = {
  duration: 0.35,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
};

/* ─── Progress dots ─── */
function ProgressDots({
  total,
  current,
  onSelect,
}: {
  total: number;
  current: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`transition-all duration-300 rounded-full ${
            i === current
              ? "h-2.5 w-2.5 bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
              : "h-2 w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
          }`}
        />
      ))}
    </div>
  );
}

/* ─── Thumbnail Strip ─── */
function Thumbnails({
  slides,
  current,
  onSelect,
}: {
  slides: SlideItem[];
  current: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex gap-2 lg:flex-col">
      {slides.map((s, i) => {
        const Icon = s.icon;
        const isActive = i === current;
        const gradientBg = s.color
          ? `linear-gradient(135deg, ${s.color}, hsl(var(--muted)))`
          : undefined;

        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`group relative flex h-16 w-24 flex-shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl transition-all duration-300 lg:h-[4.5rem] lg:w-28 ${
              isActive
                ? "shadow-lg ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "opacity-50 hover:opacity-80 border border-border"
            }`}
            style={gradientBg ? { background: gradientBg } : undefined}
          >
            {!gradientBg && (
              <div className="absolute inset-0 bg-muted" />
            )}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-[9px] font-semibold leading-tight text-center px-1 truncate w-full text-foreground">
                {s.title}
              </span>
            </div>
            {isActive && (
              <motion.div
                layoutId="thumb-active"
                className="absolute inset-0 rounded-xl border-2 border-primary/50"
                transition={{ duration: 0.3 }}
              />
            )}
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
  const size = large ? "h-12 w-12" : "h-10 w-10";
  const iconSize = large ? "h-6 w-6" : "h-4 w-4";
  return (
    <>
      <button
        onClick={onPrev}
        className={`absolute left-3 top-1/2 z-10 -translate-y-1/2 ${size} flex items-center justify-center rounded-full bg-background/70 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-background hover:scale-110`}
      >
        <ChevronLeft className={iconSize} />
      </button>
      <button
        onClick={onNext}
        className={`absolute right-3 top-1/2 z-10 -translate-y-1/2 ${size} flex items-center justify-center rounded-full bg-background/70 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-background hover:scale-110`}
      >
        <ChevronRight className={iconSize} />
      </button>
    </>
  );
}

/* ─── Main SlideShell ─── */
const SlideShell = ({
  slides,
  title,
  titleIcon: TitleIcon,
  subtitle,
  slidesUrl,
  pptxUrl,
  headerExtra,
}: Props) => {
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [embedMode, setEmbedMode] = useState(false);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const prev = useCallback(
    () => setCurrent((c) => (c > 0 ? c - 1 : slides.length - 1)),
    [slides.length]
  );
  const next = useCallback(
    () => setCurrent((c) => (c < slides.length - 1 ? c + 1 : 0)),
    [slides.length]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape" && fullscreen) setFullscreen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next, fullscreen]);

  // Swipe gesture
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchRef.current) return;
      const dx = e.changedTouches[0].clientX - touchRef.current.x;
      const dy = e.changedTouches[0].clientY - touchRef.current.y;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        dx < 0 ? next() : prev();
      }
      touchRef.current = null;
    },
    [prev, next]
  );

  if (!slides.length) return null;

  const progress = ((current + 1) / slides.length) * 100;

  const embedIframe = slidesUrl ? (
    <iframe
      src={slidesUrl}
      className="h-full w-full border-0"
      allowFullScreen
      title="Présentation Office Online"
    />
  ) : null;

  const slideContent = embedMode && embedIframe ? embedIframe : (
    <AnimatePresence mode="wait">
      <motion.div
        key={current}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={slideTransition}
        className="h-full w-full"
      >
        {slides[current].content}
      </motion.div>
    </AnimatePresence>
  );

  /* ─── Immersive Header (overlay style) ─── */
  const headerBar = (isFullscreen: boolean) => (
    <div className={`flex items-center justify-between gap-3 px-5 py-2.5 ${
      isFullscreen
        ? "absolute top-0 left-0 right-0 z-20 bg-background/60 backdrop-blur-md"
        : "border-b border-border bg-card/50 backdrop-blur-sm"
    }`}>
      <div className="flex items-center gap-2.5 min-w-0">
        {TitleIcon && <TitleIcon className="h-4 w-4 text-primary flex-shrink-0" />}
        <span className="text-sm font-bold text-foreground truncate">{title}</span>
        {subtitle && (
          <span className="hidden sm:inline text-xs text-muted-foreground truncate">
            — {subtitle}
          </span>
        )}
        <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
          {current + 1}/{slides.length}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {headerExtra}
        {slidesUrl && (
          <button
            onClick={() => setEmbedMode((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${
              embedMode
                ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                : "text-foreground/80 hover:bg-muted hover:text-foreground"
            }`}
          >
            {embedMode ? <Layers className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
            {embedMode ? "Contenu" : "Slides"}
          </button>
        )}
        {slidesUrl && (
          <a
            href={slidesUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-foreground/80 transition hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {pptxUrl && (
          <a
            href={pptxUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-foreground/80 transition hover:bg-muted hover:text-foreground"
          >
            <Download className="h-3 w-3" /> PPTX
          </a>
        )}
        {isFullscreen ? (
          <button
            onClick={() => setFullscreen(false)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-foreground/80 transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" /> Fermer
          </button>
        ) : (
          <button
            onClick={() => setFullscreen(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-foreground/80 transition hover:bg-muted hover:text-foreground"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );

  /* ─── Progress bar ─── */
  const progressBar = (
    <div className="h-0.5 w-full bg-muted overflow-hidden">
      <motion.div
        className="h-full bg-primary"
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </div>
  );

  /* ─── Fullscreen overlay ─── */
  if (fullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex flex-col bg-background"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {headerBar(true)}
        {progressBar}

        <div className="relative flex-1 overflow-hidden">
          {slideContent}
          {!embedMode && <NavButtons onPrev={prev} onNext={next} large />}
        </div>

        {!embedMode && (
          <div className="flex items-center justify-center gap-4 border-t border-border py-3 bg-card/50 backdrop-blur-sm">
            <Thumbnails slides={slides} current={current} onSelect={setCurrent} />
          </div>
        )}
      </motion.div>
    );
  }

  /* ─── Inline view ─── */
  return (
    <div
      ref={containerRef}
      className="flex h-full flex-col overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {headerBar(false)}
      {progressBar}

      {embedMode ? (
        /* Embedded Office Online iframe — full area */
        <div className="flex-1 overflow-hidden">
          {slideContent}
        </div>
      ) : (
        <>
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar thumbnails */}
            <div className="hidden w-32 flex-shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-border py-4 lg:flex scrollbar-thin">
              <Thumbnails slides={slides} current={current} onSelect={setCurrent} />
            </div>

            {/* Slide area */}
            <div className="relative flex-1 overflow-hidden">
              {slideContent}
              <NavButtons onPrev={prev} onNext={next} />
            </div>
          </div>

          {/* Mobile: thumbnails + dots */}
          <div className="flex flex-col items-center gap-2 border-t border-border bg-card/50 px-4 py-2 lg:hidden backdrop-blur-sm">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
              <Thumbnails slides={slides} current={current} onSelect={setCurrent} />
            </div>
            <ProgressDots total={slides.length} current={current} onSelect={setCurrent} />
          </div>

          {/* Desktop: dots only */}
          <div className="hidden lg:flex justify-center py-2 border-t border-border bg-card/50">
            <ProgressDots total={slides.length} current={current} onSelect={setCurrent} />
          </div>
        </>
      )}
    </div>
  );
};

export default SlideShell;
