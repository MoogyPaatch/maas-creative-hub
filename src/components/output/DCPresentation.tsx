import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Star,
  Shield,
  Zap,
  Flame,
  Play,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from "lucide-react";
import SlideShell, { type SlideItem } from "./SlideShell";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import type { MessageMetadata, DCPiste, AgencyRecommendation } from "@/types";

interface Props {
  metadata: MessageMetadata;
  onSelectPiste?: (pisteId: string) => void;
}

/* ─── Accent colors per piste ─── */
function pisteColor(_title: string, index: number): string {
  const hues = [250, 340, 160, 30, 200];
  const h = hues[index % hues.length];
  return `hsl(${h}, 60%, 55%)`;
}

/* ─── Risk Level Badge ─── */
const RISK_CONFIG: Record<string, { icon: typeof Shield; label: string; colorClass: string }> = {
  safe: { icon: Shield, label: "Safe", colorClass: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
  bold: { icon: Zap, label: "Bold", colorClass: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
  provocateur: { icon: Flame, label: "Provocateur", colorClass: "text-orange-500 border-orange-500/30 bg-orange-500/10" },
};

function RiskBadge({ level }: { level?: string }) {
  if (!level || !RISK_CONFIG[level]) return null;
  const cfg = RISK_CONFIG[level];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.colorClass}`}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

/* ─── Conviction Score ─── */
function ConvictionScore({ score, accentColor }: { score?: string; accentColor: string }) {
  if (!score) return null;
  const numScore = parseInt(score, 10);
  if (isNaN(numScore)) return null;
  const normalized = Math.min(Math.max(numScore, 0), 10);

  return (
    <div className="flex items-center gap-2">
      <TrendingUp className="h-3 w-3 text-muted-foreground" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Conviction agence
      </span>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.05 * i, duration: 0.2 }}
            className="h-3 w-1 rounded-full origin-bottom"
            style={{
              backgroundColor: i < normalized ? accentColor : "hsl(var(--muted-foreground) / 0.15)",
            }}
          />
        ))}
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color: accentColor }}>
        {normalized}/10
      </span>
    </div>
  );
}

/* ─── Recommendation Badge ─── */
function RecommendationBadge() {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, delay: 0.3 }}
      className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider shadow-sm border border-primary/20"
    >
      <Star className="h-3 w-3 fill-primary" />
      Recommandation Marcel
    </motion.span>
  );
}

/* ─── Expandable text section ─── */
function Section({ label, text, accent }: { label: string; text: string; accent?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 180;

  return (
    <div
      className={`rounded-lg border px-4 py-3 transition-colors ${
        accent
          ? "border-primary/20 bg-primary/5"
          : "border-border/40 bg-muted/5"
      } ${isLong ? "cursor-pointer hover:bg-muted/15" : ""}`}
      onClick={() => isLong && setExpanded((v) => !v)}
    >
      <h4 className={`mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] ${
        accent ? "text-primary/80" : "text-muted-foreground"
      }`}>
        {label}
      </h4>
      <p
        className={`text-[13px] leading-relaxed text-foreground/90 transition-all duration-300 ${
          !expanded && isLong ? "line-clamp-3" : ""
        }`}
      >
        {text}
      </p>
      {isLong && (
        <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-primary/70 uppercase tracking-wider">
          {expanded ? (
            <><ChevronUp className="h-2.5 w-2.5" /> Reduire</>
          ) : (
            <><ChevronDown className="h-2.5 w-2.5" /> Lire la suite</>
          )}
        </span>
      )}
    </div>
  );
}

/* ─── Main Piste Slide ─── */
function PisteSlide({
  piste,
  index,
  onSelect,
  accentColor,
  isRecommended,
}: {
  piste: DCPiste;
  index: number;
  onSelect?: (id: string) => void;
  accentColor: string;
  isRecommended: boolean;
}) {
  const hasImage = !!piste.thumbnail_url;

  return (
    <div className="flex h-full w-full flex-col lg:flex-row overflow-hidden bg-card">
      {/* Left: Hero visual area */}
      {hasImage ? (
        <div className="relative h-2/5 w-full lg:h-full lg:w-[45%] overflow-hidden group">
          <ImageWithFallback
            src={piste.thumbnail_url}
            alt={piste.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Cinematic gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-card/10 lg:to-card" />

          {/* Bottom overlay: piste badge + risk */}
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="rounded-full px-3.5 py-1 text-[11px] font-bold tracking-wide uppercase shadow-lg"
                style={{ backgroundColor: accentColor, color: "white" }}
              >
                Piste {index + 1}
              </span>
              {isRecommended && <RecommendationBadge />}
              <RiskBadge level={piste.risk_level} />
            </div>
          </div>
        </div>
      ) : (
        <div
          className="relative flex h-2/5 w-full lg:h-full lg:w-[45%] items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${accentColor}08 0%, ${accentColor}15 100%)` }}
        >
          <span
            className="pointer-events-none select-none text-[16rem] font-black leading-none lg:text-[22rem]"
            style={{ color: accentColor, opacity: 0.06 }}
          >
            {index + 1}
          </span>
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="rounded-full px-3.5 py-1 text-[11px] font-bold tracking-wide uppercase shadow-sm"
                style={{ backgroundColor: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}35` }}
              >
                Piste {index + 1}
              </span>
              {isRecommended && <RecommendationBadge />}
              <RiskBadge level={piste.risk_level} />
            </div>
          </div>
        </div>
      )}

      {/* Right: Content panel */}
      <div className="flex h-3/5 w-full lg:h-full lg:w-[55%] flex-col justify-start overflow-y-auto scrollbar-thin">
        {/* Sticky header with title + CTA */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/20 px-5 pt-5 pb-3 lg:px-6 lg:pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-extrabold tracking-tight text-foreground lg:text-2xl leading-tight">
                {piste.title}
              </h3>
              {piste.headline && piste.headline !== piste.title && (
                <p className="mt-1.5 text-sm font-medium text-primary/80 italic lg:text-base leading-snug">
                  &ldquo;{piste.headline}&rdquo;
                </p>
              )}
            </div>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => onSelect?.(piste.id)}
              className="group flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
              <span className="hidden sm:inline">Choisir</span>
            </motion.button>
          </div>

          {/* Conviction score + risk (when no image) */}
          <div className="mt-2.5 flex items-center gap-3 flex-wrap">
            <ConvictionScore score={piste.agency_conviction} accentColor={accentColor} />
            {!hasImage && <RiskBadge level={piste.risk_level} />}
          </div>
        </div>

        {/* Scrollable content body */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="px-5 py-4 lg:px-6 space-y-3"
        >
          {/* Core sections */}
          {piste.constat && (
            <Section label="Constat" text={piste.constat} />
          )}
          <Section label="Concept créatif" text={piste.concept} accent />
          <Section label="Direction visuelle" text={piste.tone} />
          {piste.dispositif && (
            <Section label="Dispositif d'activation" text={piste.dispositif} />
          )}
          <Section label="Justification stratégique" text={piste.justification} />
          {piste.differentiation && (
            <Section label="Différenciation" text={piste.differentiation} />
          )}

          {/* Video concept — one-line teaser only (full details in PPM) */}
          {piste.video_concept?.concept_summary && (
            <div className="flex items-start gap-2 rounded-lg border border-border/30 bg-muted/5 px-4 py-2.5">
              <Play className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Concept video
                </span>
                <p className="text-[13px] leading-relaxed text-foreground/80 mt-0.5">
                  {piste.video_concept.concept_summary}
                </p>
              </div>
            </div>
          )}

          {/* Bottom CTA for mobile (visible when top CTA scrolls away) */}
          <div className="pt-2 pb-1 lg:hidden">
            <button
              onClick={() => onSelect?.(piste.id)}
              className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
              style={{ backgroundColor: accentColor }}
            >
              <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
              Choisir cette piste
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Agency Recommendation Encadre ─── */
function RecommendationEncadre({
  recommendation,
  pistes,
}: {
  recommendation?: AgencyRecommendation;
  pistes: DCPiste[];
}) {
  if (!recommendation?.why) return null;
  const [expanded, setExpanded] = useState(false);
  const isLong = (recommendation.why?.length || 0) > 200;
  const recommendedPiste = recommendation.recommended_piste
    ? pistes[recommendation.recommended_piste - 1]
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-primary/20 bg-primary/5 px-5 py-4 space-y-2.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            {recommendation.recommendation_title || "Recommandation Marcel"}
          </span>
          {recommendedPiste && (
            <span className="text-[11px] font-semibold text-primary/60">
              — {recommendedPiste.title}
            </span>
          )}
        </div>
        {isLong && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[10px] font-medium text-primary/70 uppercase tracking-wider hover:text-primary transition-colors flex items-center gap-0.5"
          >
            {expanded ? (
              <><ChevronUp className="h-2.5 w-2.5" /> Reduire</>
            ) : (
              <><ChevronDown className="h-2.5 w-2.5" /> Details</>
            )}
          </button>
        )}
      </div>
      <p
        className={`text-[13px] leading-relaxed text-foreground/90 transition-all duration-300 ${
          !expanded && isLong ? "line-clamp-2" : ""
        }`}
        onClick={() => isLong && setExpanded((v) => !v)}
      >
        {recommendation.why}
      </p>
      <AnimatePresence>
        {recommendation.what_if_not && (expanded || !isLong) && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs leading-relaxed text-muted-foreground italic border-l-2 border-primary/20 pl-3"
          >
            Alternative : {recommendation.what_if_not}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Component ─── */
const DCPresentation = ({ metadata, onSelectPiste }: Props) => {
  const pistes = metadata.pistes || [];
  const recommendation = metadata.agency_recommendation;

  const slides: SlideItem[] = useMemo(
    () =>
      pistes.map((piste, i) => {
        const color = pisteColor(piste.title, i);
        const isRecommended = recommendation?.recommended_piste === i + 1;

        return {
          title: piste.title,
          color: `${color.replace(")", "/0.3)")}`,
          content: (
            <PisteSlide
              piste={piste}
              index={i}
              onSelect={onSelectPiste}
              accentColor={color}
              isRecommended={isRecommended}
            />
          ),
        };
      }),
    [pistes, onSelectPiste, recommendation]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 min-h-0">
        <SlideShell
          slides={slides}
          title="Direction Creative"
          titleIcon={Sparkles}
          slidesUrl={metadata.slides_url}
          pptxUrl={metadata.pptx_url}
        />
      </div>
      <RecommendationEncadre recommendation={recommendation} pistes={pistes} />
    </div>
  );
};

export default DCPresentation;
