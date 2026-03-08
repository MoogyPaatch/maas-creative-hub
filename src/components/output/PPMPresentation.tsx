import { useMemo, type ReactNode } from "react";
import {
  Film,
  Users,
  MapPin,
  Wrench,
  Image,
  FileText,
} from "lucide-react";
import SlideShell, { type SlideItem } from "./SlideShell";
import type { MessageMetadata } from "@/types";

interface Props {
  metadata: MessageMetadata;
}

/* ─── Slide Builders ─── */
function buildSlides(metadata: MessageMetadata): SlideItem[] {
  const slides: SlideItem[] = [];

  // Title slide
  slides.push({
    icon: FileText,
    title: "Dossier PPM",
    color: "hsl(239, 60%, 55%, 0.2)",
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
        title: isFirst ? "Storyboard" : `Story ${i + 1}–${i + chunk.length}`,
        color: "hsl(340, 60%, 55%, 0.2)",
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
      color: "hsl(160, 60%, 45%, 0.2)",
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
      color: "hsl(30, 70%, 50%, 0.2)",
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
      color: "hsl(200, 60%, 50%, 0.2)",
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
      color: "hsl(280, 60%, 55%, 0.2)",
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

/* ─── Main Component ─── */
const PPMPresentation = ({ metadata }: Props) => {
  const slides = useMemo(() => buildSlides(metadata), [metadata]);

  return (
    <SlideShell
      slides={slides}
      title="Dossier PPM"
      titleIcon={FileText}
      slidesUrl={metadata.slides_url}
      pptxUrl={metadata.pptx_url}
    />
  );
};

export default PPMPresentation;
