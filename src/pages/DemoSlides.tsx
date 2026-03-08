import { useState } from "react";
import DCPresentation from "@/components/output/DCPresentation";
import PPMPresentation from "@/components/output/PPMPresentation";
import type { MessageMetadata, DCPiste } from "@/types";

const mockPistes: DCPiste[] = [
  {
    id: "piste-1",
    title: "L'Éclat Urbain",
    headline: "La ville est votre terrain de jeu",
    concept: "Une campagne qui capture l'énergie brute de la ville, mêlant street art et haute couture dans des lieux emblématiques parisiens. Les visuels jouent sur le contraste entre le béton et l'élégance.",
    tone: "Direction visuelle audacieuse : palette néon sur fond sombre, typographie graffiti modernisée, prises de vue en contre-plongée pour magnifier les silhouettes urbaines.",
    justification: "Cette piste répond à la cible 18-35 ans urbaine en s'appropriant les codes de la street culture tout en maintenant le positionnement premium de la marque. Les études montrent un engagement +47% sur ce type de contenu.",
    thumbnail_url: "",
  },
  {
    id: "piste-2",
    title: "Souffle Naturel",
    headline: "Respirez l'authenticité",
    concept: "Une immersion dans la nature sauvage française — forêts de Fontainebleau, falaises d'Étretat, lavandes de Provence. Le produit se fond dans le paysage, symbole d'un luxe responsable et durable.",
    tone: "Palette terre et ciel : verts profonds, ocres dorés, bleus lavande. Photographie en lumière naturelle, format cinématographique 2.39:1. Typographie serif élégante.",
    justification: "Alignement parfait avec la tendance éco-luxe et les valeurs RSE de la marque. Le positionnement nature premium permet de se différencier sur un marché saturé de visuels urbains.",
    thumbnail_url: "",
  },
  {
    id: "piste-3",
    title: "Héritage Futur",
    headline: "Le passé éclaire demain",
    concept: "Fusion entre artisanat traditionnel et technologie de pointe. Les visuels montrent des artisans au travail, leurs gestes ancestraux sublimés par des effets holographiques et des textures numériques.",
    tone: "Esthétique rétro-futuriste : dorés et chromes, textures bois et métal brossé, effets de lumière volumétrique. Motion design fluide avec transitions morphologiques.",
    justification: "Cette piste capitalise sur le storytelling de marque et l'héritage artisanal, un axe plébiscité par la cible CSP+ (35-55 ans). Le twist technologique rajeunit le discours sans perdre en crédibilité.",
    thumbnail_url: "",
  },
];

const mockDCMetadata: MessageMetadata = {
  type: "dc_presentation",
  pistes: mockPistes,
  piste_titles: mockPistes.map((p) => p.title),
  slides_url: "#",
  pptx_url: "#",
};

