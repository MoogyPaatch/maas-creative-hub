import { useState, useEffect, useRef } from "react";
// AnimatePresence removed — instant tab switching is more reliable than animated transitions
import CreativeBrief from "./CreativeBrief";
import DCPresentation from "./DCPresentation";
import DCCopyResult from "./DCCopyResult";
import PPMPresentation from "./PPMPresentation";
import CampaignGallery from "./CampaignGallery";
import CreativeCanvas from "./CreativeCanvas";
import DeclinaisonConfigurator from "./DeclinaisonConfigurator";
import MastersReview from "./MastersReview";
import ValidationPanel from "./ValidationPanel";
import BrandAssetsPanel from "./BrandAssetsPanel";
import DeliveryPanel from "./DeliveryPanel";

import LiveBriefPreview from "./LiveBriefPreview";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { ChatMessage, BrandAsset, BrandAssetCategory, ProductionAsset, BriefData, ClientBriefDraft } from "@/types";
import { Sparkles, FolderOpen, PenTool, FileText, Palette, Film, Rocket, Package, Image as ImageIcon, Settings2 } from "lucide-react";

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
  onPPMApprove?: (action: "approve" | "revision", feedback?: string) => Promise<void>;
  onLaunchDeclinaisons?: (config: Record<string, Record<string, boolean>>) => void;
  onSkipDeclinaisons?: () => void;
  brandAssets?: BrandAsset[];
  onBrandAssetsChange?: (assets: BrandAsset[]) => void;
  highlightAssetCategories?: BrandAssetCategory[];
  showAssetsTab?: boolean;
  onBriefChange?: (content: string) => void;
  currentStep?: string;
  isClientView?: boolean;
  isStreaming?: boolean;
  isValidatingBrief?: boolean;
  projectId?: string;
  forceAssetsSignal?: number;
  onAssetUploadComplete?: (filename: string) => void;
  onAssetRequirementsContinue?: () => void;
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
  commercial: { icon: FileText, title: "Brief en cours…", desc: "Répondez aux questions de Marcel pour construire votre brief." },
  planner: { icon: Sparkles, title: "Stratégie en cours…", desc: "Marcel analyse votre brief et prépare les pistes créatives." },
  dc_visual: { icon: Palette, title: "Direction artistique…", desc: "Les pistes visuelles sont en cours de génération." },
  dc_copy: { icon: PenTool, title: "Copy en création…", desc: "Marcel rédige les messages et accroches de votre campagne." },
  ppm: { icon: Film, title: "Pré-production…", desc: "Le plan de production se construit." },
  default: { icon: Rocket, title: "Espace créatif", desc: "Les livrables apparaîtront ici au fil de la conversation." },
};

