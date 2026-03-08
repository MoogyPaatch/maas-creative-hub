import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowDown } from "lucide-react";
import { useRef } from "react";
import logoBlack from "@/assets/logo-marcel-black.png";
import logoWhite from "@/assets/logo-marcel-white.png";

const steps = [
  { num: "01", title: "Brief", desc: "Décrivez votre vision. Marcel analyse, questionne et structure votre brief stratégique." },
  { num: "02", title: "Création", desc: "Direction artistique, copy et pistes créatives générées et présentées en slides immersives." },
  { num: "03", title: "Production", desc: "Assets visuels, vidéo et audio produits automatiquement, prêts à déployer." },
  { num: "04", title: "Livraison", desc: "Campagne finalisée, validée et exportée dans tous les formats requis." },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const Index = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="fixed inset-x-0 top-0 z-50 bg-background/90 backdrop-blur-md"
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">
          <img src={logoBlack} alt="Marcel" className="h-10 w-auto dark:hidden" />
          <img src={logoWhite} alt="Marcel" className="h-10 w-auto hidden dark:block" />
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/demo")}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Démo
            </button>
            <button
              onClick={() => navigate("/login")}
              className="h-10 px-6 bg-foreground text-background text-sm font-bold uppercase tracking-wider transition-all hover:bg-foreground/90"
            >
              Connexion
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <section ref={heroRef} className="relative flex min-h-screen items-center justify-center pt-20">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 mx-auto max-w-6xl px-8">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-10">
            <motion.div variants={fadeUp}>
              <div className="h-1 w-16 bg-accent mb-8" />
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground mb-6">
                Agency-as-a-Service
              </p>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-6xl sm:text-8xl lg:text-[9rem] font-bold leading-[0.9] tracking-tighter text-foreground"
            >
              Make things
              <br />
              that change
              <br />
              <span className="text-accent">things.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="max-w-xl text-lg text-muted-foreground leading-relaxed">
              Du brief à la livraison, Marcel orchestre chaque étape de votre campagne créative avec la puissance de l'IA générative.
            </motion.p>

            <motion.div variants={fadeUp} className="flex items-center gap-6 pt-4">
              <button
                onClick={() => navigate("/demo")}
                className="group flex items-center gap-3 h-14 px-8 bg-foreground text-background text-sm font-bold uppercase tracking-wider transition-all hover:bg-foreground/90"
              >
                Voir la démo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="h-14 px-8 border-2 border-foreground text-foreground text-sm font-bold uppercase tracking-wider transition-all hover:bg-foreground hover:text-background"
              >
                Se connecter
              </button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-12 left-8"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-3 text-muted-foreground"
          >
            <ArrowDown className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-widest">Scroll</span>
          </motion.div>
        </motion.div>
      </section>

      {/* Process */}
      <section className="relative py-40 border-t border-border">
        <div className="mx-auto max-w-7xl px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-24"
          >
            <div className="h-1 w-16 bg-accent mb-8" />
            <h2 className="text-5xl sm:text-7xl font-bold tracking-tighter text-foreground">
              Process
            </h2>
          </motion.div>

          <div className="grid gap-0 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group border-t border-border py-10 lg:border-t-0 lg:border-l lg:px-8 lg:py-0 first:border-t-0 lg:first:border-l-0"
              >
                <span className="block text-6xl font-bold text-border group-hover:text-accent transition-colors duration-500">
                  {step.num}
                </span>
                <h3 className="mt-4 text-xl font-bold text-foreground">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-40 bg-foreground">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl px-8 text-center"
        >
          <h2 className="text-5xl sm:text-7xl font-bold tracking-tighter text-background">
            Prêt à
            <br />
            <span className="text-accent">oser ?</span>
          </h2>
          <p className="mt-6 text-lg text-background/50">
            Lancez votre première campagne en quelques minutes.
          </p>
          <div className="mt-12 flex justify-center gap-6">
            <button
              onClick={() => navigate("/demo")}
              className="group flex items-center gap-3 h-14 px-10 bg-background text-foreground text-sm font-bold uppercase tracking-wider transition-all hover:bg-background/90"
            >
              Explorer la démo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8">
          <img src={logoBlack} alt="Marcel" className="h-8 w-auto dark:hidden" />
          <img src={logoWhite} alt="Marcel" className="h-8 w-auto hidden dark:block" />
          <p className="text-xs text-muted-foreground font-medium">
            © {new Date().getFullYear()} Marcel. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
