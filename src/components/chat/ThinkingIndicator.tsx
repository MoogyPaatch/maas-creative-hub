import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Search, Sparkles, PenTool, Check } from "lucide-react";

interface Props {
  label: string;
}

interface ThinkingStep {
  id: string;
  label: string;
  icon: React.ElementType;
  durationMs: number;
}

const THINKING_STEPS: ThinkingStep[] = [
  { id: "analyze", label: "Analyse de votre demande", icon: Brain, durationMs: 2000 },
  { id: "research", label: "Recherche & contexte", icon: Search, durationMs: 3000 },
  { id: "create", label: "Construction de la réponse", icon: PenTool, durationMs: 4000 },
  { id: "refine", label: "Finalisation", icon: Sparkles, durationMs: 2000 },
];

const TOTAL_DURATION = THINKING_STEPS.reduce((sum, s) => sum + s.durationMs, 0);

const ThinkingIndicator = ({ label }: Props) => {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number>();

  useEffect(() => {
    startRef.current = Date.now();
    const tick = () => {
      const now = Date.now();
      setElapsed(now - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Determine which step we're on
  let cumulative = 0;
  let activeStepIdx = 0;
  for (let i = 0; i < THINKING_STEPS.length; i++) {
    cumulative += THINKING_STEPS[i].durationMs;
    if (elapsed < cumulative) {
      activeStepIdx = i;
      break;
    }
    if (i === THINKING_STEPS.length - 1) {
      activeStepIdx = i;
    }
  }

  // Progress: asymptotic so it never quite reaches 100% until done
  const rawProgress = Math.min(elapsed / TOTAL_DURATION, 1);
  // Ease-out so it slows down as it approaches the end
  const progress = rawProgress < 0.9
    ? rawProgress
    : 0.9 + (rawProgress - 0.9) * 0.3; // slows down after 90%
  const progressPercent = Math.min(Math.round(progress * 100), 95);

  // Use backend label if it's more specific than generic
  const isGenericLabel = !label || label === "Traitement en cours..." || label === "Initialisation...";
  const activeStep = THINKING_STEPS[activeStepIdx];
  const displayLabel = isGenericLabel ? activeStep.label : label;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mx-4 mb-3"
    >
      <div className="border border-border bg-muted/30 p-4">
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-1 bg-border/50 overflow-hidden">
            <motion.div
              className="h-full bg-foreground"
              initial={{ width: "0%" }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3, ease: "linear" }}
            />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground tabular-nums w-8 text-right">
            {progressPercent}%
          </span>
        </div>

        {/* Steps */}
        <div className="space-y-1.5">
          {THINKING_STEPS.map((step, i) => {
            const isActive = i === activeStepIdx;
            const isDone = i < activeStepIdx;
            const isPending = i > activeStepIdx;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{
                  opacity: isPending ? 0.3 : 1,
                  x: 0,
                }}
                transition={{ delay: i * 0.08, duration: 0.2 }}
                className="flex items-center gap-2.5"
              >
                {/* Icon */}
                <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                  {isDone ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <Check className="h-3.5 w-3.5 text-foreground" />
                    </motion.div>
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Icon className="h-3.5 w-3.5 text-foreground" />
                    </motion.div>
                  ) : (
                    <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-xs font-medium transition-colors ${
                    isActive
                      ? "text-foreground"
                      : isDone
                      ? "text-muted-foreground"
                      : "text-muted-foreground/40"
                  }`}
                >
                  {isActive ? displayLabel : step.label}
                </span>

                {/* Active pulse */}
                {isActive && (
                  <motion.div
                    className="h-1 w-1 bg-foreground rounded-full"
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default ThinkingIndicator;
