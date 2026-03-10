import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Star, ChevronDown, Play, Monitor, Newspaper, Smartphone, AlertTriangle, Shield, Flame, Headphones } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import SlideShell, { type SlideItem } from "./SlideShell";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import type { MessageMetadata, DCPiste, AgencyRecommendation } from "@/types";

interface Props {
  metadata: MessageMetadata;
  onSelectPiste?: (pisteId: string) => void;
}

function pisteColor(title: string, index: number): string {
  const hues = [250, 340, 160, 30, 200];
  const h = hues[index % hues.length];
  return `hsl(${h}, 60%, 55%)`;
}

const RISK_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  safe: { label: "Safe", color: "hsl(142, 60%, 45%)", icon: Shield },
  bold: { label: "Bold", color: "hsl(30, 90%, 55%)", icon: Flame },
  provocateur: { label: "Provocateur", color: "hsl(0, 70%, 55%)", icon: AlertTriangle },
};

function RiskBadge({ level }: { level?: string }) {
  if (!level) return null;
  const config = RISK_CONFIG[level] || RISK_CONFIG.bold;
  const Icon = config.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider shadow-sm"
      style={{ backgroundColor: `${config.color}15`, color: config.color, border: `1px solid ${config.color}30` }}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function ConvictionBar({ value, accentColor }: { value?: string; accentColor?: string }) {
  if (!value) return null;
  const n = parseInt(value, 10);
  if (isNaN(n)) return null;
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
        Conviction agence
      </span>
      <div className="flex-1 max-w-[140px]">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: accentColor || "hsl(var(--primary))" }}
            initial={{ width: 0 }}
            animate={{ width: `${n * 10}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </div>
      <span className="text-sm font-extrabold text-foreground tabular-nums">{n}/10</span>
    </div>
  );
}

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

function FormatExecutions({ executions }: { executions?: DCPiste["format_executions"] }) {
  if (!executions) return null;
  const entries = Object.entries(executions).filter(([, v]) => v);
  if (entries.length === 0) return null;

  const icons: Record<string, React.ElementType> = {
    social: Smartphone,
    print: Newspaper,
    digital: Monitor,
    audio: Headphones,
  };

  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
        <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        Declinaisons par format
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2 pl-2 pt-1 pb-3"
        >
          {entries.map(([format, desc]) => {
            const Icon = icons[format] || Monitor;
            return (
              <div key={format} className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-3.5 transition-colors hover:bg-muted/40">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {format}
                  </span>
                  <p className="text-xs leading-relaxed text-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function VideoConcept({ concept }: { concept?: DCPiste["video_concept"] }) {
  if (!concept) return null;
  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
        <Play className="h-3 w-3" />
        Concept video — {concept.duration_target}
        <ChevronDown className="h-3 w-3 ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pl-2 pt-1 pb-3 space-y-3"
        >
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Tone</span>
              <p className="text-foreground mt-0.5">{concept.tone_video}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Musique</span>
              <p className="text-foreground mt-0.5">{concept.music_direction}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{concept.concept_summary}</p>

          {/* Sequences timeline */}
          {concept.sequences?.length > 0 && (
            <div className="relative pl-5 border-l-2 border-primary/30 space-y-4">
              {concept.sequences.map((seq, idx) => (
                <motion.div
                  key={seq.sequence}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative"
                >
                  <div className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-foreground">{seq.timing}</span>
                    <p className="text-foreground/80">{seq.visual}</p>
                    {seq.voiceover && (
                      <p className="text-muted-foreground italic">Voix-off : {seq.voiceover}</p>
                    )}
                    {seq.sound && (
                      <p className="text-muted-foreground">Son : {seq.sound}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-5 transition-colors hover:bg-muted/30">
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </h4>
      <p className="text-sm leading-relaxed text-foreground">{text}</p>
    </div>
  );
}

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
      {/* Left: image or number */}
      {hasImage ? (
        <div className="relative h-2/5 w-full lg:h-full lg:w-1/2 overflow-hidden">
          <ImageWithFallback src={piste.thumbnail_url} alt={piste.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-card/10 lg:to-card" />
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <span
              className="rounded-full px-4 py-1.5 text-xs font-bold tracking-wide uppercase shadow-lg"
              style={{ backgroundColor: accentColor, color: "white" }}
            >
              Piste {index + 1}
            </span>
            {isRecommended && <RecommendationBadge />}
          </div>
        </div>
      ) : (
        <div
          className="relative flex h-2/5 w-full lg:h-full lg:w-1/2 items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${accentColor}08 0%, ${accentColor}15 100%)` }}
        >
          <span
            className="pointer-events-none select-none text-[18rem] font-black leading-none lg:text-[24rem]"
            style={{ color: accentColor, opacity: 0.08 }}
          >
            {index + 1}
          </span>
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <span
              className="rounded-full px-4 py-1.5 text-xs font-bold tracking-wide uppercase shadow-sm"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}
            >
              Piste {index + 1}
            </span>
            {isRecommended && <RecommendationBadge />}
          </div>
        </div>
      )}

      {/* Right: content */}
      <div className="flex h-3/5 w-full lg:h-full lg:w-1/2 flex-col justify-start p-6 lg:p-8 overflow-y-auto scrollbar-thin">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h3 className="mb-1 text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">
            {piste.title}
          </h3>
          {piste.headline && piste.headline !== piste.title && (
            <p className="mb-4 text-base font-medium text-primary italic lg:text-lg">
              &ldquo;{piste.headline}&rdquo;
            </p>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <RiskBadge level={piste.risk_level} />
            {isRecommended && !hasImage && <RecommendationBadge />}
          </div>

          <ConvictionBar value={piste.agency_conviction} accentColor={accentColor} />

          <div className="mt-4 mb-4 space-y-3">
            <Section label="Concept" text={piste.concept} />
            <Section label="Direction visuelle" text={piste.tone} />
            <Section label="Justification strategique" text={piste.justification} />
            {piste.differentiation && <Section label="Differenciation" text={piste.differentiation} />}
          </div>

          {/* Collapsible sections */}
          <FormatExecutions executions={piste.format_executions} />
          <VideoConcept concept={piste.video_concept} />

          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => onSelect?.(piste.id)}
              className="group flex h-12 w-fit items-center gap-2.5 rounded-xl px-8 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: accentColor }}
            >
              <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
              Choisir cette piste
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function RecommendationEncadre({ recommendation }: { recommendation?: AgencyRecommendation }) {
  if (!recommendation?.why) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-primary/20 bg-primary/5 px-6 py-5 space-y-2.5"
    >
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 fill-primary text-primary" />
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          {recommendation.recommendation_title || "Recommandation Marcel"}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-foreground">{recommendation.why}</p>
      {recommendation.what_if_not && (
        <p className="text-xs leading-relaxed text-muted-foreground italic mt-1">
          Alternative : {recommendation.what_if_not}
        </p>
      )}
    </motion.div>
  );
}

const DCPresentation = ({ metadata, onSelectPiste }: Props) => {
  const pistes = metadata.pistes || [];
  const recommendation = metadata.agency_recommendation;

  const slides: SlideItem[] = useMemo(
    () =>
      pistes.map((piste, i) => {
        const color = pisteColor(piste.title, i);
        const isRecommended = recommendation?.recommended_piste === i + 1;

        return {
          icon: isRecommended ? Star : Sparkles,
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
      <RecommendationEncadre recommendation={recommendation} />
    </div>
  );
};

export default DCPresentation;
