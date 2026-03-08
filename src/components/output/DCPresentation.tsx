import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, ChevronDown, Play, Monitor, Newspaper, Smartphone, AlertTriangle, Shield, Flame } from "lucide-react";
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
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: `${config.color}20`, color: config.color }}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function ConvictionBar({ value }: { value?: string }) {
  if (!value) return null;
  const n = parseInt(value, 10);
  if (isNaN(n)) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Conviction agence
      </span>
      <div className="flex-1 max-w-[120px]">
        <Progress value={n * 10} className="h-1.5" />
      </div>
      <span className="text-xs font-bold text-foreground">{n}/10</span>
    </div>
  );
}

function RecommendationBadge() {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, delay: 0.3 }}
      className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
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
  };

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex w-full items-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
        <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        Déclinaisons
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pl-2 pt-1 pb-2">
          {entries.map(([format, desc]) => {
            const Icon = icons[format] || Monitor;
            return (
              <div key={format} className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-3">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {format}
                  </span>
                  <p className="text-xs leading-relaxed text-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function VideoConcept({ concept }: { concept?: DCPiste["video_concept"] }) {
  if (!concept) return null;
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex w-full items-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
        <Play className="h-3 w-3" />
        Concept vidéo — {concept.duration_target}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-2 pt-1 pb-2 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-border bg-muted/20 p-2">
              <span className="text-[9px] font-bold uppercase text-muted-foreground">Tone</span>
              <p className="text-foreground">{concept.tone_video}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-2">
              <span className="text-[9px] font-bold uppercase text-muted-foreground">Musique</span>
              <p className="text-foreground">{concept.music_direction}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{concept.concept_summary}</p>

          {/* Sequences timeline */}
          {concept.sequences?.length > 0 && (
            <div className="relative pl-4 border-l-2 border-border space-y-3">
              {concept.sequences.map((seq) => (
                <div key={seq.sequence} className="relative">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-foreground border-2 border-background" />
                  <div className="text-xs">
                    <span className="font-bold text-foreground">{seq.timing}</span>
                    <p className="text-muted-foreground mt-0.5">{seq.visual}</p>
                    {seq.voiceover && (
                      <p className="text-muted-foreground/70 italic mt-0.5">🎙 {seq.voiceover}</p>
                    )}
                    {seq.sound && (
                      <p className="text-muted-foreground/70 mt-0.5">🔊 {seq.sound}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5">
      <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
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
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-card/60" />
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
        <div className="relative flex h-2/5 w-full lg:h-full lg:w-1/2 items-center justify-center overflow-hidden">
          <span
            className="pointer-events-none select-none text-[18rem] font-black leading-none lg:text-[24rem]"
            style={{ color: accentColor, opacity: 0.06 }}
          >
            {index + 1}
          </span>
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <span
              className="rounded-full px-4 py-1.5 text-xs font-bold tracking-wide uppercase"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              Piste {index + 1}
            </span>
            {isRecommended && <RecommendationBadge />}
          </div>
        </div>
      )}

      {/* Right: content */}
      <div className="flex h-3/5 w-full lg:h-full lg:w-1/2 flex-col justify-start p-6 lg:p-10 overflow-y-auto scrollbar-thin">
        <h3 className="mb-1 text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">
          {piste.title}
        </h3>
        {piste.headline && piste.headline !== piste.title && (
          <p className="mb-4 text-base font-medium text-primary italic lg:text-lg">
            "{piste.headline}"
          </p>
        )}

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <RiskBadge level={piste.risk_level} />
          {isRecommended && !hasImage && <RecommendationBadge />}
        </div>

        <ConvictionBar value={piste.agency_conviction} />

        <div className="mt-4 mb-4 space-y-3">
          <Section label="Concept" text={piste.concept} />
          <Section label="Direction visuelle" text={piste.tone} />
          <Section label="Justification stratégique" text={piste.justification} />
          {piste.differentiation && <Section label="Différenciation" text={piste.differentiation} />}
        </div>

        {/* Collapsible sections */}
        <FormatExecutions executions={piste.format_executions} />
        <VideoConcept concept={piste.video_concept} />

        <div className="mt-6">
          <button
            onClick={() => onSelect?.(piste.id)}
            className="flex h-11 w-fit items-center gap-2 rounded-xl bg-primary px-7 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
          >
            <Sparkles className="h-4 w-4" />
            Choisir cette piste
          </button>
        </div>
      </div>
    </div>
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
    <SlideShell
      slides={slides}
      title="Direction Créative"
      titleIcon={Sparkles}
      slidesUrl={metadata.slides_url}
      pptxUrl={metadata.pptx_url}
    />
  );
};

export default DCPresentation;
