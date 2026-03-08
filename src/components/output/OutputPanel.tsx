import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CreativeBrief from "./CreativeBrief";
import DCPresentation from "./DCPresentation";
import DCCopyResult from "./DCCopyResult";
import PPMPresentation from "./PPMPresentation";
import CampaignGallery from "./CampaignGallery";
import CreativeCanvas from "./CreativeCanvas";
import ValidationPanel from "./ValidationPanel";
import BrandAssetsPanel from "./BrandAssetsPanel";
import DeliveryPanel from "./DeliveryPanel";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { ChatMessage, BrandAsset, BrandAssetCategory, ProductionAsset, BriefData } from "@/types";
import { Sparkles, FolderOpen, PenTool, FileText, Palette, Film, Rocket, Package } from "lucide-react";

interface Props {
  artifacts: ChatMessage[];
  briefData?: BriefData;
  onSelectPiste?: (pisteId: string) => void;
  onApprove?: (id: string, feedback: string | null) => void;
  onReject?: (id: string, feedback: string) => void;
  brandAssets?: BrandAsset[];
  onBrandAssetsChange?: (assets: BrandAsset[]) => void;
  highlightAssetCategories?: BrandAssetCategory[];
  showAssetsTab?: boolean;
  onBriefChange?: (content: string) => void;
  currentStep?: string;
}

function briefToMarkdown(brief: BriefData): string {
  if (!brief) return "";
  const lines: string[] = [];
  if (brief.brand) lines.push(`## Marque\n${brief.brand}`);
  if (brief.product) lines.push(`## Produit\n${brief.product}`);
  if (brief.objective) lines.push(`## Objectif\n${brief.objective}`);
  if (brief.budget) lines.push(`## Budget\n${brief.budget}`);
  if (brief.channels?.length) lines.push(`## Canaux\n${brief.channels.map((c: string) => `- ${c}`).join("\n")}`);
  if (brief.tone?.length) lines.push(`## Ton\n${brief.tone.join(", ")}`);
  if (brief.key_message) lines.push(`## Message clé\n> ${brief.key_message}`);
  if (brief.kpis?.length) lines.push(`## KPIs\n${brief.kpis.map((k: string) => `- ${k}`).join("\n")}`);
  if (brief.timing) lines.push(`## Timing\n${brief.timing}`);
  const known = ["brand", "product", "objective", "budget", "channels", "tone", "key_message", "kpis", "timing"];
  Object.entries(brief).forEach(([key, val]) => {
    if (!known.includes(key) && val) {
      lines.push(`## ${key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}\n${typeof val === "string" ? val : JSON.stringify(val, null, 2)}`);
    }
  });
  return lines.join("\n\n");
}

const emptyStateByStep: Record<string, { icon: React.ElementType; title: string; desc: string }> = {
  commercial: { icon: FileText, title: "En attente du brief…", desc: "Discutez avec Marcel pour définir votre brief stratégique. Il apparaîtra ici." },
  planner: { icon: Sparkles, title: "Stratégie en cours…", desc: "Marcel analyse votre brief et prépare les pistes créatives." },
  dc_visual: { icon: Palette, title: "Direction artistique…", desc: "Les pistes visuelles sont en cours de génération." },
  dc_copy: { icon: PenTool, title: "Copy en création…", desc: "Marcel rédige les messages et accroches de votre campagne." },
  ppm: { icon: Film, title: "Pré-production…", desc: "Le plan de production se construit." },
  default: { icon: Rocket, title: "Espace créatif", desc: "Les livrables apparaîtront ici au fil de la conversation." },
};

