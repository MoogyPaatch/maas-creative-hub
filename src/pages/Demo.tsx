import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ChatPanel from "@/components/chat/ChatPanel";
import OutputPanel from "@/components/output/OutputPanel";
import WorkflowStepper from "@/components/layout/WorkflowStepper";
import type { ChatMessage, PipelineStep, WorkflowStep, MessageMetadata, DCPiste } from "@/types";
import { ArrowLeft, Eye } from "lucide-react";

/* ═══════════════════════════════════════════════
   MOCK DATA — Full conversation simulation
   ═══════════════════════════════════════════════ */

// Which workflow step each message belongs to (for filtering)
interface DemoMessage extends ChatMessage {
  phase: WorkflowStep;
}

const mockPistes: DCPiste[] = [
  {
    id: "piste-1",
    title: "L'Éclat Urbain",
    headline: "La ville est votre terrain de jeu",
    concept: "Une campagne qui capture l'énergie brute de la ville, mêlant street art et haute couture dans des lieux emblématiques parisiens.",
    tone: "Palette néon sur fond sombre, typographie graffiti modernisée, prises de vue en contre-plongée.",
    justification: "Cible 18-35 ans urbaine. Engagement +47% sur ce type de contenu.",
    thumbnail_url: "",
  },
  {
    id: "piste-2",
    title: "Souffle Naturel",
    headline: "Respirez l'authenticité",
    concept: "Immersion dans la nature sauvage française — Fontainebleau, Étretat, Provence. Luxe responsable et durable.",
    tone: "Verts profonds, ocres dorés, bleus lavande. Lumière naturelle, format cinéma 2.39:1.",
    justification: "Tendance éco-luxe et valeurs RSE. Différenciation sur un marché saturé.",
    thumbnail_url: "",
  },
  {
    id: "piste-3",
    title: "Héritage Futur",
    headline: "Le passé éclaire demain",
    concept: "Fusion artisanat traditionnel et technologie de pointe. Gestes ancestraux sublimés par des effets holographiques.",
    tone: "Rétro-futuriste : dorés, chromes, bois et métal brossé. Motion design fluide.",
    justification: "Storytelling de marque, cible CSP+ 35-55 ans. Twist technologique rafraîchissant.",
    thumbnail_url: "",
  },
];

const briefContent = `## Marque
Maison Lumière

## Produit
Parfum « Éclat Urbain » — Eau de Parfum 75ml

## Objectif
Lancer le nouveau parfum avec une campagne digitale multi-canal visant à générer 50 000 ventes en 3 mois

## Budget
150 000 €

## Canaux
- Instagram (Stories + Reels)
- YouTube (Pre-roll 15s + Spot 30s)
- Display programmatique
- OOH digital (Paris, Lyon, Marseille)

## Ton
Audacieux, contemporain, premium

## Message clé
> Un parfum qui capture l'énergie de la ville et la transforme en élégance

## KPIs
- 50 000 unités vendues en 3 mois
- ROAS ≥ 4.5x
- Brand lift +15 points
- 2M impressions qualifiées

## Timing
Lancement campagne : 15 avril 2026`;

