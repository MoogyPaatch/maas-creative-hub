import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import SlideShell, { type SlideItem } from "./SlideShell";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import type { MessageMetadata, DCPiste } from "@/types";

interface Props {
  metadata: MessageMetadata;
  onSelectPiste?: (pisteId: string) => void;
}

function pisteColor(title: string, index: number): string {
  const hues = [250, 340, 160, 30, 200];
  const h = hues[index % hues.length];
  return `hsl(${h}, 60%, 55%)`;
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

function StatementSlide({
  piste,
  index,
  onSelect,
  accentColor,
}: {
  piste: DCPiste;
  index: number;
  onSelect?: (id: string) => void;
  accentColor: string;
}) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-card p-6 lg:p-12">
      <span
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[18rem] font-black leading-none lg:text-[24rem]"
        style={{ color: accentColor, opacity: 0.06 }}
      >
        {index + 1}
      </span>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        <span
          className="mb-4 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          Piste {index + 1}
        </span>

        <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-foreground lg:text-4xl">
          {piste.title}
        </h2>

        {piste.headline && piste.headline !== piste.title && (
          <p className="mb-8 text-lg font-medium italic text-primary lg:text-xl">
            "{piste.headline}"
          </p>
        )}

        <div className="mb-8 w-full space-y-3 text-left">
          <Section label="Concept" text={piste.concept} />
          <Section label="Direction visuelle" text={piste.tone} />
          <Section label="Justification stratégique" text={piste.justification} />
        </div>

        <button
          onClick={() => onSelect?.(piste.id)}
          className="flex h-12 items-center gap-2.5 rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
        >
          <Sparkles className="h-4 w-4" />
          Choisir cette piste
        </button>
      </div>
    </div>
  );
}

function ImageSlide({
  piste,
  index,
  onSelect,
  accentColor,
}: {
  piste: DCPiste;
  index: number;
  onSelect?: (id: string) => void;
  accentColor: string;
}) {
  return (
    <div className="flex h-full w-full flex-col lg:flex-row overflow-hidden bg-card">
      <div className="relative h-2/5 w-full lg:h-full lg:w-1/2 overflow-hidden">
        <ImageWithFallback
          src={piste.thumbnail_url}
          alt={piste.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-card/60" />
        <div className="absolute bottom-4 left-4">
          <span
            className="rounded-full px-4 py-1.5 text-xs font-bold tracking-wide uppercase shadow-lg"
            style={{ backgroundColor: accentColor, color: "white" }}
          >
            Piste {index + 1}
          </span>
        </div>
      </div>

      <div className="flex h-3/5 w-full lg:h-full lg:w-1/2 flex-col justify-center p-6 lg:p-10 overflow-y-auto scrollbar-thin">
        <h3 className="mb-2 text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">
          {piste.title}
        </h3>
        {piste.headline && piste.headline !== piste.title && (
          <p className="mb-6 text-base font-medium text-primary italic lg:text-lg">
            "{piste.headline}"
          </p>
        )}

        <div className="mb-8 space-y-3">
          <Section label="Concept" text={piste.concept} />
          <Section label="Direction visuelle" text={piste.tone} />
          <Section label="Justification stratégique" text={piste.justification} />
        </div>

        <button
          onClick={() => onSelect?.(piste.id)}
          className="flex h-11 w-fit items-center gap-2 rounded-xl bg-primary px-7 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
        >
          <Sparkles className="h-4 w-4" />
          Choisir cette piste
        </button>
      </div>
    </div>
  );
}

const DCPresentation = ({ metadata, onSelectPiste }: Props) => {
  const pistes = metadata.pistes || [];

  const slides: SlideItem[] = useMemo(
    () =>
      pistes.map((piste, i) => {
        const color = pisteColor(piste.title, i);
        const hasImage = !!piste.thumbnail_url;

        return {
          icon: Sparkles,
          title: piste.title,
          color: `${color.replace(")", "/0.3)")}`,
          content: hasImage ? (
            <ImageSlide piste={piste} index={i} onSelect={onSelectPiste} accentColor={color} />
          ) : (
            <StatementSlide piste={piste} index={i} onSelect={onSelectPiste} accentColor={color} />
          ),
        };
      }),
    [pistes, onSelectPiste]
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
