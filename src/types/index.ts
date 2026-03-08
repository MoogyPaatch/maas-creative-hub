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

export interface MessageMetadata {
  type: string;
  content?: string;
  // DC Presentation
  slides_url?: string;
  pptx_url?: string;
  piste_thumbnail_urls?: string[];
  piste_titles?: string[];
  pistes?: DCPiste[];
  // DC Copy
  headlines?: Array<{ format: string; text: string; variant: string }>;
  body_copy?: Array<{ format: string; text: string; word_count: number }>;
  video_scripts?: Array<{ duration: string; script: string }>;
  audio_scripts?: Array<{ duration: string; script: string }>;
  // PPM
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
  // Validation
  gate?: string;
  validation_id?: string;
  // Campaign Gallery
  production_assets?: ProductionAsset[];
  campaign_title?: string;
  zip_url?: string;
  // Asset Request
  requested_asset_categories?: BrandAssetCategory[];
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

export const WORKFLOW_STEPS: { key: WorkflowStep; label: string }[] = [
  { key: "commercial", label: "Brief Client" },
  { key: "dc_visual", label: "Direction Créative" },
  { key: "ppm", label: "Pré-Production" },
  { key: "delivered", label: "Livraison" },
];