const DEMO_MESSAGES: DemoMessage[] = [
  // ─── BRIEF (commercial) ───
  {
    phase: "commercial",
    role: "agent",
    content: "Bonjour ! 👋 Je suis Marcel, votre directeur de création IA. Je vais vous accompagner dans la création de votre campagne publicitaire.\n\nPour commencer, parlez-moi de votre marque et du produit que vous souhaitez promouvoir.",
    quickReplies: [
      { id: "qr-parfum", label: "Lancement d'un parfum" },
      { id: "qr-mode", label: "Collection de mode" },
      { id: "qr-autre", label: "Autre produit" },
    ],
  },
  {
    phase: "commercial",
    role: "user",
    content: "On lance un nouveau parfum pour Maison Lumière. C'est un Eau de Parfum qui s'appelle « Éclat Urbain », 75ml. On veut une campagne digitale multi-canal.",
  },
  {
    phase: "commercial",
    role: "agent",
    content: "Excellent choix ! « Éclat Urbain » — j'adore déjà le nom, il porte une promesse forte. Quelques questions pour affiner le brief :\n\n1. **Quel est votre budget** pour cette campagne ?\n2. **Quels canaux** privilégiez-vous ? (Instagram, YouTube, Display, OOH…)\n3. **Quelle est votre cible principale** ?",
    quickReplies: [
      { id: "qr-budget-100", label: "~100K€" },
      { id: "qr-budget-150", label: "~150K€" },
      { id: "qr-budget-200", label: "~200K€" },
    ],
  },
  {
    phase: "commercial",
    role: "user",
    content: "Budget de 150K€. On veut être sur Instagram (Stories + Reels), YouTube (pre-roll 15s et spot 30s), du display programmatique, et de l'OOH digital à Paris, Lyon et Marseille. Cible : urbains 25-40 ans, CSP+.",
  },
  {
    phase: "commercial",
    role: "agent",
    content: "Parfait, j'ai tout ce qu'il me faut. Voici le récapitulatif du brief que j'ai constitué :\n\n✅ **Marque** : Maison Lumière\n✅ **Produit** : Éclat Urbain — EDP 75ml\n✅ **Budget** : 150 000 €\n✅ **Canaux** : Instagram, YouTube, Display, OOH\n✅ **Cible** : Urbains 25-40, CSP+\n✅ **Objectif** : 50K ventes en 3 mois\n\nLe brief complet apparaît dans le panneau de droite. Souhaitez-vous le valider pour passer à la phase stratégique ?",
    quickReplies: [
      { id: "qr-validate-brief", label: "✅ Valider le brief" },
      { id: "qr-modify-brief", label: "Modifier quelque chose" },
    ],
    metadata: { type: "creative_brief", content: briefContent },
  },
  {
    phase: "commercial",
    role: "user",
    content: "✅ Valider le brief",
  },

  // ─── STRATÉGIE (planner) ───
  {
    phase: "planner",
    role: "agent",
    content: "Brief validé ! 🎯 Je passe maintenant à l'analyse stratégique.\n\nAprès analyse du marché de la parfumerie premium et de votre cible, voici mes recommandations :\n\n**Insight consommateur** : Les urbains CSP+ cherchent des produits qui reflètent leur identité — pas juste un parfum, mais un statement personnel.\n\n**Territoire de marque** : Éclat Urbain se positionne à l'intersection du luxe accessible et de l'énergie urbaine.\n\n**Recommandation média** :\n- 40% Instagram (awareness + engagement)\n- 25% YouTube (considération)\n- 20% Display (retargeting)\n- 15% OOH (notoriété locale)\n\nJe lance maintenant la direction créative avec 3 pistes distinctes.",
  },

  // ─── DIRECTION CRÉATIVE (dc_visual) ───
  {
    phase: "dc_visual",
    role: "agent",
    content: "Voici **3 pistes créatives** pour « Éclat Urbain » ! 🎨\n\nChaque piste propose un univers visuel distinct avec sa propre direction artistique. Explorez-les dans le panneau de droite et choisissez celle qui vous parle le plus.",
    metadata: {
      type: "dc_presentation",
      pistes: mockPistes,
      piste_titles: mockPistes.map((p) => p.title),
      slides_url: "#",
      pptx_url: "#",
    },
  },
  {
    phase: "dc_visual",
    role: "user",
    content: "J'adore la piste 1, L'Éclat Urbain ! Le contraste street art / haute couture est exactement ce qu'on cherche. On part là-dessus.",
  },
  {
    phase: "dc_visual",
    role: "agent",
    content: "Excellent choix ! 🔥 « L'Éclat Urbain » est la piste la plus audacieuse — elle va vraiment marquer les esprits.\n\nJe lance la rédaction du copy sur cette direction. Les textes seront déclinés pour chaque format média.",
  },

  // ─── COPYWRITING (dc_copy) ───
  {
    phase: "dc_copy",
    role: "agent",
    content: "Voici les **déclinaisons copy** pour la piste « L'Éclat Urbain » ! ✍️\n\nJ'ai rédigé les headlines, body copy, et scripts vidéo/audio adaptés à chaque canal. Tout est consultable dans le panneau de droite.",
    metadata: {
      type: "dc_copy_result",
      headlines: [
        { format: "Instagram Story", text: "L'élégance ne connaît pas de trottoir.", variant: "A" },
        { format: "YouTube Pre-roll", text: "Quand la ville devient votre signature.", variant: "A" },
        { format: "Display Banner", text: "Éclat Urbain. Votre ville. Votre parfum.", variant: "A" },
        { format: "OOH Abribus", text: "Le béton a trouvé son élégance.", variant: "A" },
      ],
      body_copy: [
        { format: "Instagram Caption", text: "Entre les murs de la ville, une nouvelle définition de l'élégance s'écrit. Éclat Urbain capture cette énergie brute et la transforme en raffinement. Un parfum pour ceux qui font de chaque rue un podium.", word_count: 38 },
        { format: "YouTube Description", text: "Maison Lumière présente Éclat Urbain, un Eau de Parfum qui fusionne l'énergie de la ville avec l'élégance intemporelle. Notes de tête : bergamote, poivre noir. Cœur : iris, béton mouillé. Fond : musc blanc, bois de cèdre.", word_count: 42 },
      ],
      video_scripts: [
        { duration: "30s", script: "OUVERTURE : Toits de Paris, aube. Une silhouette sur un balcon. VOIX OFF : « La ville ne dort jamais. Elle pulse, elle vibre, elle inspire. » La protagoniste marche dans le Marais, entre lumière et ombre. VOIX OFF : « Éclat Urbain. Le parfum de ceux qui font de chaque instant un moment. » PACKSHOT sur fond noir." },
        { duration: "15s", script: "MONTAGE RAPIDE : textures urbaines, flacon en gros plan, silhouette en mouvement. VOIX OFF : « Éclat Urbain. Votre ville. Votre signature. » LOGO Maison Lumière." },
      ],
      audio_scripts: [
        { duration: "30s", script: "MUSIQUE : Beat électronique minimaliste, nappes de synthé warm. VOIX OFF (femme, 30 ans, ton confiant) : « Il y a dans cette ville une énergie qu'on ne trouve nulle part ailleurs. Une vibration qui transforme le quotidien en extraordinaire. Éclat Urbain, par Maison Lumière. Le parfum de votre énergie. »" },
      ],
    },
  },
  {
    phase: "dc_copy",
    role: "user",
    content: "Super ! Les headlines sont percutantes. J'aime beaucoup « L'élégance ne connaît pas de trottoir ». On valide le copy.",
  },

  // ─── PRÉ-PRODUCTION (ppm) ───
  {
    phase: "ppm",
    role: "agent",
    content: "Copy validé ! 🎬 Passons à la pré-production.\n\nJ'ai préparé le dossier PPM complet : storyboard, casting, décors et mockups pour chaque format. Tout est dans le panneau de droite.",
    metadata: {
      type: "ppm_presentation",
      summary: "Campagne « Éclat Urbain » — Production multi-canal. Tournage Paris, 3 jours. Post-production 2 semaines.",
      slides_url: "#",
      pptx_url: "#",
      storyboard_count: 6,
      casting_count: 3,
      settings_count: 3,
      mockup_count: 4,
      storyboard: [
        { frame_number: 1, description: "Ouverture aérienne sur les toits de Paris au lever du soleil. Travelling vers une silhouette sur un balcon.", duration: "3s", camera: "Drone DJI Inspire 3" },
        { frame_number: 2, description: "Plan moyen : la protagoniste se retourne, flacon en main. Lumière dorée naturelle.", duration: "2s", camera: "Steadicam" },
        { frame_number: 3, description: "Gros plan sur le flacon posé sur la rambarde, reflets de la ville dans le verre.", duration: "2s", camera: "Macro 100mm" },
        { frame_number: 4, description: "La protagoniste marche dans une ruelle pavée du Marais. Travelling latéral.", duration: "4s", camera: "Gimbal" },
        { frame_number: 5, description: "Vaporisation du parfum, particules dorées en slow motion.", duration: "3s", camera: "Phantom Flex 4K" },
        { frame_number: 6, description: "Packshot final : flacon centré sur fond noir, logo en fondu.", duration: "3s", camera: "Plan fixe studio" },
      ],
      casting: [
        { role: "Protagoniste", description: "Femme 25-30 ans, allure parisienne chic. Présence naturelle face caméra." },
        { role: "Figurant galerie", description: "Homme 35-40 ans, look artiste contemporain." },
        { role: "Mains artisan", description: "Mains expressives, gestes précis pour plans serrés." },
      ],
      settings: [
        { name: "Terrasse Montmartre", description: "Appartement haussmannien, balcon vue toits. Lumière matinale est." },
        { name: "Ruelle du Marais", description: "Pavés, façades colorées. Tournage tôt le matin." },
        { name: "Studio packshot", description: "Cyclo noir mat, éclairage volumétrique. Setup macro dédié." },
      ],
      production_notes: {
        budget_range: "120 000 € – 150 000 €",
        timeline: "Pré-prod : 1 sem · Tournage : 3 jours · Post-prod : 2 sem · Livraison : J+28",
      },
      mockups: [
        { format: "Story Instagram (9:16)", description: "Flacon avec particules dorées. CTA « Découvrir »." },
        { format: "Post carré (1:1)", description: "Protagoniste sur balcon. Headline en overlay glassmorphism." },
        { format: "Banner YouTube (16:9)", description: "Plan galerie d'art. Bandes noires cinéma." },
        { format: "OOH Abribus (4:3)", description: "Protagoniste de dos face aux toits. Flacon en surimpression." },
      ],
    },
  },
  {
    phase: "ppm",
    role: "user",
    content: "Le storyboard est top. On valide la pré-prod, on peut lancer la production !",
  },

  // ─── PRODUCTION (prod_image) ───
  {
    phase: "prod_image",
    role: "agent",
    content: "PPM validé ! 🚀 La production est lancée.\n\nLes assets sont en cours de création. Je vous tiendrai informé de l'avancement.",
  },
  {
    phase: "prod_image",
    role: "agent",
    content: "Les premiers visuels sont prêts ! Les images hero et packshot ont été finalisées. La production vidéo est en cours.",
  },

  // ─── VIDÉO (prod_video) ───
  {
    phase: "prod_video",
    role: "agent",
    content: "Le spot 30s et le pre-roll 15s sont finalisés ! 🎬 Le montage respecte parfaitement le storyboard validé. Les rushes slow-motion sont magnifiques.",
  },

  // ─── AUDIO (prod_audio) ───
  {
    phase: "prod_audio",
    role: "agent",
    content: "La voix off et la musique sont prêtes ! 🎵 L'ambiance sonore capture parfaitement l'énergie urbaine qu'on recherchait.",
  },

  // ─── LIVRAISON (delivered) ───
  {
    phase: "delivered",
    role: "agent",
    content: "🎉 **Campagne « Éclat Urbain » livrée !**\n\nTous les assets sont disponibles dans la galerie ci-contre. Vous pouvez télécharger l'ensemble en un clic.\n\n**Récapitulatif :**\n- 6 visuels (Hero, Packshot, Story, Post, Banner, OOH)\n- 2 vidéos (Spot 30s + Pre-roll 15s)\n- 2 pistes audio (Voix off + Musique)\n- 3 documents (Brief final, Présentation client, Charte adaptée)\n\nMerci pour votre confiance ! N'hésitez pas si vous souhaitez des ajustements.",
    metadata: {
      type: "campaign_gallery",
      campaign_title: "Éclat Urbain — Assets Finaux",
      zip_url: "#",
      production_assets: [
        { id: "img-1", type: "image", title: "Hero — Balcon Paris", format: "1920×1080", url: "/placeholder.svg", thumbnail_url: "/placeholder.svg" },
        { id: "img-2", type: "image", title: "Packshot Flacon", format: "1080×1080", url: "/placeholder.svg", thumbnail_url: "/placeholder.svg" },
        { id: "img-3", type: "image", title: "Street — Marais", format: "1080×1350", url: "/placeholder.svg", thumbnail_url: "/placeholder.svg" },
        { id: "img-4", type: "image", title: "Story Instagram", format: "1080×1920", url: "/placeholder.svg", thumbnail_url: "/placeholder.svg" },
        { id: "img-5", type: "image", title: "Banner YouTube", format: "1920×1080", url: "/placeholder.svg", thumbnail_url: "/placeholder.svg" },
        { id: "img-6", type: "image", title: "OOH Abribus", format: "1200×1600", url: "/placeholder.svg", thumbnail_url: "/placeholder.svg" },
        { id: "vid-1", type: "video", title: "Spot 30s — Version cinéma", format: "16:9 • 4K", url: "#", duration: "0:30" },
        { id: "vid-2", type: "video", title: "Pre-roll 15s — YouTube", format: "16:9 • 1080p", url: "#", duration: "0:15" },
        { id: "aud-1", type: "audio", title: "Voix off — FR", format: "WAV", url: "#", duration: "0:32", file_size: "12 Mo" },
        { id: "aud-2", type: "audio", title: "Musique — Ambiance urbaine", format: "MP3", url: "#", duration: "1:05", file_size: "4.2 Mo" },
        { id: "doc-1", type: "document", title: "Brief créatif final", format: "PDF", url: "#", file_size: "2.1 Mo" },
        { id: "doc-2", type: "document", title: "Présentation client", format: "PPTX", url: "#", file_size: "18 Mo" },
        { id: "doc-3", type: "document", title: "Charte graphique adaptée", format: "PDF", url: "#", file_size: "5.4 Mo" },
      ],
    },
  },
];

