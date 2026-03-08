import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects, createConversation } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { Project } from "@/types";

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  active: { icon: <Clock className="h-3.5 w-3.5" />, color: "text-primary", label: "En cours" },
  completed: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-success", label: "Terminé" },
  draft: { icon: <AlertCircle className="h-3.5 w-3.5" />, color: "text-muted-foreground", label: "Brouillon" },
};

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
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <span className="text-lg font-bold text-primary-foreground">M</span>
            </div>
            <span className="text-lg font-semibold text-foreground">MaaS</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
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
            className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Nouvelle campagne
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="group cursor-pointer rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {getPhaseLabel(p.supervisor_phase)}
                    </span>
                    <span className={`flex items-center gap-1 text-xs font-medium ${sc.color}`}>
                      {sc.icon} {sc.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {p.client_name || "Nouvelle campagne"}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
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
