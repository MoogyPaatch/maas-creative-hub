import { motion } from "framer-motion";
import { Type, FileText, Video, Music } from "lucide-react";
import type { MessageMetadata } from "@/types";

interface Props {
  metadata: MessageMetadata;
}

const DCCopyResult = ({ metadata }: Props) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="h-full overflow-y-auto p-8 scrollbar-thin"
  >
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">Propositions de Copy</h2>
        <p className="text-sm text-muted-foreground">Textes et scripts créatifs</p>
      </div>

      {metadata.headlines && metadata.headlines.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Type className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Accroches</h3>
          </div>
          <div className="space-y-3">
            {metadata.headlines.map((h, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {h.format}
                  </span>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Variante {h.variant}
                  </span>
                </div>
                <p className="text-lg font-semibold text-foreground">{h.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {metadata.body_copy && metadata.body_copy.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Body Copy</h3>
          </div>
          <div className="space-y-3">
            {metadata.body_copy.map((b, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {b.format}
                  </span>
                  <span className="text-xs text-muted-foreground">{b.word_count} mots</span>
                </div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{b.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {metadata.video_scripts && metadata.video_scripts.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Scripts Vidéo</h3>
          </div>
          <div className="space-y-3">
            {metadata.video_scripts.map((v, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <span className="mb-2 inline-block rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {v.duration}
                </span>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{v.script}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {metadata.audio_scripts && metadata.audio_scripts.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Music className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Scripts Audio</h3>
          </div>
          <div className="space-y-3">
            {metadata.audio_scripts.map((a, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <span className="mb-2 inline-block rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {a.duration}
                </span>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{a.script}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  </motion.div>
);

export default DCCopyResult;