/* Pipeline state per step */
const STEP_ORDER: WorkflowStep[] = [
  "commercial", "planner", "dc_visual", "dc_copy", "ppm",
  "prod_image", "prod_video", "prod_audio", "delivered",
];

function buildPipeline(upToStep: WorkflowStep): PipelineStep[] {
  const idx = STEP_ORDER.indexOf(upToStep);
  return STEP_ORDER.map((step, i) => ({
    step,
    status: i === idx ? "in_progress" : "completed",
    started_at: new Date().toISOString(),
    completed_at: i !== idx ? new Date().toISOString() : null,
  }));
}

/* Brief data for OutputPanel */
const demoBriefData = {
  brand: "Maison Lumière",
  product: "Parfum « Éclat Urbain » — Eau de Parfum 75ml",
  objective: "Lancer le nouveau parfum avec une campagne digitale multi-canal visant à générer 50 000 ventes en 3 mois",
  budget: "150 000 €",
  channels: ["Instagram (Stories + Reels)", "YouTube (Pre-roll 15s + Spot 30s)", "Display programmatique", "OOH digital (Paris, Lyon, Marseille)"],
  tone: ["Audacieux", "Contemporain", "Premium"],
  key_message: "Un parfum qui capture l'énergie de la ville et la transforme en élégance",
  kpis: ["50 000 unités vendues en 3 mois", "ROAS ≥ 4.5x", "Brand lift +15 points", "2M impressions qualifiées"],
  timing: "Lancement campagne : 15 avril 2026",
};

