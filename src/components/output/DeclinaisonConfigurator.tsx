import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Video,
  Image as ImageIcon,
  Music,
  CheckSquare,
  Square,
  Rocket,
  SkipForward,
  Settings2,
} from "lucide-react";
import type { MessageMetadata } from "@/types";

interface Props {
  metadata: MessageMetadata;
  onLaunch: (config: Record<string, Record<string, boolean>>) => void;
  onSkip: () => void;
}

const mediaIcons: Record<string, React.ElementType> = {
  video: Video,
  image: ImageIcon,
  audio: Music,
};

const mediaLabels: Record<string, string> = {
  video: "Video",
  image: "Image",
  audio: "Audio",
};

const DeclinaisonConfigurator = ({ metadata, onLaunch, onSkip }: Props) => {
  const recommendedFormats = (metadata.recommended_formats || {}) as Record<string, string[]>;
  const mediaTypes = (metadata.media_types || []) as string[];

  // Build initial state: all recommended formats checked
  const [selections, setSelections] = useState<Record<string, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = {};
    for (const media of mediaTypes) {
      const formats = recommendedFormats[media] || [];
      initial[media] = {};
      for (const fmt of formats) {
        initial[media][fmt] = true;
      }
    }
    return initial;
  });

  const toggle = useCallback((media: string, format: string) => {
    setSelections((prev) => ({
      ...prev,
      [media]: {
        ...prev[media],
        [format]: !prev[media]?.[format],
      },
    }));
  }, []);

  const totalSelected = Object.values(selections).reduce(
    (sum, formats) => sum + Object.values(formats).filter(Boolean).length,
    0,
  );

  const handleLaunch = () => {
    // Only include media types with at least one format selected
    const config: Record<string, Record<string, boolean>> = {};
    for (const [media, formats] of Object.entries(selections)) {
      const selected = Object.entries(formats).filter(([, v]) => v);
      if (selected.length > 0) {
        config[media] = Object.fromEntries(selected);
      }
    }
    onLaunch(config);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 border-b border-border bg-card/60 px-6 py-5 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <Settings2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Configurateur de declinaisons</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Selectionnez les formats souhaites pour chaque type de media
            </p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {mediaTypes.map((media) => {
          const Icon = mediaIcons[media] || Video;
          const formats = recommendedFormats[media] || [];
          const selectedCount = Object.values(selections[media] || {}).filter(Boolean).length;

          return (
            <motion.section
              key={media}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mediaTypes.indexOf(media) * 0.1 }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {mediaLabels[media] || media}
                </h3>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {selectedCount}/{formats.length}
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {formats.map((format) => {
                  const checked = !!selections[media]?.[format];
                  return (
                    <button
                      key={format}
                      onClick={() => toggle(media, format)}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                        checked
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                    >
                      {checked ? (
                        <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className={`text-sm font-medium ${checked ? "text-foreground" : "text-muted-foreground"}`}>
                        {format}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.section>
          );
        })}

        {mediaTypes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Settings2 className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Aucun format de declinaison disponible.
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 border-t border-border bg-card/60 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {totalSelected} format{totalSelected > 1 ? "s" : ""} selectionne{totalSelected > 1 ? "s" : ""}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onSkip}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition"
            >
              <SkipForward className="h-4 w-4" />
              Passer
            </button>
            <button
              onClick={handleLaunch}
              disabled={totalSelected === 0}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Rocket className="h-4 w-4" />
              Lancer ({totalSelected})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeclinaisonConfigurator;
