import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects, createConversation, archiveProject, createShareLink, downloadDossierPDF } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Plus, Clock, CheckCircle2, AlertCircle, Loader2, Search, Filter,
  LayoutGrid, Columns3, AlertTriangle, ArrowRight, LogOut, Bell, ChevronRight,
  Archive, ArchiveRestore, Share2, Download, MoreHorizontal,
} from "lucide-react";
import { WORKFLOW_STEPS, CLIENT_PHASES, getClientPhaseIndex, getClientPhaseLabel } from "@/types";
import type { Project } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import logoBlack from "@/assets/logo-marcel-black.png";
import logoWhite from "@/assets/logo-marcel-white.png";

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  active: { icon: <Clock className="h-3.5 w-3.5" />, color: "text-foreground", label: "En cours" },
  completed: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-success", label: "Terminé" },
  draft: { icon: <AlertCircle className="h-3.5 w-3.5" />, color: "text-muted-foreground", label: "Brouillon" },
};

function phaseProgress(phase: string | null): number {
  if (!phase) return 0;
  const idx = WORKFLOW_STEPS.findIndex((s) => s.key === phase);
  if (idx < 0) return 0;
  return ((idx + 1) / WORKFLOW_STEPS.length) * 100;
}

const getPhaseLabel = (phase: string | null) => {
  const map: Record<string, string> = {
    commercial: "Brief Client",
    planner: "Stratégie",
    dc_visual: "Direction Visuelle",
    dc_copy: "Direction Copy",
    ppm: "Pré-Production",
    prod_image: "Prod. Image",
    prod_video: "Prod. Vidéo",
    prod_audio: "Prod. Audio",
    prod_router: "Production",
    delivered: "Livré",
    finished: "Terminé",
  };
  return phase ? map[phase] || phase : "Nouveau";
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ── Project Visuals (deterministic gradient per brand) ───────────────────

const PROJECT_GRADIENTS = [
  "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
  "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
  "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
  "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
  "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
  "linear-gradient(135deg, #f97316 0%, #eab308 100%)",
  "linear-gradient(135deg, #14b8a6 0%, #22c55e 100%)",
  "linear-gradient(135deg, #e11d48 0%, #be185d 100%)",
  "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
  "linear-gradient(135deg, #059669 0%, #0891b2 100%)",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getProjectGradient(name: string): string {
  if (!name || name === "Nouvelle campagne") {
    return "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)";
  }
  return PROJECT_GRADIENTS[hashString(name) % PROJECT_GRADIENTS.length];
}

function getProjectBackground(name: string, thumbnailUrl: string | null | undefined): React.CSSProperties {
  if (thumbnailUrl) {
    return {
      backgroundImage: `url(${thumbnailUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { background: getProjectGradient(name) };
}

function getInitials(name: string): string {
  if (!name || name === "Nouvelle campagne") return "?";
  const cleaned = name.replace(/[—–\-()]/g, " ").replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ").filter((w) => w.length > 0);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (name[0] || "?").toUpperCase();
}

// ── Client Stepper (4 étapes) ───────────────────────────────────────────

const ClientStepper = ({ phase }: { phase: string | null }) => {
  const currentIdx = getClientPhaseIndex(phase);

  return (
    <div className="flex items-center gap-1">
      {CLIENT_PHASES.map((cp, i) => {
        const isCompleted = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={cp.key} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={`h-px w-4 lg:w-6 transition-colors ${
                  i <= currentIdx ? "bg-foreground" : "bg-border"
                }`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-colors ${
                  isCompleted
                    ? "bg-foreground text-background"
                    : isCurrent
                    ? "border-2 border-foreground text-foreground"
                    : "border border-border text-muted-foreground/40"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={`text-[10px] lg:text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                  isCurrent
                    ? "text-foreground"
                    : isCompleted
                    ? "text-foreground/70"
                    : "text-muted-foreground/40"
                }`}
              >
                {cp.shortLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Client Dashboard ────────────────────────────────────────────────────

type ClientTab = "all" | "actions" | "done" | "archived";

const ClientDashboard = ({
  projects,
  loading,
  creating,
  onNew,
  onOpen,
  onRefresh,
  userName,
}: {
  projects: Project[];
  loading: boolean;
  creating: boolean;
  onNew: () => void;
  onOpen: (id: string) => void;
  onRefresh: () => void;
  userName: string | null;
}) => {
  const [tab, setTab] = useState<ClientTab>("all");
  const [tabInitialized, setTabInitialized] = useState(false);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedLoaded, setArchivedLoaded] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const firstName = userName?.split(" ")[0] || userName?.split("@")[0] || "Client";

  const activeProjects = projects.filter((p) => !p.is_archived);
  const pendingProjects = activeProjects.filter((p) => p.pending_validation);
  const doneProjects = activeProjects.filter(
    (p) => p.supervisor_phase === "delivered" || p.supervisor_phase === "finished" || p.status === "completed"
  );
  const inProgressProjects = activeProjects.filter(
    (p) => p.supervisor_phase !== "delivered" && p.supervisor_phase !== "finished" && p.status !== "completed"
  );

  const pendingCount = pendingProjects.length;

  // Auto-switch to "actions" tab on first load if there are pending items
  useEffect(() => {
    if (!tabInitialized && projects.length > 0) {
      setTabInitialized(true);
      if (pendingCount > 0) setTab("actions");
    }
  }, [projects.length, pendingCount, tabInitialized]);

  // Lazy-load archived projects when tab is selected
  useEffect(() => {
    if (tab === "archived" && !archivedLoaded && !archivedLoading) {
      setArchivedLoading(true);
      getProjects(true)
        .then((all) => {
          setArchivedProjects(all.filter((p: Project) => p.is_archived));
          setArchivedLoaded(true);
        })
        .catch(() => toast.error("Impossible de charger les archives"))
        .finally(() => setArchivedLoading(false));
    }
  }, [tab, archivedLoaded, archivedLoading]);

  const displayed = tab === "actions"
    ? pendingProjects
    : tab === "done"
    ? doneProjects
    : tab === "archived"
    ? archivedProjects
    : activeProjects;

  const sorted = [...displayed].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  const handleArchive = async (e: React.MouseEvent, projectId: string, archive: boolean) => {
    e.stopPropagation();
    try {
      await archiveProject(projectId, archive);
      toast.success(archive ? "Projet archiv\u00e9" : "Projet restaur\u00e9");
      setArchivedLoaded(false);
      onRefresh();
    } catch {
      toast.error("Erreur lors de l'archivage");
    }
  };

  const handleShare = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    try {
      const result = await createShareLink(projectId);
      await navigator.clipboard.writeText(result.share_url);
      toast.success("Lien de partage copi\u00e9 !");
    } catch {
      toast.error("Erreur lors du partage");
    }
  };

  const handleDownload = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation();
    try {
      const blob = await downloadDossierPDF(projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName || "dossier"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("T\u00e9l\u00e9chargement lanc\u00e9");
    } catch {
      toast.error("Dossier non disponible");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-80" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border border-border overflow-hidden">
              <Skeleton className="h-28 w-full rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Bienvenue, {firstName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Cr\u00e9ez votre premi\u00e8re campagne pour commencer</p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onNew}
          className="flex flex-col items-center justify-center border border-dashed border-border py-24 cursor-pointer transition-colors hover:border-foreground hover:bg-muted/30"
        >
          {creating ? (
            <Loader2 className="h-8 w-8 text-muted-foreground mb-4 animate-spin" />
          ) : (
            <Plus className="h-8 w-8 text-muted-foreground mb-4" />
          )}
          <p className="text-sm font-bold text-foreground">Aucun projet</p>
          <p className="mt-1 text-sm text-muted-foreground">Lancez-vous !</p>
        </motion.div>
      </div>
    );
  }

  const isArchiveTab = tab === "archived";

  return (
    <div className="space-y-8">
      {/* Welcome header + stats */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Bienvenue, {firstName}
          </h1>
          <div className="mt-3 flex items-center gap-6">
            {pendingCount > 0 && (
              <button onClick={() => setTab("actions")} className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors">
                <AlertTriangle className="h-3.5 w-3.5" />
                {pendingCount} en attente
              </button>
            )}
            <span className="text-sm text-muted-foreground">
              {inProgressProjects.length} en cours
            </span>
            {doneProjects.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {doneProjects.length} livr\u00e9{doneProjects.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onNew}
          disabled={creating}
          className="group flex h-12 items-center gap-3 bg-foreground px-6 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-foreground/90 disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Nouvelle campagne
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border">
        {([
          { key: "all" as ClientTab, label: "Mes campagnes", count: activeProjects.length },
          { key: "actions" as ClientTab, label: "Actions requises", count: pendingCount, highlight: true },
          { key: "done" as ClientTab, label: "Termin\u00e9s", count: doneProjects.length },
          { key: "archived" as ClientTab, label: "Archiv\u00e9s", count: archivedProjects.length, icon: Archive },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-5 py-3 text-sm font-bold transition-colors flex items-center gap-1.5 ${
              tab === t.key
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {"icon" in t && t.icon && <t.icon className="h-3.5 w-3.5" />}
            {t.label}
            {t.count > 0 && (
              <span
                className={`ml-1 inline-flex h-5 min-w-5 items-center justify-center px-1.5 text-[10px] font-bold ${
                  "highlight" in t && t.highlight && t.count > 0
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {t.count}
              </span>
            )}
            {tab === t.key && (
              <motion.div
                layoutId="client-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
              />
            )}
          </button>
        ))}
      </div>

      {/* Project grid */}
      {(isArchiveTab && archivedLoading) ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">
            {tab === "actions"
              ? "Aucune action en attente"
              : tab === "done"
              ? "Aucun projet termin\u00e9"
              : tab === "archived"
              ? "Aucun projet archiv\u00e9"
              : "Aucun projet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((p, i) => {
            const name = p.client_name || "Nouvelle campagne";
            const isDelivered = p.supervisor_phase === "delivered" || p.supervisor_phase === "finished" || p.status === "completed";
            const clientPhaseIdx = getClientPhaseIndex(p.supervisor_phase);
            const clientProgress = ((clientPhaseIdx + 1) / CLIENT_PHASES.length) * 100;
            const isHovered = hoveredId === p.id;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onOpen(p.id)}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="group relative border border-border overflow-hidden cursor-pointer transition-all duration-300 hover:border-foreground hover:shadow-lg"
              >
                {/* Visual header */}
                <div
                  className="relative h-24 overflow-hidden"
                  style={getProjectBackground(name, p.thumbnail_url)}
                >
                  {!p.thumbnail_url && (
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-black text-white/10 select-none pointer-events-none tracking-wider">
                      {getInitials(name)}
                    </span>
                  )}
                  {p.pending_validation && !isHovered && (
                    <span
                      className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-bold text-white px-2.5 py-1 rounded-sm"
                      style={{ background: "rgba(245,158,11,0.85)", backdropFilter: "blur(4px)" }}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Action requise
                    </span>
                  )}
                  {isDelivered && !p.pending_validation && !isHovered && (
                    <span
                      className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-bold text-white px-2.5 py-1 rounded-sm"
                      style={{ background: "rgba(16,185,129,0.85)", backdropFilter: "blur(4px)" }}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Livr\u00e9
                    </span>
                  )}

                  {/* ── Hover overlay with action icons ── */}
                  <motion.div
                    initial={false}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 flex items-center justify-center gap-3 pointer-events-none"
                    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
                  >
                    <div className={`flex items-center gap-2 ${isHovered ? "pointer-events-auto" : "pointer-events-none"}`}>
                      {isArchiveTab ? (
                        <button
                          onClick={(e) => handleArchive(e, p.id, false)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                          title="Restaurer"
                        >
                          <ArchiveRestore className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleArchive(e, p.id, true)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                          title="Archiver"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleShare(e, p.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                        title="Partager"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      {isDelivered && (
                        <button
                          onClick={(e) => handleDownload(e, p.id, name)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                          title="T\u00e9l\u00e9charger le dossier"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>

                  {/* Progress bar at bottom of visual */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${clientProgress}%` }}
                      transition={{ duration: 0.6, delay: i * 0.03 + 0.15, ease: "easeOut" }}
                      className="h-full bg-white/70"
                    />
                  </div>
                </div>
                {/* Content */}
                <div className="px-4 py-3.5">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors truncate">
                    {name}
                  </h3>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {getClientPhaseLabel(p.supervisor_phase)}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">·</span>
                      <span className="text-[10px] text-muted-foreground/70">
                        {timeAgo(p.updated_at)}
                      </span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main Projects Page ──────────────────────────────────────────────────

type ViewMode = "grid" | "kanban";
type SortKey = "date" | "name" | "phase";

const Projects = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPhase, setFilterPhase] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const isAgency = user?.role === "agency" || user?.role === "admin";

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    getProjects()
      .then((data) => setProjects(data))
      .catch(() => toast.error("Impossible de charger les projets"))
      .finally(() => setLoading(false));
  };

  const handleNew = async () => {
    setCreating(true);
    try {
      const conv = await createConversation(null, isAgency, isAgency ? "commercial" : null);
      navigate(`/project/${conv.project_id}`);
    } catch {
      toast.error("Impossible de créer le projet");
      setCreating(false);
    }
  };

  const filtered = useMemo(() => {
    let result = [...projects];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.client_name || "").toLowerCase().includes(q) ||
          (p.supervisor_phase || "").toLowerCase().includes(q)
      );
    }
    if (filterPhase) {
      result = result.filter((p) => p.supervisor_phase === filterPhase);
    }
    result.sort((a, b) => {
      if (sortBy === "name") return (a.client_name || "").localeCompare(b.client_name || "");
      if (sortBy === "phase") return (a.supervisor_phase || "").localeCompare(b.supervisor_phase || "");
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return result;
  }, [projects, search, filterPhase, sortBy]);

  const kanbanColumns = useMemo(() => {
    const cols: Record<string, Project[]> = {};
    WORKFLOW_STEPS.forEach((s) => (cols[s.key] = []));
    cols["new"] = [];
    filtered.forEach((p) => {
      const phase = p.supervisor_phase || "new";
      if (cols[phase]) cols[phase].push(p);
      else cols["new"].push(p);
    });
    return cols;
  }, [filtered]);

  const uniquePhases = useMemo(() => {
    const phases = new Set(projects.map((p) => p.supervisor_phase).filter(Boolean));
    return Array.from(phases) as string[];
  }, [projects]);

  // ── Client view ─────────────────────────────────────────────────────
  if (!isAgency) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <img src={logoBlack} alt="Marcel" className="h-8 w-auto dark:hidden" />
              <img src={logoWhite} alt="Marcel" className="h-8 w-auto hidden dark:block" />
            </div>
            <div className="flex items-center gap-6">
              <span className="text-xs text-muted-foreground hidden sm:block font-medium">{user?.email}</span>
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-8 py-12">
          <ClientDashboard
            projects={projects}
            loading={loading}
            creating={creating}
            onNew={handleNew}
            onOpen={(id) => navigate(`/project/${id}`)}
            onRefresh={loadProjects}
            userName={user?.full_name || user?.email || null}
          />
        </main>
      </div>
    );
  }

  // ── Agency view ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <img src={logoBlack} alt="Marcel" className="h-8 w-auto dark:hidden" />
            <img src={logoWhite} alt="Marcel" className="h-8 w-auto hidden dark:block" />
            <span className="hidden sm:inline border border-accent text-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Agence
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs text-muted-foreground hidden sm:block font-medium">{user?.email}</span>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-12">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">Gérez toutes vos campagnes créatives</p>
          </div>
          <button
            onClick={handleNew}
            disabled={creating}
            className="group flex h-12 items-center gap-3 bg-foreground px-6 text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-foreground/90 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Nouvelle campagne
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {!loading && projects.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="h-10 w-full border-b-2 border-border bg-transparent pl-6 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
            {uniquePhases.length > 1 && (
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={filterPhase || ""}
                  onChange={(e) => setFilterPhase(e.target.value || null)}
                  className="h-10 border-b-2 border-border bg-transparent px-2 text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                >
                  <option value="">Toutes phases</option>
                  {uniquePhases.map((p) => (
                    <option key={p} value={p}>{getPhaseLabel(p)}</option>
                  ))}
                </select>
              </div>
            )}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="h-10 border-b-2 border-border bg-transparent px-2 text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
            >
              <option value="date">Plus récents</option>
              <option value="name">Nom A-Z</option>
              <option value="phase">Par phase</option>
            </select>

            <div className="flex border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex h-10 w-10 items-center justify-center transition-colors ${
                  viewMode === "grid" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex h-10 w-10 items-center justify-center transition-colors ${
                  viewMode === "kanban" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Columns3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border border-border overflow-hidden">
                <Skeleton className="h-28 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-1 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center border border-dashed border-border py-24"
          >
            <Plus className="h-8 w-8 text-muted-foreground mb-4" />
            <p className="text-sm font-bold text-foreground">Aucun projet</p>
            <p className="mt-1 text-sm text-muted-foreground">Créez votre première campagne</p>
          </motion.div>
        ) : viewMode === "kanban" ? (
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-thin">
            {WORKFLOW_STEPS.map((step) => {
              const items = kanbanColumns[step.key] || [];
              return (
                <div key={step.key} className="min-w-[250px] max-w-[270px] shrink-0">
                  <div className="mb-4 flex items-center gap-2 pb-3 border-b border-border">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">{step.shortLabel}</span>
                    {items.length > 0 && (
                      <span className="text-[10px] font-bold text-muted-foreground">{items.length}</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {items.map((p) => {
                      const sc = statusConfig[p.status] || statusConfig.active;
                      return (
                        <motion.div
                          key={p.id}
                          layout
                          onClick={() => navigate(`/project/${p.id}`)}
                          className="group border border-border p-4 cursor-pointer transition-all hover:border-foreground"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-bold text-foreground truncate flex-1 hover:text-accent transition-colors">
                              {p.client_name || "Nouvelle campagne"}
                            </h4>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {new Date(p.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </span>
                            <span className={`flex items-center gap-1 text-[10px] font-bold ${sc.color}`}>
                              {sc.icon}
                            </span>
                          </div>
                          {p.pending_validation && (
                            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-accent">
                              <AlertTriangle className="h-3 w-3" />
                              Action requise
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                    {items.length === 0 && (
                      <div className="border border-dashed border-border py-10 text-center">
                        <p className="text-[10px] text-muted-foreground">—</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => {
              const sc = statusConfig[p.status] || statusConfig.active;
              const progress = phaseProgress(p.supervisor_phase);
              const name = p.client_name || "Nouvelle campagne";
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="group border border-border overflow-hidden cursor-pointer transition-all duration-300 hover:border-foreground hover:shadow-lg"
                >
                  {/* Visual header */}
                  <div
                    className="relative h-28 flex items-end p-4 overflow-hidden"
                    style={getProjectBackground(name, p.thumbnail_url)}
                  >
                    {!p.thumbnail_url && (
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl font-black text-white/20 select-none pointer-events-none">
                        {getInitials(name)}
                      </span>
                    )}
                    {p.pending_validation && (
                      <span className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-bold text-white px-2.5 py-1"
                        style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Action requise
                      </span>
                    )}
                    <span
                      className="relative text-[10px] font-bold uppercase tracking-wider text-white/90 px-2 py-0.5"
                      style={{ background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)" }}
                    >
                      {getPhaseLabel(p.supervisor_phase)}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-base font-bold text-foreground group-hover:text-accent transition-colors truncate">
                      {name}
                    </h3>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(p.updated_at)}
                      </span>
                      <span className={`flex items-center gap-1 text-[10px] font-bold ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </span>
                    </div>
                    <div className="mt-3 h-1 w-full bg-secondary">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, delay: i * 0.04 + 0.2, ease: "easeOut" }}
                        className="h-full bg-foreground"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && projects.length > 0 && (
              <div className="col-span-full text-center py-16">
                <p className="text-sm text-muted-foreground">Aucun projet ne correspond à votre recherche.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Projects;