/* ═══════════════════════════════════════════════
   DEMO PAGE COMPONENT
   ═══════════════════════════════════════════════ */

const DemoPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<WorkflowStep>("delivered");

  const pipeline = useMemo(() => buildPipeline(activeStep), [activeStep]);

  // Filter messages up to the selected step
  const visibleMessages = useMemo(() => {
    const stepIdx = STEP_ORDER.indexOf(activeStep);
    return DEMO_MESSAGES.filter((m) => STEP_ORDER.indexOf(m.phase) <= stepIdx) as ChatMessage[];
  }, [activeStep]);

  // Collect artifacts from visible messages
  const visibleArtifacts = useMemo(() => {
    return visibleMessages.filter((m) => m.metadata?.type) as ChatMessage[];
  }, [visibleMessages]);

  // Show brief data once we're past commercial
  const showBrief = STEP_ORDER.indexOf(activeStep) >= STEP_ORDER.indexOf("commercial");

  const handleStepClick = useCallback((step: WorkflowStep) => {
    setActiveStep(step);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-primary-foreground">M</span>
          </div>
          <span className="text-sm font-semibold text-foreground">
            Maison Lumière — Éclat Urbain
          </span>
          <span className="ml-2 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground">
            DÉMO
          </span>
        </div>

        <div className="flex-1 px-8">
          <WorkflowStepper
            pipeline={pipeline}
            currentStep={activeStep}
            onStepClick={handleStepClick}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          Cliquez sur une étape
        </div>
      </header>

      {/* Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Panel - 40% */}
        <div className="w-[40%] min-w-[360px] border-r border-border">
          <ChatPanel
            messages={visibleMessages}
            thinking={null}
            onSendMessage={() => {}}
            onQuickReply={() => {}}
            isStreaming={false}
          />
        </div>

        {/* Output Panel - 60% */}
        <div className="relative flex-1">
          <OutputPanel
            artifacts={visibleArtifacts}
            briefData={showBrief ? demoBriefData : undefined}
            onSelectPiste={() => {}}
            onApprove={() => {}}
            onReject={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
