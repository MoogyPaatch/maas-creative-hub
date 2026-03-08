import { motion } from "framer-motion";
import { ExternalLink, Download, Film, Users, MapPin, Wrench, Image } from "lucide-react";
import type { MessageMetadata } from "@/types";

interface Props {
  metadata: MessageMetadata;
}

const PPMPresentation = ({ metadata }: Props) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="h-full overflow-y-auto p-8 scrollbar-thin"
  >
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">Dossier de Pré-Production</h2>
        <p className="text-sm text-muted-foreground">{metadata.summary}</p>
        {(metadata.slides_url || metadata.pptx_url) && (
          <div className="mt-4 flex gap-3">
            {metadata.slides_url && (
              <a href={metadata.slides_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted">
                <ExternalLink className="h-3.5 w-3.5" /> Google Slides
              </a>
            )}
            {metadata.pptx_url && (
              <a href={metadata.pptx_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted">
                <Download className="h-3.5 w-3.5" /> Télécharger PPTX
              </a>
            )}
          </div>
        )}
      </div>

      {metadata.storyboard && metadata.storyboard.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Film className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Storyboard ({metadata.storyboard_count} frames)
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metadata.storyboard.map((frame, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-muted">
                  <span className="text-3xl font-bold text-muted-foreground/30">{frame.frame_number}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {frame.duration}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{frame.camera}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground">{frame.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {metadata.casting && metadata.casting.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Casting ({metadata.casting_count})
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {metadata.casting.map((c, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <h4 className="mb-1 font-semibold text-foreground">{c.role}</h4>
                <p className="text-sm text-muted-foreground">{c.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {metadata.settings && metadata.settings.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Décors ({metadata.settings_count})
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {metadata.settings.map((s, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <h4 className="mb-1 font-semibold text-foreground">{s.name}</h4>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {metadata.production_notes && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notes de Production</h3>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <p className="text-sm text-foreground"><strong>Budget :</strong> {metadata.production_notes.budget_range}</p>
            <p className="text-sm text-foreground"><strong>Planning :</strong> {metadata.production_notes.timeline}</p>
          </div>
        </section>
      )}

      {metadata.mockups && metadata.mockups.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Image className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Maquettes ({metadata.mockup_count})
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {metadata.mockups.map((m, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <span className="mb-2 inline-block rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {m.format}
                </span>
                <p className="text-sm text-foreground">{m.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  </motion.div>
);

export default PPMPresentation;
