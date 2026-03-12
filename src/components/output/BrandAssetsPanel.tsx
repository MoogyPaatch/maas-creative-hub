import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Package, FileText, Type, Palette, Upload, X, Loader2, Users, MapPin, BoxSelect } from "lucide-react";
import type { BrandAsset, BrandAssetCategory } from "@/types";
import { uploadFile, mapBrandAsset } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  assets: BrandAsset[];
  onAssetsChange: (assets: BrandAsset[]) => void;
  highlightCategories?: BrandAssetCategory[];
  projectId: string;
  onUploadComplete?: (filename: string) => void;
  onContinueProduction?: () => void;
}

type CategoryItem = { key: BrandAssetCategory; label: string; icon: React.ElementType; description: string };
type CategoryGroup = { title: string; subtitle?: string; items: CategoryItem[] };

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    title: "Identite de marque",
    items: [
      { key: "logo", label: "Logos", icon: Image, description: "SVG, PNG, AI — toutes declinaisons" },
      { key: "guideline", label: "Charte graphique", icon: FileText, description: "PDF, guidelines, DA" },
      { key: "font", label: "Typographies", icon: Type, description: "OTF, TTF, WOFF" },
      { key: "packaging", label: "Packaging", icon: BoxSelect, description: "Emballages, PLV, presentoirs" },
    ],
  },
  {
    title: "References campagne",
    subtitle: "Optionnel — sinon notre IA generera des propositions",
    items: [
      { key: "product", label: "Visuels produit", icon: Package, description: "Packshots, photos ambiance" },
      { key: "character", label: "Personnages / Casting", icon: Users, description: "Photos talent, egeries, portraits casting" },
      { key: "location", label: "Lieux / Decors", icon: MapPin, description: "Photos lieux, decors, ambiances spatiales" },
      { key: "other", label: "Autres inspirations", icon: Palette, description: "Moodboards, references, textures, divers" },
    ],
  },
];

const BrandAssetsPanel = ({ assets, onAssetsChange, highlightCategories, projectId, onUploadComplete, onContinueProduction }: Props) => {
  const [expandedCat, setExpandedCat] = useState<BrandAssetCategory | null>("logo");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCat, setActiveCat] = useState<BrandAssetCategory>("logo");
  const [dragOver, setDragOver] = useState<BrandAssetCategory | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  const handleFiles = useCallback(async (files: FileList, category: BrandAssetCategory) => {
    for (const file of Array.from(files)) {
      if (file.size / (1024 * 1024) > 20) {
        toast.error(`${file.name} depasse 20 MB`);
        continue;
      }
      const tempId = `uploading-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setUploadingFiles((prev) => new Set(prev).add(tempId));
      try {
        const uploadedAsset = await uploadFile(projectId, file, category);
        const mapped = mapBrandAsset(uploadedAsset);
        onAssetsChange([...assets, mapped]);
        toast.success(`${file.name} envoye`);
        onUploadComplete?.(file.name);
      } catch {
        toast.error(`Echec de l'upload de ${file.name}`);
      } finally {
        setUploadingFiles((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
      }
    }
  }, [assets, onAssetsChange, projectId]);

  const handleRemove = useCallback(async (id: string) => {
    onAssetsChange(assets.filter((a) => a.id !== id));
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
      const token = localStorage.getItem("maas_token");
      await fetch(`${API_URL}/brand-assets/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // Optimistic removal already done — backend delete is best-effort
    }
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
  const isUploading = uploadingFiles.size > 0;

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Assets de marque</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {totalCount} fichier{totalCount !== 1 ? "s" : ""} upload{totalCount !== 1 ? "s" : ""}
              {isUploading && " — upload en cours..."}
            </p>
          </div>
          {isUploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
      </div>

      {highlightCategories && highlightCategories.length > 0 && (
        <div className="mx-4 mt-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-medium text-foreground mb-2">Assets requis pour cette campagne</p>
          <ul className="mb-3 space-y-1">
            {highlightCategories.map((cat) => {
              const catItem = CATEGORY_GROUPS.flatMap(g => g.items).find(c => c.key === cat);
              return (
                <li key={cat} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {catItem?.label || cat}
                </li>
              );
            })}
          </ul>
          {onContinueProduction && (
            <button
              onClick={onContinueProduction}
              className="w-full rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              Continuer la production
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4" role="list" aria-label="Categories d'assets">
        {CATEGORY_GROUPS.map((group) => (
          <div key={group.title} className="space-y-2">
            <div className="px-1 pt-1">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {group.title}
              </h3>
              {group.subtitle && (
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{group.subtitle}</p>
              )}
            </div>
            {group.items.map((cat) => {
          const catAssets = assets.filter((a) => a.category === cat.key);
          const isExpanded = expandedCat === cat.key;
          const isHighlighted = highlightCategories?.includes(cat.key);
          const Icon = cat.icon;

          return (
            <div
              key={cat.key}
              role="listitem"
              className={cn(
                "rounded-xl border transition-all",
                isHighlighted ? "border-primary/50 bg-primary/5" : "border-border",
                isExpanded ? "bg-card" : "bg-card/50"
              )}
            >
              <button
                onClick={() => setExpandedCat(isExpanded ? null : cat.key)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
                aria-expanded={isExpanded}
                aria-label={`${cat.label} — ${catAssets.length} fichier${catAssets.length !== 1 ? "s" : ""}`}
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
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0" aria-hidden>
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              </button>

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
                      <div
                        onDrop={(e) => handleDrop(e, cat.key)}
                        onDragOver={(e) => handleDragOver(e, cat.key)}
                        onDragLeave={() => setDragOver(null)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Zone de depot pour ${cat.label}`}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-5 transition-colors cursor-pointer",
                          dragOver === cat.key
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/30"
                        )}
                        onClick={() => openFilePicker(cat.key)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openFilePicker(cat.key); }}
                      >
                        <Upload className="mb-1.5 h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Glissez vos fichiers ou{" "}
                          <span className="text-primary font-medium">parcourez</span>
                        </span>
                      </div>

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
                            {asset.file_type.startsWith("image/") && asset.preview_url ? (
                              <img
                                src={asset.preview_url}
                                alt={asset.file_name}
                                className="h-10 w-10 rounded-md object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
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
                              aria-label={`Supprimer ${asset.file_name}`}
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
        ))}
      </div>

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