const OutputPanel = ({
  artifacts, briefData, messages = [],
  clientBriefDraft, changedBriefFields, onClientBriefFieldChange, onValidateClientBrief,
  onSelectPiste, onApprove, onReject, onPPMApprove, onLaunchDeclinaisons, onSkipDeclinaisons,
  brandAssets = [], onBrandAssetsChange, highlightAssetCategories,
  showAssetsTab = true, onBriefChange, currentStep, isClientView = false, isStreaming = false, isValidatingBrief = false,
  projectId, forceAssetsSignal, onAssetUploadComplete, onAssetRequirementsContinue,
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
    if (a.metadata?.type === "validation_required") return; // Validation handled in chat, never show tab
    if (a.metadata?.type === "asset_requirements") return; // Don't create separate tab — handled in BrandAssetsPanel
    displayItems.push({ type: a.metadata!.type, content: a.metadata?.content, metadata: a.metadata });
  });

  // Canonical tab ordering — guarantees stable position regardless of SSE arrival order
  const TAB_ORDER = [
    "creative_brief", "dc_presentation", "dc_copy_result", "ppm_presentation",
    "masters_review", "declinaison_configurator", "campaign_gallery",
  ];
  displayItems.sort((a, b) => {
    const ai = TAB_ORDER.indexOf(a.type);
    const bi = TAB_ORDER.indexOf(b.type);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const hasAssetsTab = showAssetsTab && onBrandAssetsChange;
  const galleryArtifact = displayItems.find(d => d.type === "campaign_gallery");
  // Normalize backend asset fields (name→title, file_url→url) to frontend ProductionAsset format
  const galleryAssets: ProductionAsset[] = (galleryArtifact?.metadata?.production_assets || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any) => ({
      id: a.id || `asset-${Math.random()}`,
      type: a.type || a.asset_type || "image",
      title: a.title || a.name || "Asset",
      format: a.format || "",
      url: a.url || a.file_url || "",
      thumbnail_url: a.thumbnail_url,
      duration: a.duration || (a.duration_seconds ? `${Math.round(a.duration_seconds)}s` : undefined),
      file_size: a.file_size,
    })
  );
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

  useEffect(() => {
    if (forceAssetsSignal && forceAssetsSignal > 0 && hasAssetsTab) {
      setActiveTab("assets");
    }
  }, [forceAssetsSignal]);

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

  const labels: Record<string, { label: string; icon?: React.ElementType }> = {
    creative_brief: { label: "Brief Créa", icon: FileText },
    client_brief: { label: "Brief Client", icon: FileText },
    dc_presentation: { label: "Pistes DC", icon: Sparkles },
    dc_copy_result: { label: "Copy", icon: PenTool },
    ppm_presentation: { label: "PPM", icon: Film },
    campaign_gallery: { label: "Détails", icon: ImageIcon },
    masters_review: { label: "Masters", icon: Package },
    declinaison_configurator: { label: "Declinaisons", icon: Settings2 },

    validation_required: { label: "Validation" },
    delivery: { label: "Livraison", icon: Package },
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
          <div className="h-full">
            {activeTab === "live-brief" && showLiveBrief && (
              <LiveBriefPreview
                briefDraft={clientBriefDraft || defaultDraft}
                changedFields={changedBriefFields}
                onFieldChange={onClientBriefFieldChange}
                onValidate={onValidateClientBrief}
                isStreaming={isStreaming}
                isValidating={isValidatingBrief}
              />
            )}
            {activeTab === "assets" && onBrandAssetsChange && projectId && (
              <BrandAssetsPanel assets={brandAssets} onAssetsChange={onBrandAssetsChange} highlightCategories={highlightAssetCategories} projectId={projectId} onUploadComplete={onAssetUploadComplete} onContinueProduction={onAssetRequirementsContinue} />
            )}
            {activeTab === "canvas" && hasCanvasTab && (
              <CreativeCanvas assets={galleryAssets} onBack={() => { const idx = displayItems.findIndex(d => d.type === "campaign_gallery"); setActiveTab(idx >= 0 ? idx : 0); }} />
            )}
            {active?.type === "creative_brief" && active.content && (
              <CreativeBrief content={active.content} onContentChange={onBriefChange} readOnly={!onBriefChange} />
            )}
            {active?.type === "dc_presentation" && active.metadata && (
              <DCPresentation metadata={active.metadata} onSelectPiste={onSelectPiste} />
            )}
            {active?.type === "dc_copy_result" && active.metadata && (
              <DCCopyResult metadata={active.metadata} />
            )}
            {active?.type === "ppm_presentation" && active.metadata && (
              <PPMPresentation metadata={active.metadata} projectId={projectId} currentStep={currentStep} onPPMApprove={onPPMApprove} />
            )}
            {active?.type === "campaign_gallery" && active.metadata && (
              <CampaignGallery metadata={active.metadata} onOpenCanvas={() => setActiveTab("canvas")} />
            )}
            {active?.type === "masters_review" && active.metadata && onApprove && onReject && (
              <MastersReview metadata={active.metadata} onApprove={onApprove} onReject={onReject} />
            )}
            {active?.type === "declinaison_configurator" && active.metadata && onLaunchDeclinaisons && onSkipDeclinaisons && (
              <DeclinaisonConfigurator metadata={active.metadata} onLaunch={onLaunchDeclinaisons} onSkip={onSkipDeclinaisons} />
            )}
            {active?.type === "validation_required" && active.metadata && onApprove && onReject && (
              <div className="flex h-full items-center justify-center p-8">
                <ValidationPanel gate={active.metadata.gate || ""} validationId={active.metadata.validation_id || ""} content={active.metadata.content || ""} onApprove={onApprove} onReject={onReject} />
              </div>
            )}
            {active?.type === "delivery" && active.metadata && (
              <DeliveryPanel
                zipUrl={active.metadata.zip_url}
                assets={active.metadata.production_assets || []}
                campaignTitle={active.metadata.campaign_title}
              />
            )}
          </div>
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
            {displayItems.map((item, i) => {
              const info = labels[item.type];
              const TabIcon = info?.icon;
              return (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeTab === i ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {TabIcon && <TabIcon className="h-3 w-3" />}
                  {info?.label || item.type}
                </button>
              );
            })}
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