const mockPPMMetadata: MessageMetadata = {
  type: "ppm_presentation",
  summary: "Campagne digitale multi-canal pour le lancement du nouveau parfum « Éclat Urbain ». Production prévue sur 3 semaines avec tournage Paris + studio.",
  slides_url: "#",
  pptx_url: "#",
  storyboard_count: 8,
  casting_count: 4,
  settings_count: 3,
  mockup_count: 5,
  storyboard: [
    { frame_number: 1, description: "Ouverture aérienne sur les toits de Paris au lever du soleil. Travelling lent vers le bas jusqu'à une silhouette sur un balcon.", duration: "3s", camera: "Drone DJI Inspire 3" },
    { frame_number: 2, description: "Plan moyen : la protagoniste se retourne face caméra, flacon en main. Lumière dorée naturelle, cheveux au vent.", duration: "2s", camera: "Steadicam" },
    { frame_number: 3, description: "Gros plan sur le flacon posé sur la rambarde, reflets de la ville dans le verre. Rack focus vers l'horizon.", duration: "2s", camera: "Macro 100mm" },
    { frame_number: 4, description: "Transition wipe : la protagoniste marche dans une ruelle pavée du Marais. Caméra la suit en travelling latéral.", duration: "4s", camera: "Gimbal" },
    { frame_number: 5, description: "Plan d'ensemble : elle entre dans une galerie d'art contemporain. Œuvres colorées en arrière-plan, lumière froide muséale.", duration: "3s", camera: "Plan fixe grand angle" },
    { frame_number: 6, description: "Séquence rapide de plans de coupe : textures, couleurs, détails du flacon, sourire complice.", duration: "2s", camera: "Multi-angles" },
    { frame_number: 7, description: "Plan final : elle vaporise le parfum, particules dorées en slow motion. La lumière explose autour d'elle.", duration: "3s", camera: "Phantom Flex 4K (slow-mo)" },
    { frame_number: 8, description: "Packshot final : flacon centré sur fond noir, logo et baseline apparaissent en fondu.", duration: "3s", camera: "Plan fixe studio" },
  ],
  casting: [
    { role: "Protagoniste", description: "Femme 25-30 ans, allure parisienne chic et décontractée. Présence naturelle face caméra, capable de transmettre l'émotion sans dialogue." },
    { role: "Figurant galerie", description: "Homme 35-40 ans, look artiste contemporain. Silhouette élancée, présence discrète mais mémorable en arrière-plan." },
    { role: "Figurante café", description: "Femme 20-25 ans, style étudiant Rive Gauche. Interaction naturelle au second plan pendant la scène de rue." },
    { role: "Mains artisan", description: "Plans serrés sur des mains d'artisan parfumeur manipulant des essences. Mains expressives, gestes précis et assurés." },
  ],
  settings: [
    { name: "Terrasse parisienne (Montmartre)", description: "Appartement haussmannien avec balcon vue sur les toits. Orientation est pour lumière matinale. Décor minimaliste chic, plantes vertes, mobilier vintage." },
    { name: "Ruelle du Marais", description: "Pavés authentiques, façades colorées, portes cochères. Tournage tôt le matin pour éviter la foule. Éclairage naturel complété par réflecteurs." },
    { name: "Studio packshot", description: "Cyclo noir mat, éclairage volumétrique contrôlé. Table de prise de vue avec surface réfléchissante pour le flacon. Setup macro dédié." },
  ],
  production_notes: {
    budget_range: "120 000 € – 150 000 €",
    timeline: "Pré-production : 1 semaine · Tournage : 3 jours · Post-production : 2 semaines · Livraison : J+28",
  },
  mockups: [
    { format: "Story Instagram (9:16)", description: "Version verticale du plan flacon avec particules dorées. Animation subtle du logo. CTA « Découvrir »." },
    { format: "Post carré (1:1)", description: "Crop centré du plan protagoniste sur balcon. Texte headline en overlay avec effet glassmorphism." },
    { format: "Banner YouTube (16:9)", description: "Version cinématographique du plan galerie d'art. Bande noire en haut/bas pour effet premium." },
    { format: "Display 300x250", description: "Packshot flacon sur fond dégradé doré-noir. Logo, baseline et CTA animés en séquence." },
    { format: "OOH Abribus (4:3)", description: "Photo plein cadre protagoniste de dos face aux toits de Paris. Flacon en surimpression transparente. Minimaliste et impactant." },
  ],
};

const DemoSlides = () => {
  const [view, setView] = useState<"dc" | "ppm">("dc");

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Toggle bar */}
      <div className="flex items-center justify-center gap-2 border-b border-border py-3">
        <button
          onClick={() => setView("dc")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
            view === "dc"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          Pistes DC
        </button>
        <button
          onClick={() => setView("ppm")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
            view === "ppm"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          PPM
        </button>
      </div>

      {/* Slide area */}
      <div className="flex-1 overflow-hidden">
        {view === "dc" ? (
          <DCPresentation
            metadata={mockDCMetadata}
            onSelectPiste={(id) => console.log("Selected piste:", id)}
          />
        ) : (
          <PPMPresentation metadata={mockPPMMetadata} />
        )}
      </div>
    </div>
  );
};

export default DemoSlides;
