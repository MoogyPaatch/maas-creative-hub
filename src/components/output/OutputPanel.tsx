import { useState, useEffect, useRef } from "react";
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
import LiveBriefPreview from "./LiveBriefPreview";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { ChatMessage, BrandAsset, BrandAssetCategory, ProductionAsset, BriefData, ClientBriefDraft } from "@/types";
import { Sparkles, FolderOpen, PenTool, FileText, Palette, Film, Rocket, Package } from "lucide-react";

interface Props {
  artifacts: ChatMessage[];
  briefData?: BriefData;
  messages?: ChatMessage[];
  clientBriefDraft?: ClientBriefDraft;
  changedBriefFields?: Set<string>;
  onClientBriefFieldChange?: (key: keyof ClientBriefDraft, value: string) => void;
  onValidateClientBrief?: () => void;
  onSelectPiste?: (pisteId: string) => void;
  onApprove?: (id: string, feedback: string | null) => void;
  onReject?: (id: string, feedback: string) => void;
  brandAssets?: BrandAsset[];
  onBrandAssetsChange?: (assets: BrandAsset[]) => void;
  highlightAssetCategories?: BrandAssetCategory[];
  showAssetsTab?: boolean;
  onBriefChange?: (content: string) => void;
  currentStep?: string;
  isClientView?: boolean;
  isStreaming?: boolean;
  isValidatingBrief?: boolean;
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
  planner: { icon: Sparkles, title: "Stratégie en cours…", desc: "Marcel analyse votre brief et prépare les pistes créatives." },
  dc_visual: { icon: Palette, title: "Direction artistique…", desc: "Les pistes visuelles sont en cours de génération." },
  dc_copy: { icon: PenTool, title: "Copy en création…", desc: "Marcel rédige les messages et accroches de votre campagne." },
  ppm: { icon: Film, title: "Pré-production…", desc: "Le plan de production se construit." },
  default: { icon: Rocket, title: "Espace créatif", desc: "Les livrables apparaîtront ici au fil de la conversation." },
};

const OutputPanel = ({
  artifacts, briefData, messages = [],
  clientBriefDraft, changedBriefFields, onClientBriefFieldChange, onValidateClientBrief,
  onSelectPiste, onApprove, onReject,
  brandAssets = [], onBrandAssetsChange, highlightAssetCategories,
  showAssetsTab = true, onBriefChange, currentStep, isClientView = false, isStreaming = false, isValidatingBrief = false,
}: Props) => {
  const agencyOnlyTypes = new Set(["creative_brief", "dc_copy_result"]);

  const typedArtifacts = artifacts.filter((a) => a.metadata?.type);
  
  const displayItems: { type: string; content?: string; metadata?: any }[] = [];
  
  if (briefData && !isClientView) {
    displayItems.push({ type: "creative_brief", content: briefToMarkdown(briefData) });
  }
  
  typedArtifacts.forEach((a) => {
    if (a.metadata?.type === "creative_brief" && briefData) return;
    if (isClientView && agencyOnlyTypes.has(a.metadata!.type)) return;
    displayItems.push({ type: a.metadata!.type, content: a.metadata?.content, metadata: a.metadata });
  });

  const hasAssetsTab = showAssetsTab && onBrandAssetsChange;
  const galleryArtifact = displayItems.find(d => d.type === "campaign_gallery");
  const galleryAssets: ProductionAsset[] = galleryArtifact?.metadata?.production_assets || [];
  const hasCanvasTab = galleryAssets.length > 0;

  // Show live brief when we have a draft or messages are flowing
  const showLiveBrief = !!clientBriefDraft || messages.length > 0;

  const [activeTab, setActiveTab] = useState<"assets" | "canvas" | "live-brief" | number>(
    showLiveBrief ? "live-brief" : hasAssetsTab ? "assets" : 0
  );

  useEffect(() => {
    if (showLiveBrief && activeTab !== "live-brief" && displayItems.length === 0) {
      setActiveTab("live-brief");
    }
  }, [showLiveBrief, messages.length]);

  const prevDisplayCount = useRef(displayItems.length);
  useEffect(() => {
    if (displayItems.length > prevDisplayCount.current) {
      setActiveTab(displayItems.length - 1);
    }
    prevDisplayCount.current = displayItems.length;
  }, [displayItems.length]);

  useEffect(() => {
    if (briefData && activeTab === "live-brief") {
      setActiveTab(0);
    }
  }, [briefData]);

  const activeIndex = activeTab === "assets" || activeTab === "canvas" || activeTab === "live-brief" ? -1 : (activeTab as number);
  const active = activeIndex >= 0 ? displayItems[activeIndex] || null : null;

  const showEmpty = !hasAssetsTab && !active && !showLiveBrief && activeTab !== "live-brief";

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
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center bg-secondary"
          >
            <Icon className="h-9 w-9 text-foreground" />
          </motion.div>
          <h3 className="text-lg font-bold text-foreground">{stepInfo.title}</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{stepInfo.desc}</p>
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 w-1.5 bg-foreground/30"
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
    creative_brief: "Brief Créa",
    client_brief: "Brief Client",
    dc_presentation: "Pistes DC",
    dc_copy_result: "Copy",
    ppm_presentation: "PPM",
    campaign_gallery: "Campagne",
    validation_required: "Validation",
    delivery: "Livraison",
  };

  const assetCount = brandAssets.length;
  const defaultDraft: ClientBriefDraft = {
    brand: null, product: null, objective: null, target: null, tone: null,
    formats: null, promise: null, reason_to_believe: null,
    creative_references: null, constraints: null, additional_context: null,
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            {activeTab === "live-brief" && showLiveBrief && (
              <motion.div key="live-brief" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                <LiveBriefPreview
                  briefDraft={clientBriefDraft || defaultDraft}
                  changedFields={changedBriefFields}
                  onFieldChange={onClientBriefFieldChange}
                  onValidate={onValidateClientBrief}
                  isStreaming={isStreaming}
                  isValidating={isValidatingBrief}
                />
              </motion.div>
            )}
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

      {(hasAssetsTab || displayItems.length > 1 || showLiveBrief) && (
        <div className="flex justify-center border-t border-border px-4 py-3">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin max-w-full">
            {showLiveBrief && (
              <button
                onClick={() => setActiveTab("live-brief")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === "live-brief" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-3 w-3" />
                Brief Client
              </button>
            )}
            {hasAssetsTab && (
              <button
                onClick={() => setActiveTab("assets")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === "assets" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FolderOpen className="h-3 w-3" />
                Assets
                {assetCount > 0 && <span className="ml-0.5 text-[10px]">({assetCount})</span>}
              </button>
            )}
            {displayItems.map((item, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === i ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {labels[item.type] || item.type}
              </button>
            ))}
            {hasCanvasTab && (
              <button
                onClick={() => setActiveTab("canvas")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === "canvas" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
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
