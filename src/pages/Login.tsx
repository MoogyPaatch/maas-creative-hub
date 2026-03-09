import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import logoWhite from "@/assets/logo-marcel-white.png";
import logoBlack from "@/assets/logo-marcel-black.png";
import logoLion from "@/assets/logo-marcel-lion-black.png";

const taglines = [
  "Make things that change things.",
  "L'audace créative, orchestrée par l'IA.",
  "Du brief à la campagne, sans compromis.",
];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [taglineIdx, setTaglineIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTaglineIdx((i) => (i + 1) % taglines.length), 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/projects");
    } catch {
      setError("Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-foreground p-12 relative overflow-hidden">
        {/* Subtle red accent line */}
        <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
        
        <div>
          <img src={logoWhite} alt="Marcel" className="h-14 w-auto" />
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.h2
              key={taglineIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-4xl xl:text-5xl font-bold tracking-tight text-primary-foreground leading-[1.1] max-w-lg"
            >
              {taglines[taglineIdx]}
            </motion.h2>
          </AnimatePresence>
          <div className="h-1 w-16 bg-accent" />
        </div>

        <p className="text-sm text-primary-foreground/40 font-medium tracking-widest uppercase">
          Marcel as a Service
        </p>
      </div>

      {/* Right — login form */}
      <div className="flex flex-1 items-center justify-center bg-background px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden">
            <img src={logoBlack} alt="Marcel" className="h-12 w-auto dark:invert" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Connexion</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Accédez à votre espace créatif
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full border-b-2 border-border bg-transparent px-0 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors"
                placeholder="votre@email.com"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full border-b-2 border-border bg-transparent px-0 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive font-medium">
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center bg-foreground text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-foreground/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Se connecter"}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">MaaS</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
