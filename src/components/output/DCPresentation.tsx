import { motion } from "framer-motion";
import { ExternalLink, Download, Sparkles } from "lucide-react";
import type { MessageMetadata } from "@/types";

interface Props {
  metadata: MessageMetadata;
  onSelectPiste?: (pisteId: string) => void;
}

const DCPresentation = ({ metadata, onSelectPiste }: Props) => {
  const pistes = metadata.pistes || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto p-8 scrollbar-thin"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Direction Créative</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            3 pistes créatives distinctes — Sélectionnez celle qui vous inspire
          </p>
          {(metadata.slides_url || metadata.pptx_url) && (
            <div className="mt-4 flex gap-3">
              {metadata.slides_url && (
                <a
                  href={metadata.slides_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Voir sur Google Slides
                </a>
              )}
              {metadata.pptx_url && (
                <a
                  href={metadata.pptx_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5" /> Télécharger PPTX
                </a>
              )}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {pistes.map((piste, i) => (
            <motion.div
              key={piste.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg"
            >
              {piste.thumbnail_url && (
                <div className="relative h-64 w-full overflow-hidden bg-muted">
                  <img
                    src={piste.thumbnail_url}
                    alt={piste.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                  <div className="absolute bottom-4 left-6">
                    <span className="rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Piste {i + 1}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-6">
                <h3 className="mb-2 text-xl font-bold text-foreground">{piste.title}</h3>
                {piste.headline && piste.headline !== piste.title && (
                  <p className="mb-3 text-base font-medium text-primary italic">"{piste.headline}"</p>
                )}

                <div className="mb-4 space-y-3">
                  <div>
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Concept
                    </h4>
                    <p className="text-sm leading-relaxed text-foreground">{piste.concept}</p>
                  </div>
                  <div>
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Direction visuelle
                    </h4>
                    <p className="text-sm text-foreground">{piste.tone}</p>
                  </div>
                  <div>
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Justification stratégique
                    </h4>
                    <p className="text-sm leading-relaxed text-foreground">{piste.justification}</p>
                  </div>
                </div>

                <button
                  onClick={() => onSelectPiste?.(piste.id)}
                  className="flex h-10 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md"
                >
                  <Sparkles className="h-4 w-4" />
                  Choisir cette piste
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DCPresentation;
