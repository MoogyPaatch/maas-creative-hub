import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects, createConversation } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, CheckCircle2, AlertCircle, Loader2, Search, Filter, LayoutGrid, Columns3, AlertTriangle } from "lucide-react";
import { WORKFLOW_STEPS } from "@/types";
import type { Project } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  active: { icon: <Clock className="h-3.5 w-3.5" />, color: "text-primary", label: "En cours" },
  completed: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-success", label: "Terminé" },
  draft: { icon: <AlertCircle className="h-3.5 w-3.5" />, color: "text-muted-foreground", label: "Brouillon" },
};

function projectGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1} 70% 55%) 0%, hsl(${h2} 60% 45%) 100%)`;
}

function phaseProgress(phase: string | null): number {
  if (!phase) return 0;
  const idx = WORKFLOW_STEPS.findIndex((s) => s.key === phase);
  if (idx < 0) return 0;
  return ((idx + 1) / WORKFLOW_STEPS.length) * 100;
}

const getPhaseLabel = (phase: string | null) => {
  const map: Record<string, string> = {
    commercial: "Brief Client",
    planner: "Stratégie Créative",
    dc_visual: "Direction Visuelle",
    dc_copy: "Direction Copy",
    ppm: "Pré-Production",
    prod_image: "Production Image",
    prod_video: "Production Vidéo",
    prod_audio: "Production Audio",
    prod_router: "Production",
    delivered: "Livré",
    finished: "Terminé",
  };
  return phase ? map[phase] || phase : "Nouveau";
};

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

  // Filter, search, sort
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

  // Kanban columns
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <span className="text-lg font-bold text-primary-foreground">M</span>
            </div>
            <span className="text-lg font-semibold text-foreground">MaaS</span>
            {isAgency && (
              <span className="hidden sm:inline rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                Agence
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <button
              onClick={() => {
                localStorage.removeItem("maas_token");
                navigate("/login");
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Top bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projets</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isAgency ? "Dashboard agence — gérez toutes vos campagnes" : "Vos campagnes créatives"}
            </p>
          </div>
          <button
            onClick={handleNew}
            disabled={creating}
            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Nouvelle campagne
          </button>
        </div>

        {/* Search, filter, sort toolbar (agency gets full toolbar) */}
        {!loading && projects.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un projet..."
                className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Phase filter */}
            {isAgency && uniquePhases.length > 1 && (
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterPhase || ""}
                  onChange={(e) => setFilterPhase(e.target.value || null)}
                  className="h-9 rounded-lg border border-border bg-surface px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Toutes les phases</option>
                  {uniquePhases.map((p) => (
                    <option key={p} value={p}>{getPhaseLabel(p)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="h-9 rounded-lg border border-border bg-surface px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="date">Plus récents</option>
              <option value="name">Nom A-Z</option>
              <option value="phase">Par phase</option>
            </select>

            {/* View toggle (agency only) */}
            {isAgency && (
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex h-9 w-9 items-center justify-center transition-colors ${
                    viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                  title="Vue grille"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`flex h-9 w-9 items-center justify-center transition-colors ${
                    viewMode === "kanban" ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                  title="Vue kanban"
                >
                  <Columns3 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <Skeleton className="h-24 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Aucun projet</p>
            <p className="mt-1 text-sm text-muted-foreground">Créez votre première campagne pour commencer</p>
          </motion.div>
        ) : viewMode === "kanban" && isAgency ? (
          /* Kanban view */
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {WORKFLOW_STEPS.map((step) => {
              const items = kanbanColumns[step.key] || [];
              return (
                <div key={step.key} className="min-w-[260px] max-w-[280px] shrink-0">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{step.shortLabel}</span>
                    {items.length > 0 && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {items.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {items.map((p) => {
                      const sc = statusConfig[p.status] || statusConfig.active;
                      return (
                        <motion.div
                          key={p.id}
                          layout
                          onClick={() => navigate(`/project/${p.id}`)}
                          className="group cursor-pointer rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
                        >
                          <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {p.client_name || "Nouvelle campagne"}
                          </h4>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(p.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </span>
                            <span className={`flex items-center gap-1 text-[10px] font-medium ${sc.color}`}>
                              {sc.icon}
                            </span>
                          </div>
                          {p.pending_validation && (
                            <div className="mt-2 flex items-center gap-1 rounded-md bg-warning/10 px-2 py-1 text-[10px] font-medium text-warning">
                              <AlertTriangle className="h-3 w-3" />
                              Action requise
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                    {items.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border py-8 text-center">
                        <p className="text-[10px] text-muted-foreground">Aucun projet</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid view */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => {
              const sc = statusConfig[p.status] || statusConfig.active;
              const progress = phaseProgress(p.supervisor_phase);
              const name = p.client_name || "Nouvelle campagne";
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="group cursor-pointer rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                >
                  <div
                    className="h-20 w-full opacity-80 transition-opacity group-hover:opacity-100"
                    style={{ background: projectGradient(name) }}
                  />
                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {getPhaseLabel(p.supervisor_phase)}
                      </span>
                      <div className="flex items-center gap-2">
                        {p.pending_validation && (
                          <span className="flex items-center gap-1 rounded-md bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                            <AlertTriangle className="h-3 w-3" />
                            Action requise
                          </span>
                        )}
                        <span className={`flex items-center gap-1 text-xs font-medium ${sc.color}`}>
                          {sc.icon} {sc.label}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <div className="mt-3 h-1 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, delay: i * 0.04 + 0.2, ease: "easeOut" }}
                        className="h-full rounded-full bg-primary/70"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && projects.length > 0 && (
              <div className="col-span-full text-center py-12">
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
