import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Package, FileText, Type, Palette, Upload, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BrandAsset, BrandAssetCategory } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  assets: BrandAsset[];
  onAssetsChange: (assets: BrandAsset[]) => void;
  highlightCategories?: BrandAssetCategory[];
}

const CATEGORIES: { key: BrandAssetCategory; label: string; icon: React.ElementType; description: string }[] = [
  { key: "logo", label: "Logos", icon: Image, description: "SVG, PNG, AI — toutes déclinaisons" },
  { key: "product", label: "Visuels produit", icon: Package, description: "Packshots, photos ambiance" },
  { key: "guidelines", label: "Charte graphique", icon: FileText, description: "PDF, guidelines, DA" },
  { key: "typography", label: "Typographies", icon: Type, description: "OTF, TTF, WOFF" },
  { key: "graphics", label: "Éléments graphiques", icon: Palette, description: "Patterns, textures, pictos" },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const BrandAssetsPanel = ({ assets, onAssetsChange, highlightCategories }: Props) => {
  const [expandedCat, setExpandedCat] = useState<BrandAssetCategory | null>("logo");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCat, setActiveCat] = useState<BrandAssetCategory>("logo");
  const [dragOver, setDragOver] = useState<BrandAssetCategory | null>(null);

  const handleFiles = useCallback((files: FileList, category: BrandAssetCategory) => {
    const newAssets: BrandAsset[] = Array.from(files).map((file) => ({
      id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category,
      file_name: file.name,
      file_size: formatSize(file.size),
      file_type: file.type,
      preview_url: URL.createObjectURL(file),
      uploaded_at: new Date().toISOString(),
    }));
    onAssetsChange([...assets, ...newAssets]);
  }, [assets, onAssetsChange]);

  const handleRemove = useCallback((id: string) => {
    const asset = assets.find((a) => a.id === id);
    if (asset) URL.revokeObjectURL(asset.preview_url);
    onAssetsChange(assets.filter((a) => a.id !== id));
  }, [assets, onAssetsChange]);

  const handleDrop = useCallback((e: React.DragEvent, category: BrandAssetCategory) => {
    e.preventDefault();
    setDragOver(null);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files, category);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent, category: BrandAssetCategory) => {
    e.preventDefault();
    setDragOver(category);
  }, []);

  const openFilePicker = (category: BrandAssetCategory) => {
    setActiveCat(category);
    fileInputRef.current?.click();
  };

  const totalCount = assets.length;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Assets de marque</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {totalCount} fichier{totalCount !== 1 ? "s" : ""} uploadé{totalCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {CATEGORIES.map((cat) => {
          const catAssets = assets.filter((a) => a.category === cat.key);
          const isExpanded = expandedCat === cat.key;
          const isHighlighted = highlightCategories?.includes(cat.key);
          const Icon = cat.icon;

          return (
            <div
              key={cat.key}
              className={cn(
                "rounded-xl border transition-all",
                isHighlighted ? "border-primary/50 bg-primary/5" : "border-border",
                isExpanded ? "bg-card" : "bg-card/50"
              )}
            >
              {/* Category header */}
              <button
                onClick={() => setExpandedCat(isExpanded ? null : cat.key)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  isHighlighted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{cat.label}</span>
                    {catAssets.length > 0 && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {catAssets.length}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{cat.description}</p>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-muted-foreground"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {/* Drop zone */}
                      <div
                        onDrop={(e) => handleDrop(e, cat.key)}
                        onDragOver={(e) => handleDragOver(e, cat.key)}
                        onDragLeave={() => setDragOver(null)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-5 transition-colors cursor-pointer",
                          dragOver === cat.key
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/30"
                        )}
                        onClick={() => openFilePicker(cat.key)}
                      >
                        <Upload className="mb-1.5 h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Glissez vos fichiers ou{" "}
                          <span className="text-primary font-medium">parcourez</span>
                        </span>
                      </div>

                      {/* File list */}
                      <AnimatePresence>
                        {catAssets.map((asset, i) => (
                          <motion.div
                            key={asset.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-3 rounded-lg border border-border bg-background p-2"
                          >
                            {/* Thumbnail */}
                            {asset.file_type.startsWith("image/") ? (
                              <img
                                src={asset.preview_url}
                                alt={asset.file_name}
                                className="h-10 w-10 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{asset.file_name}</p>
                              <p className="text-[10px] text-muted-foreground">{asset.file_size}</p>
                            </div>
                            <button
                              onClick={() => handleRemove(asset.id)}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            handleFiles(e.target.files, activeCat);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
};

export default BrandAssetsPanel;
