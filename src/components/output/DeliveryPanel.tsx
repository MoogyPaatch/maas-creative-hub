import { motion } from "framer-motion";
import { Download, Package, ExternalLink, FileText, Image, Video, AudioLines } from "lucide-react";
import type { ProductionAsset } from "@/types";

interface Props {
  zipUrl?: string;
  assets: ProductionAsset[];
  campaignTitle?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  image: Image,
  video: Video,
  audio: AudioLines,
  document: FileText,
};

const DeliveryPanel = ({ zipUrl, assets, campaignTitle }: Props) => {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-8 scrollbar-thin">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10"
          >
            <Package className="h-8 w-8 text-success" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground">
            {campaignTitle || "Campagne livrée"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tous vos assets sont prêts à être téléchargés.
          </p>
        </div>

        {/* Download all ZIP */}
        {zipUrl && (
          <motion.a
            href={zipUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-5 transition-all hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/10 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Télécharger tout</p>
                <p className="text-xs text-muted-foreground">Archive ZIP complète</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </motion.a>
        )}

        {/* Asset list */}
        {assets.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground mb-4">Assets individuels</h3>
            {assets.map((asset, i) => {
              const Icon = typeIcons[asset.type] || FileText;
              return (
                <motion.a
                  key={asset.id}
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md group"
                >
                  {asset.thumbnail_url ? (
                    <img
                      src={asset.thumbnail_url}
                      alt={asset.title}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{asset.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {asset.format.toUpperCase()}
                      {asset.file_size && ` · ${asset.file_size}`}
                      {asset.duration && ` · ${asset.duration}`}
                    </p>
                  </div>
                  <Download className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                </motion.a>
              );
            })}
          </div>
        )}

        {!zipUrl && assets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              Les assets de livraison seront disponibles ici une fois la production terminée.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DeliveryPanel;
