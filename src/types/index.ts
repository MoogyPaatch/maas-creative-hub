export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: string;
}

export interface Project {
  id: string;
  client_name: string | null;
  status: string;
  supervisor_phase: string | null;
  pending_validation: boolean;
  created_at: string;
  updated_at: string;
  latest_conversation_id: string;
}

export interface PipelineStep {
  step: string;
  status: "pending" | "in_progress" | "completed" | "validation_pending";
  started_at: string | null;
  completed_at: string | null;
}

export interface ProjectStatus {
  project_id: string;
  project_name: string;
  current_step: string;
  overall_progress: number;
  pipeline: PipelineStep[];
  pending_validations: Array<{ gate: string; status: string; feedback: string | null }>;
}

export interface QuickReply {
  id: string;
  label: string;
}

// ── Client Brief Draft (11 fields, SSE-driven) ──────────────────────────

export interface ClientBriefDraft {
  brand: string | null;
  product: string | null;
  objective: string | null;
  target: string | null;
  tone: string | null;
  formats: string | null;
  promise: string | null;
  reason_to_believe: string | null;
  creative_references: string | null;
  constraints: string | null;
  additional_context: string | null;
}

export const CLIENT_BRIEF_REQUIRED_FIELDS: (keyof ClientBriefDraft)[] = [
  "brand", "objective", "target", "tone", "formats",
];

export const CLIENT_BRIEF_QUASI_REQUIRED_FIELDS: (keyof ClientBriefDraft)[] = [
  "product",
];

export const CLIENT_BRIEF_ENRICHMENT_FIELDS: (keyof ClientBriefDraft)[] = [
  "promise", "reason_to_believe", "creative_references", "constraints", "additional_context",
];

export interface ClientBriefFieldDef {
  key: keyof ClientBriefDraft;
  label: string;
  placeholder: string;
  tier: "required" | "quasi" | "enrichment";
}

export const CLIENT_BRIEF_FIELD_DEFS: ClientBriefFieldDef[] = [
  { key: "brand", label: "Marque", placeholder: "Ex: Lidl, Nike, Renault...", tier: "required" },
  { key: "objective", label: "Objectif", placeholder: "Ex: Lancement produit, notoriété...", tier: "required" },
  { key: "target", label: "Cible", placeholder: "Ex: 25-35 ans, urbains, tech-savvy", tier: "required" },
  { key: "tone", label: "Tonalité", placeholder: "Ex: Premium, décalé, authentique...", tier: "required" },
  { key: "formats", label: "Formats & Médias", placeholder: "Ex: Social media, TV, print...", tier: "required" },
  { key: "product", label: "Produit / Service", placeholder: "Ex: Nouvelle gamme sneakers", tier: "quasi" },
  { key: "promise", label: "Promesse consommateur", placeholder: "Ex: Le confort sans compromis", tier: "enrichment" },
  { key: "reason_to_believe", label: "Raison de croire", placeholder: "Ex: Technologie brevetée, études cliniques...", tier: "enrichment" },
  { key: "creative_references", label: "Références créatives", placeholder: "Ex: J'aime la campagne Apple \"Think Different\"", tier: "enrichment" },
  { key: "constraints", label: "Contraintes", placeholder: "Ex: Mention légale obligatoire, pas de rouge...", tier: "enrichment" },
  { key: "additional_context", label: "Contexte additionnel", placeholder: "Tout ce qui est important et ne rentre pas dans les cases", tier: "enrichment" },
];

// ── Empty Brief Draft ─────────────────────────────────────────────────────

export const EMPTY_BRIEF_DRAFT: ClientBriefDraft = {
  brand: null,
  product: null,
  objective: null,
  target: null,
  tone: null,
  formats: null,
  promise: null,
  reason_to_believe: null,
  creative_references: null,
  constraints: null,
  additional_context: null,
};

// ── Legacy BriefData (kept for creative brief compatibility) ─────────────

export interface BriefData {
  brand: string;
  product: string;
  objective: string;
  budget: string;
  channels: string[];
  tone: string[];
  key_message: string;
  kpis: string[];
  timing: string;
  [key: string]: unknown;
}

