import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import CreativeBrief from "./CreativeBrief";
import DCPresentation from "./DCPresentation";
import DCCopyResult from "./DCCopyResult";
import PPMPresentation from "./PPMPresentation";
import CampaignGallery from "./CampaignGallery";
import CreativeCanvas from "./CreativeCanvas";
import ValidationPanel from "./ValidationPanel";
import BrandAssetsPanel from "./BrandAssetsPanel";
import type { ChatMessage, BrandAsset, BrandAssetCategory, ProductionAsset } from "@/types";
import { motion } from "framer-motion";
import { Sparkles, FolderOpen, PenTool } from "lucide-react";

interface Props {
  artifacts: ChatMessage[];
  briefData?: any;
  onSelectPiste?: (pisteId: string) => void;
  onApprove?: (id: string, feedback: string | null) => void;
  onReject?: (id: string, feedback: string) => void;
  brandAssets?: BrandAsset[];
  onBrandAssetsChange?: (assets: BrandAsset[]) => void;
  highlightAssetCategories?: BrandAssetCategory[];
  showAssetsTab?: boolean;
}

function briefToMarkdown(brief: any): string {
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

const OutputPanel = ({ artifacts, briefData, onSelectPiste, onApprove, onReject, brandAssets = [], onBrandAssetsChange, highlightAssetCategories, showAssetsTab = true }: Props) => {
  const typedArtifacts = artifacts.filter((a) => a.metadata?.type);
  
  const displayItems: { type: string; content?: string; metadata?: any }[] = [];
  
  if (briefData) {
    displayItems.push({ type: "creative_brief", content: briefToMarkdown(briefData) });
  }
  
  typedArtifacts.forEach((a) => {
    if (a.metadata?.type === "creative_brief" && briefData) return;
    displayItems.push({ type: a.metadata!.type, content: a.metadata?.content, metadata: a.metadata });
  });

  // "brand_assets" is a permanent virtual tab, always first when enabled
  const hasAssetsTab = showAssetsTab && onBrandAssetsChange;
  
  // Check if campaign_gallery exists to show canvas tab
  const galleryArtifact = displayItems.find(d => d.type === "campaign_gallery");
  const galleryAssets: ProductionAsset[] = galleryArtifact?.metadata?.production_assets || [];
  const hasCanvasTab = galleryAssets.length > 0;

  const [activeTab, setActiveTab] = useState<"assets" | "canvas" | number>(hasAssetsTab ? "assets" : 0);
  const [canvasActive, setCanvasActive] = useState(false);

  useEffect(() => {
    if (displayItems.length > 0 && activeTab !== "assets" && activeTab !== "canvas") {
      setActiveTab(displayItems.length - 1);
    }
  }, [displayItems.length]);

  // Auto-switch to latest artifact when new ones arrive, but keep assets/canvas if user chose it
  const activeIndex = activeTab === "assets" || activeTab === "canvas" ? -1 : (activeTab as number);
  const active = activeIndex >= 0 ? displayItems[activeIndex] || null : null;

  const showEmpty = !hasAssetsTab && !active;

  if (showEmpty) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Sparkles className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Espace créatif</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Les livrables créatifs apparaîtront ici au fil de la conversation — brief stratégique, pistes visuelles, PPM et assets finaux.
          </p>
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
  };

  const assetCount = brandAssets.length;

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "assets" && onBrandAssetsChange && (
            <motion.div
              key="brand-assets"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="h-full"
            >
              <BrandAssetsPanel
                assets={brandAssets}
                onAssetsChange={onBrandAssetsChange}
                highlightCategories={highlightAssetCategories}
              />
            </motion.div>
          )}
          {active?.type === "creative_brief" && active.content && (
            <CreativeBrief key={`brief-${activeIndex}`} content={active.content} onContentChange={(newContent) => {
              active.content = newContent;
            }} />
          )}
          {active?.type === "dc_presentation" && active.metadata && (
            <DCPresentation key={`dc-${activeIndex}`} metadata={active.metadata} onSelectPiste={onSelectPiste} />
          )}
          {active?.type === "dc_copy_result" && active.metadata && (
            <DCCopyResult key={`copy-${activeIndex}`} metadata={active.metadata} />
          )}
          {active?.type === "ppm_presentation" && active.metadata && (
            <PPMPresentation key={`ppm-${activeIndex}`} metadata={active.metadata} />
          )}
          {active?.type === "campaign_gallery" && active.metadata && (
            <CampaignGallery key={`gallery-${activeIndex}`} metadata={active.metadata} />
          )}
          {active?.type === "validation_required" && active.metadata && onApprove && onReject && (
            <div key={`validation-${activeIndex}`} className="flex h-full items-center justify-center p-8">
              <ValidationPanel
                gate={active.metadata.gate || ""}
                validationId={active.metadata.validation_id || ""}
                content={active.metadata.content || ""}
                onApprove={onApprove}
                onReject={onReject}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom tab bar — always visible when there's content */}
      {(hasAssetsTab || displayItems.length > 1) && (
        <div className="flex justify-center border-t border-border bg-card/50 px-4 py-3 backdrop-blur-sm">
          <div className="flex gap-1.5 rounded-full border border-border bg-card px-2 py-1">
            {/* Permanent assets tab */}
            {hasAssetsTab && (
              <button
                onClick={() => setActiveTab("assets")}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  activeTab === "assets"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <FolderOpen className="h-3 w-3" />
                Assets
                {assetCount > 0 && (
                  <span className="ml-0.5 rounded-full bg-primary-foreground/20 px-1.5 text-[10px]">
                    {assetCount}
                  </span>
                )}
              </button>
            )}
            {displayItems.map((item, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  activeTab === i
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {labels[item.type] || item.type}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputPanel;
