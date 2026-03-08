import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FileText, Palette, Film, Rocket, ArrowRight, Sparkles } from "lucide-react";
import { useRef } from "react";

const steps = [
  { icon: FileText, title: "Brief", desc: "Décrivez votre vision. Marcel analyse, questionne et structure votre brief stratégique." },
  { icon: Palette, title: "Création", desc: "Direction artistique, copy et pistes créatives générées et présentées en slides immersives." },
  { icon: Film, title: "Production", desc: "Assets visuels, vidéo et audio produits automatiquement, prêts à déployer." },
  { icon: Rocket, title: "Livraison", desc: "Campagne finalisée, validée et exportée dans tous les formats requis." },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const Index = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
              <span className="text-lg font-bold text-primary-foreground">M</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">MaaS</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/demo")}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Démo
            </button>
            <button
              onClick={() => navigate("/login")}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110"
            >
              Se connecter
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <section ref={heroRef} className="relative flex min-h-screen items-center justify-center pt-16">
        {/* Animated background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 animate-gradient-shift bg-gradient-to-br from-primary/8 via-transparent to-primary/5" />
          <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-primary/3 blur-[100px]" />
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Agency-as-a-Service propulsé par l'IA
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
              L'intelligence
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                créative,
              </span>
              <br />
              orchestrée.
            </motion.h1>

            <motion.p variants={fadeUp} className="mx-auto max-w-xl text-lg text-muted-foreground sm:text-xl">
              Du brief à la livraison, Marcel orchestre chaque étape de votre campagne créative avec la puissance de l'IA générative.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={() => navigate("/demo")}
                className="group flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:shadow-2xl hover:shadow-primary/35 hover:brightness-110"
              >
                Voir la démo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="rounded-xl border border-border bg-card/50 px-8 py-3.5 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card"
              >
                Se connecter
              </button>
            </motion.div>

            <motion.p variants={fadeUp} className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground/50">
              #Dare #Make #Change
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-10 w-6 rounded-full border-2 border-muted-foreground/20 flex items-start justify-center pt-2"
          >
            <div className="h-2 w-1 rounded-full bg-muted-foreground/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="relative py-32">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-20 text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Comment ça marche
            </h2>
            <p className="mt-4 text-muted-foreground">
              4 étapes. De l'idée à la campagne livrée.
            </p>
          </motion.div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  Étape {i + 1}
                </span>
                <h3 className="mb-2 text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-2xl px-6 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Prêt à transformer
            <br />
            votre créativité ?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Lancez votre première campagne en quelques minutes.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <button
              onClick={() => navigate("/demo")}
              className="group flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:shadow-2xl hover:shadow-primary/35"
            >
              Explorer la démo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <span className="text-xs font-bold text-primary-foreground">M</span>
            </div>
            <span className="text-sm font-semibold text-foreground">MaaS</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Marcel. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