// ── Message Metadata ─────────────────────────────────────────────────────

export interface ChatMessageMetadata {
  type: string;
  content?: string;
  slides_url?: string;
  pptx_url?: string;
  piste_thumbnail_urls?: string[];
  piste_titles?: string[];
  pistes?: DCPiste[];
  agency_recommendation?: AgencyRecommendation;
  brief_draft?: Partial<ClientBriefDraft>;
  headlines?: Array<{ format: string; text: string; variant: string }>;
  body_copy?: Array<{ format: string; text: string; word_count: number }>;
  video_scripts?: Array<{ duration: string; script: string }>;
  audio_scripts?: Array<{ duration: string; script: string }>;
  storyboard_count?: number;
  casting_count?: number;
  settings_count?: number;
  mockup_count?: number;
  summary?: string;
  storyboard?: Array<{ frame_number: number; description: string; duration: string; camera: string; composed_image_url?: string; [key: string]: any }>;
  casting?: Array<{ role: string; description: string; image_url?: string; name?: string; wardrobe?: string; attitude?: string; physical_description?: string; [key: string]: any }>;
  settings?: Array<{ name: string; description: string; image_url?: string; ambiance?: string; lighting?: string; time_of_day?: string; [key: string]: any }>;
  production_notes?: { budget_range: string; timeline: string };
  mockups?: Array<{ format: string; description: string }>;
  // PPM format specs
  detected_formats?: string[];
  video_specs?: Record<string, any>;
  print_specs?: Record<string, any>;
  social_specs?: Record<string, any>;
  audio_specs?: Record<string, any>;
  digital_specs?: Record<string, any>;
  pptx_urls?: Record<string, string>;
  slides_urls?: Record<string, string>;
  // Visual entity library (PPM restructuration)
  characters?: Array<{ name: string; role: string; description: string; wardrobe?: string; attitude?: string; image_url?: string; [key: string]: any }>;
  products?: Array<{ name: string; description: string; context?: string; image_url?: string; [key: string]: any }>;
  locations?: Array<{ name: string; description: string; ambiance?: string; lighting?: string; time_of_day?: string; image_url?: string; [key: string]: any }>;
  composed_scenes?: Array<{ sequence_index: number; composed_image_url?: string; description?: string; [key: string]: any }>;
  gate?: string;
  validation_id?: string;
  // masters_review fields
  channels?: Record<string, {
    asset_ids: string[];
    urls?: string[];
    assembled_url?: string;
    url?: string;
    duration?: number;
    description: string;
  }>;
  production_assets?: ProductionAsset[];
  media_types?: string[];
  asset_count?: number;
  campaign_title?: string;
  zip_url?: string;
  requested_asset_categories?: BrandAssetCategory[];
  // status_update fields
  status?: string;
  phase_label?: string;
  // action_required fields
  action?: "validate_brief" | "select_piste" | "confirm" | "show_upload_ui";
  options?: string[];
  validation_data?: any;
  show_upload_ui?: boolean;
}

// Legacy alias for compatibility
export interface MessageMetadata extends ChatMessageMetadata {}

// ── DC Piste (enriched) ──────────────────────────────────────────────────

export interface DCPiste {
  id: string;
  title: string;
  headline: string;
  concept: string;
  tone: string;
  justification: string;
  thumbnail_url: string;
  risk_level?: "safe" | "bold" | "provocateur";
  agency_conviction?: string;
  differentiation?: string;
  format_executions?: {
    social?: string;
    print?: string;
    digital?: string;
  };
  video_concept?: {
    concept_summary: string;
    tone_video: string;
    music_direction: string;
    duration_target: string;
    sequences: Array<{
      sequence: number;
      timing: string;
      visual: string;
      text_on_screen?: string;
      voiceover?: string;
      sound?: string;
      transition?: string;
    }>;
  };
}

export interface AgencyRecommendation {
  recommended_piste: number;
  recommendation_title?: string;
  why?: string;
  what_if_not?: string;
}

// ── Canvas / Assets / Production ─────────────────────────────────────────

