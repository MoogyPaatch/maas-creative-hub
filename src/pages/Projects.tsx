import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects, createConversation } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { WORKFLOW_STEPS } from "@/types";
import type { Project } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  active: { icon: <Clock className="h-3.5 w-3.5" />, color: "text-primary", label: "En cours" },
  completed: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-success", label: "Terminé" },
  draft: { icon: <AlertCircle className="h-3.5 w-3.5" />, color: "text-muted-foreground", label: "Brouillon" },
};

/** Unique gradient from project name hash */
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

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getProjects()
      .then((data) => setProjects(data))
      .catch(() => toast.error("Impossible de charger les projets"))
      .finally(() => setLoading(false));
  }, []);

  const handleNew = async () => {
    setCreating(true);
    try {
      const isAgency = user?.role === "agency" || user?.role === "admin";
      const conv = await createConversation(null, isAgency, isAgency ? "commercial" : null);
      navigate(`/project/${conv.project_id}`);
    } catch {
      toast.error("Impossible de créer le projet");
      setCreating(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <span className="text-lg font-bold text-primary-foreground">M</span>
            </div>
            <span className="text-lg font-semibold text-foreground">MaaS</span>
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

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projets</h1>
            <p className="mt-1 text-sm text-muted-foreground">Vos campagnes créatives propulsées par l'IA Marcel</p>
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
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => {
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
                  style={{ perspective: "800px" }}
                >
                  {/* Gradient cover */}
                  <div
                    className="h-20 w-full opacity-80 transition-opacity group-hover:opacity-100"
                    style={{ background: projectGradient(name) }}
                  />

                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {getPhaseLabel(p.supervisor_phase)}
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-medium ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </span>
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

                    {/* Progress bar */}
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
          </div>
        )}
      </main>
    </div>
  );
};

export default Projects;
