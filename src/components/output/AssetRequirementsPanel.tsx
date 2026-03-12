import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, Upload, ChevronRight, Image, Package,
  FileText, Type, Users, MapPin, BoxSelect, Palette, ArrowRight, Info,
} from "lucide-react";
import type { ChatMessageMetadata, AssetRequirement, DetectedBrandElement, BrandAssetCategory } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  metadata: ChatMessageMetadata;
  onSwitchToAssets: (categories?: BrandAssetCategory[]) => void;
  onContinue: () => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  logo: Image,
  guideline: FileText,
  font: Type,
  product: Package,
  packaging: BoxSelect,
  character: Users,
  talent: Users,
  location: MapPin,
  venue: MapPin,
  decor: MapPin,
  reference: Palette,
  other: Palette,
};

const CATEGORY_LABELS: Record<string, string> = {
  logo: "Logos",
  guideline: "Charte graphique",
  font: "Typographies",
  product: "Visuels produit",
  packaging: "Packaging",
  character: "Personnages / Casting",
  talent: "Talents / Egeries",
  location: "Lieux / Decors",
  venue: "Lieux / Decors",
  decor: "Decors",
  reference: "References",
  other: "Autres",
};

const PRIORITY_CONFIG = {
  obligatoire: { label: "Obligatoire", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
  recommande: { label: "Recommande", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  optionnel: { label: "Optionnel", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
};

const AssetRequirementsPanel = ({ metadata, onSwitchToAssets, onContinue }: Props) => {
  const [showDetails, setShowDetails] = useState(false);

  const requiredAssets: AssetRequirement[] = (metadata.required_assets || []).filter(
    (a: AssetRequirement) => !a.already_covered
  );
  const coveredAssets: AssetRequirement[] = (metadata.required_assets || []).filter(
    (a: AssetRequirement) => a.already_covered
  );
  const detectedElements: DetectedBrandElement[] = metadata.detected_brand_elements || [];
  const missingCategories: BrandAssetCategory[] = metadata.missing_categories || [];

  const obligatoire = requiredAssets.filter((a) => a.priority === "obligatoire");
  const recommande = requiredAssets.filter((a) => a.priority === "recommande");
  const optionnel = requiredAssets.filter((a) => a.priority === "optionnel");

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Assets de marque requis</h2>
            <p className="text-sm text-muted-foreground">
              {requiredAssets.length} element{requiredAssets.length > 1 ? "s" : ""} manquant{requiredAssets.length > 1 ? "s" : ""}
              {coveredAssets.length > 0 && ` — ${coveredAssets.length} deja fourni${coveredAssets.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {/* Detected brand elements (info box) */}
        {detectedElements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4"
          >
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex w-full items-center gap-2 text-left"
            >
              <Info className="h-4 w-4 text-blue-400 shrink-0" />
              <span className="text-sm font-medium text-blue-400">
                {detectedElements.length} element{detectedElements.length > 1 ? "s" : ""} de marque detecte{detectedElements.length > 1 ? "s" : ""}
              </span>
              <ChevronRight className={cn("ml-auto h-4 w-4 text-blue-400 transition-transform", showDetails && "rotate-90")} />
            </button>
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2">
                    {detectedElements.map((el, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground shrink-0">{el.name}</span>
                        <span>—</span>
                        <span>{el.description}</span>
                        <span className="ml-auto text-[10px] uppercase opacity-50">{el.source}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Missing assets — grouped by priority */}
        {[
          { items: obligatoire, priority: "obligatoire" as const },
          { items: recommande, priority: "recommande" as const },
          { items: optionnel, priority: "optionnel" as const },
        ]
          .filter((g) => g.items.length > 0)
          .map((group) => {
            const cfg = PRIORITY_CONFIG[group.priority];
            return (
              <motion.div
                key={group.priority}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-bold uppercase tracking-wider", cfg.color)}>
                    {cfg.label}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-2">
                  {group.items.map((asset, i) => {
                    const Icon = CATEGORY_ICONS[asset.category] || Palette;
                    return (
                      <button
                        key={i}
                        onClick={() => onSwitchToAssets([asset.category])}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all hover:bg-accent/50",
                          cfg.border
                        )}
                      >
                        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", cfg.bg)}>
                          <Icon className={cn("h-4 w-4", cfg.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {CATEGORY_LABELS[asset.category] || asset.category}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{asset.description}</p>
                        </div>
                        <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}

        {/* Already covered */}
        {coveredAssets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                Deja fournis
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-1">
              {coveredAssets.map((asset, i) => {
                const Icon = CATEGORY_ICONS[asset.category] || Palette;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 opacity-70"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <Icon className="h-4 w-4 text-emerald-500 shrink-0" />
                    <p className="text-sm text-foreground">{CATEGORY_LABELS[asset.category] || asset.category}</p>
                    {asset.covered_by && (
                      <span className="ml-auto text-[10px] text-muted-foreground">{asset.covered_by}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-border px-6 py-4 space-y-2">
        <button
          onClick={() => onSwitchToAssets(missingCategories)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90"
        >
          <Upload className="h-4 w-4" />
          Uploader mes assets
        </button>
        <button
          onClick={onContinue}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Passer cette etape
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default AssetRequirementsPanel;