export interface CanvasElement {
  id: string;
  type: "image" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  src?: string;
  text?: string;
  fontSize?: number;
  color?: string;
}

export type BrandAssetCategory = "logo" | "font" | "guideline" | "reference" | "product" | "packaging" | "character" | "talent" | "location" | "venue" | "decor" | "other";

export interface BrandAsset {
  id: string;
  category: BrandAssetCategory;
  file_name: string;
  file_size: string;
  file_type: string;
  preview_url: string;
  uploaded_at: string;
}

export interface ProductionAsset {
  id: string;
  type: "image" | "video" | "audio" | "document";
  title: string;
  format: string;
  url: string;
  thumbnail_url?: string;
  duration?: string;
  file_size?: string;
}

// ── Chat ─────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id?: string;
  role: "user" | "agent" | "system";
  content: string;
  quickReplies?: QuickReply[];
  metadata?: ChatMessageMetadata;
  timestamp?: Date;
}

export interface ConversationSummary {
  conversation_id: string;
  project_id?: string;
  agency_mode?: boolean;
  target_agent?: string | null;
  total_messages: number;
  last_message_preview?: string | null;
  last_message_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ConversationResponse {
  conversation_id: string;
  project_id: string;
  messages: ChatMessage[];
  brief_client_draft: unknown;
  artifacts: ChatMessage[];
}

// ── Workflow ─────────────────────────────────────────────────────────────

export type WorkflowStep =
  | "commercial"
  | "planner"
  | "dc_visual"
  | "dc_copy"
  | "ppm"
  | "prod_image"
  | "prod_video"
  | "prod_audio"
  | "delivered";

export const WORKFLOW_STEPS: { key: WorkflowStep; label: string; shortLabel: string }[] = [
  { key: "commercial", label: "Brief Client", shortLabel: "Brief" },
  { key: "planner", label: "Stratégie Créative", shortLabel: "Stratégie" },
  { key: "dc_visual", label: "Direction Visuelle", shortLabel: "DC Visuel" },
  { key: "dc_copy", label: "Direction Copy", shortLabel: "DC Copy" },
  { key: "ppm", label: "Pré-Production", shortLabel: "PPM" },
  { key: "prod_image", label: "Production Image", shortLabel: "Image" },
  { key: "prod_video", label: "Production Vidéo", shortLabel: "Vidéo" },
  { key: "prod_audio", label: "Production Audio", shortLabel: "Audio" },
  { key: "delivered", label: "Livraison", shortLabel: "Livré" },
];

export const CLIENT_WORKFLOW_STEPS: { key: WorkflowStep; label: string; shortLabel: string }[] = [
  { key: "commercial", label: "Brief Client", shortLabel: "Brief" },
  { key: "dc_visual", label: "Direction Créative", shortLabel: "Création" },
  { key: "ppm", label: "Pré-Production", shortLabel: "PPM" },
  { key: "delivered", label: "Livraison", shortLabel: "Livré" },
];

// ── Client Phases (mapping interne → 4 étapes client) ───────────────────

export interface ClientPhase {
  key: string;
  label: string;
  shortLabel: string;
  internalSteps: string[];
}

export const CLIENT_PHASES: ClientPhase[] = [
  { key: "brief", label: "Brief Client", shortLabel: "Brief", internalSteps: ["commercial"] },
  { key: "dc", label: "Direction Créative", shortLabel: "Création", internalSteps: ["planner", "dc_visual", "dc_copy"] },
  { key: "ppm", label: "Pré-Production", shortLabel: "PPM", internalSteps: ["ppm"] },
  { key: "delivery", label: "Livraison", shortLabel: "Livraison", internalSteps: ["prod_image", "prod_video", "prod_audio", "delivered", "finished"] },
];

export function getClientPhaseIndex(phase: string | null): number {
  if (!phase) return 0;
  const idx = CLIENT_PHASES.findIndex((cp) => cp.internalSteps.includes(phase));
  return idx >= 0 ? idx : 0;
}

export function getClientPhaseLabel(phase: string | null): string {
  if (!phase) return "Nouveau";
  const idx = getClientPhaseIndex(phase);
  return CLIENT_PHASES[idx].label;
}
