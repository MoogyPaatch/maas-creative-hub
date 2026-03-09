import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects, createConversation } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Plus, Clock, CheckCircle2, AlertCircle, Loader2, Search, Filter,
  LayoutGrid, Columns3, AlertTriangle, ArrowRight, LogOut, Bell, ChevronRight,
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

const ClientDashboard = ({
  projects,
  loading,
  creating,
  onNew,
  onOpen,
  userName,
}: {
  projects: Project[];
  loading: boolean;
  creating: boolean;
  onNew: () => void;
  onOpen: (id: string) => void;
  userName: string | null;
}) => {
  const pendingProjects = projects.filter((p) => p.pending_validation);
  const activeProject = projects.find((p) => p.status === "active") || projects[0];
  const otherProjects = projects.filter((p) => p.id !== activeProject?.id);

  const firstName = userName?.split(" ")[0] || userName?.split("@")[0] || "Client";

  const pendingCount = pendingProjects.length;
  const subtitle = pendingCount > 0
    ? `${pendingCount} action${pendingCount > 1 ? "s" : ""} en attente`
    : "Tous vos projets sont à jour";

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
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
          <p className="mt-2 text-sm text-muted-foreground">Créez votre première campagne pour commencer</p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center border border-dashed border-border py-24"
        >
          <Plus className="h-8 w-8 text-muted-foreground mb-4" />
          <p className="text-sm font-bold text-foreground">Aucun projet</p>
          <p className="mt-1 text-sm text-muted-foreground">Lancez-vous !</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Welcome header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Bienvenue, {firstName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
            {pendingCount > 0 && <Bell className="h-3.5 w-3.5 text-accent" />}
            {subtitle}
          </p>
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

      {/* Action required banner */}
      {pendingProjects.length > 0 && (
        <div className="space-y-3">
          {pendingProjects.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onOpen(p.id)}
              className="flex items-center justify-between gap-4 border-2 border-accent bg-accent/5 p-5 cursor-pointer transition-colors hover:bg-accent/10"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center bg-accent/10">
                  <AlertTriangle className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {p.client_name || "Nouvelle campagne"}
                  </p>
                  <p className="text-xs text-muted-foreground">Validation en attente</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-accent" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Hero card — active project */}
      {activeProject && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => onOpen(activeProject.id)}
          className="group cursor-pointer border border-border p-8 transition-all hover:border-foreground"
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Projet actif
            </span>
            <span className="text-xs text-muted-foreground">
              {timeAgo(activeProject.updated_at)}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-foreground group-hover:text-accent transition-colors mb-6">
            {activeProject.client_name || "Nouvelle campagne"}
          </h2>

          <ClientStepper phase={activeProject.supervisor_phase} />

          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              {getClientPhaseLabel(activeProject.supervisor_phase)}
            </span>
            <span className="flex items-center gap-2 text-sm font-bold text-foreground group-hover:text-accent transition-colors">
              Continuer
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </motion.div>
      )}

      {/* Other projects — compact grid */}
      {otherProjects.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Autres projets
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherProjects.map((p, i) => {
              const phaseLabel = getClientPhaseLabel(p.supervisor_phase);
              const isDelivered = p.supervisor_phase === "delivered" || p.status === "completed";
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onOpen(p.id)}
                  className="group cursor-pointer border border-border p-5 transition-all hover:border-foreground"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-foreground truncate group-hover:text-accent transition-colors">
                      {p.client_name || "Nouvelle campagne"}
                    </h4>
                    {isDelivered && <CheckCircle2 className="h-3.5 w-3.5 text-foreground/60 shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {phaseLabel}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Projects Page ──────────────────────────────────────────────────

type ViewMode = "grid" | "kanban";
type SortKey = "date" | "name" | "phase";

const Projects = () => {
  const { user } = useAuth();
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
    getProjects()
      .then((data) => setProjects(data))
      .catch(() => toast.error("Impossible de charger les projets"))
      .finally(() => setLoading(false));
  }, []);

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
                onClick={() => { localStorage.removeItem("maas_token"); navigate("/login"); }}
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
            userName={user?.full_name || user?.email || null}
          />
        </main>
      </div>
    );
  }

  // ── Agency view (unchanged) ─────────────────────────────────────────
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
              onClick={() => { localStorage.removeItem("maas_token"); navigate("/login"); }}
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
                <Skeleton className="h-2 w-full rounded-none" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-3 w-24" />
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
                          className="group cursor-pointer border border-border p-4 transition-all hover:border-foreground"
                        >
                          <h4 className="text-sm font-bold text-foreground truncate">
                            {p.client_name || "Nouvelle campagne"}
                          </h4>
                          <div className="mt-3 flex items-center justify-between">
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
                  className="group cursor-pointer border border-border overflow-hidden transition-all duration-300 hover:border-foreground"
                >
                  <div className="h-1 w-full bg-secondary">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, delay: i * 0.04 + 0.2, ease: "easeOut" }}
                      className="h-full bg-foreground"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {getPhaseLabel(p.supervisor_phase)}
                      </span>
                      <div className="flex items-center gap-2">
                        {p.pending_validation && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-accent">
                            <AlertTriangle className="h-3 w-3" />
                            Action
                          </span>
                        )}
                        <span className={`flex items-center gap-1 text-[10px] font-bold ${sc.color}`}>
                          {sc.icon} {sc.label}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                      {name}
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground font-medium">
                      {new Date(p.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
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
