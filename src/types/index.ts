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

export interface MessageMetadata {
  type: string;
  content?: string;
  slides_url?: string;
  pptx_url?: string;
  piste_thumbnail_urls?: string[];
  piste_titles?: string[];
  pistes?: DCPiste[];
  headlines?: Array<{ format: string; text: string; variant: string }>;
  body_copy?: Array<{ format: string; text: string; word_count: number }>;
  video_scripts?: Array<{ duration: string; script: string }>;
  audio_scripts?: Array<{ duration: string; script: string }>;
  storyboard_count?: number;
  casting_count?: number;
  settings_count?: number;
  mockup_count?: number;
  summary?: string;
  storyboard?: Array<{ frame_number: number; description: string; duration: string; camera: string }>;
  casting?: Array<{ role: string; description: string }>;
  settings?: Array<{ name: string; description: string }>;
  production_notes?: { budget_range: string; timeline: string };
  mockups?: Array<{ format: string; description: string }>;
  gate?: string;
  validation_id?: string;
  production_assets?: ProductionAsset[];
  campaign_title?: string;
  zip_url?: string;
  requested_asset_categories?: BrandAssetCategory[];
}

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

export type BrandAssetCategory = "logo" | "product" | "guidelines" | "typography" | "graphics";

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

export interface DCPiste {
  id: string;
  title: string;
  headline: string;
  concept: string;
  tone: string;
  justification: string;
  thumbnail_url: string;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "agent" | "system";
  content: string;
  quickReplies?: QuickReply[];
  metadata?: MessageMetadata;
  timestamp?: Date;
}

export interface ConversationSummary {
  conversation_id: string;
  created_at: string;
  message_count: number;
  last_message_preview?: string;
  target_agent?: string;
}

export interface ConversationResponse {
  conversation_id: string;
  project_id: string;
  messages: ChatMessage[];
  brief_client_draft: unknown;
  artifacts: ChatMessage[];
}

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

// Full pipeline for agency view
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

// Simplified pipeline for client view (only validation milestones)
export const CLIENT_WORKFLOW_STEPS: { key: WorkflowStep; label: string; shortLabel: string }[] = [
  { key: "commercial", label: "Brief Client", shortLabel: "Brief" },
  { key: "dc_visual", label: "Direction Créative", shortLabel: "Création" },
  { key: "ppm", label: "Pré-Production", shortLabel: "PPM" },
  { key: "delivered", label: "Livraison", shortLabel: "Livré" },
];