const OutputPanel = ({ artifacts, briefData, onSelectPiste, onApprove, onReject, brandAssets = [], onBrandAssetsChange, highlightAssetCategories, showAssetsTab = true, onBriefChange, currentStep }: Props) => {
  const typedArtifacts = artifacts.filter((a) => a.metadata?.type);
  
  const displayItems: { type: string; content?: string; metadata?: any }[] = [];
  
  if (briefData) {
    displayItems.push({ type: "creative_brief", content: briefToMarkdown(briefData) });
  }
  
  typedArtifacts.forEach((a) => {
    if (a.metadata?.type === "creative_brief" && briefData) return;
    displayItems.push({ type: a.metadata!.type, content: a.metadata?.content, metadata: a.metadata });
  });

  const hasAssetsTab = showAssetsTab && onBrandAssetsChange;
  const galleryArtifact = displayItems.find(d => d.type === "campaign_gallery");
  const galleryAssets: ProductionAsset[] = galleryArtifact?.metadata?.production_assets || [];
  const hasCanvasTab = galleryAssets.length > 0;

  const [activeTab, setActiveTab] = useState<"assets" | "canvas" | number>(hasAssetsTab ? "assets" : 0);

  useEffect(() => {
    if (displayItems.length > 0 && activeTab !== "assets" && activeTab !== "canvas") {
      setActiveTab(displayItems.length - 1);
    }
  }, [displayItems.length]);

  const activeIndex = activeTab === "assets" || activeTab === "canvas" ? -1 : (activeTab as number);
  const active = activeIndex >= 0 ? displayItems[activeIndex] || null : null;

  const showEmpty = !hasAssetsTab && !active;

  if (showEmpty) {
    const stepInfo = emptyStateByStep[currentStep || ""] || emptyStateByStep.default;
    const Icon = stepInfo.icon;
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10"
          >
            <Icon className="h-9 w-9 text-primary" />
          </motion.div>
          <h3 className="text-lg font-semibold text-foreground">{stepInfo.title}</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{stepInfo.desc}</p>
          {/* Animated dots */}
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary/40"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const labels: Record<string, string> = {
    creative_brief: "Brief",
    dc_presentation: "Pistes DC",
    dc_copy_result: "Copy",
    ppm_presentation: "PPM",
    campaign_gallery: "Campagne",
    validation_required: "Validation",
    delivery: "Livraison",
  };

  const assetCount = brandAssets.length;

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            {activeTab === "assets" && onBrandAssetsChange && (
              <motion.div key="brand-assets" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="h-full">
                <BrandAssetsPanel assets={brandAssets} onAssetsChange={onBrandAssetsChange} highlightCategories={highlightAssetCategories} />
              </motion.div>
            )}
            {activeTab === "canvas" && hasCanvasTab && (
              <motion.div key="canvas" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="h-full">
                <CreativeCanvas assets={galleryAssets} onBack={() => { const idx = displayItems.findIndex(d => d.type === "campaign_gallery"); setActiveTab(idx >= 0 ? idx : 0); }} />
              </motion.div>
            )}
            {active?.type === "creative_brief" && active.content && (
              <motion.div key={`brief-${activeIndex}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                <CreativeBrief content={active.content} onContentChange={onBriefChange} readOnly={!onBriefChange} />
              </motion.div>
            )}
            {active?.type === "dc_presentation" && active.metadata && (
              <motion.div key={`dc-${activeIndex}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                <DCPresentation metadata={active.metadata} onSelectPiste={onSelectPiste} />
              </motion.div>
            )}
            {active?.type === "dc_copy_result" && active.metadata && (
              <motion.div key={`copy-${activeIndex}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                <DCCopyResult metadata={active.metadata} />
              </motion.div>
            )}
            {active?.type === "ppm_presentation" && active.metadata && (
              <motion.div key={`ppm-${activeIndex}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                <PPMPresentation metadata={active.metadata} />
              </motion.div>
            )}
            {active?.type === "campaign_gallery" && active.metadata && (
              <motion.div key={`gallery-${activeIndex}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                <CampaignGallery metadata={active.metadata} onOpenCanvas={() => setActiveTab("canvas")} />
              </motion.div>
            )}
            {active?.type === "validation_required" && active.metadata && onApprove && onReject && (
              <motion.div key={`validation-${activeIndex}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex h-full items-center justify-center p-8">
                <ValidationPanel gate={active.metadata.gate || ""} validationId={active.metadata.validation_id || ""} content={active.metadata.content || ""} onApprove={onApprove} onReject={onReject} />
              </motion.div>
            )}
            {active?.type === "delivery" && active.metadata && (
              <motion.div key={`delivery-${activeIndex}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                <DeliveryPanel
                  zipUrl={active.metadata.zip_url}
                  assets={active.metadata.production_assets || []}
                  campaignTitle={active.metadata.campaign_title}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </ErrorBoundary>
      </div>

      {(hasAssetsTab || displayItems.length > 1) && (
        <div className="flex justify-center border-t border-border bg-card/50 px-4 py-3 backdrop-blur-sm">
          <div className="flex gap-1.5 rounded-full border border-border bg-card px-2 py-1 overflow-x-auto scrollbar-thin max-w-full">
            {hasAssetsTab && (
              <button
                onClick={() => setActiveTab("assets")}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === "assets" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <FolderOpen className="h-3 w-3" />
                Assets
                {assetCount > 0 && <span className="ml-0.5 rounded-full bg-primary-foreground/20 px-1.5 text-[10px]">{assetCount}</span>}
              </button>
            )}
            {displayItems.map((item, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === i ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {labels[item.type] || item.type}
              </button>
            ))}
            {hasCanvasTab && (
              <button
                onClick={() => setActiveTab("canvas")}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === "canvas" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <PenTool className="h-3 w-3" />
                Canevas
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputPanel;
