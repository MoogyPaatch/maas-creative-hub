import { motion } from "framer-motion";
import { Check, FileText, Palette, Film, Rocket, Lightbulb, PenTool, Image, Video, AudioLines } from "lucide-react";
import { WORKFLOW_STEPS, CLIENT_WORKFLOW_STEPS, type WorkflowStep } from "@/types";
import type { PipelineStep } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  pipeline: PipelineStep[];
  currentStep: string;
  onStepClick?: (step: WorkflowStep) => void;
  isClientView?: boolean;
}

const STEP_ICONS: Record<string, React.ElementType> = {
  commercial: FileText,
  planner: Lightbulb,
  dc_visual: Palette,
  dc_copy: PenTool,
  ppm: Film,
  prod_image: Image,
  prod_video: Video,
  prod_audio: AudioLines,
  delivered: Rocket,
};

const WorkflowStepper = ({ pipeline, currentStep, onStepClick, isClientView = false }: Props) => {
  const steps = isClientView ? CLIENT_WORKFLOW_STEPS : WORKFLOW_STEPS;

  const getStatus = (key: string) => {
    const found = pipeline.find((p) => p.step === key);
    return found?.status || "pending";
  };

  // For client view, map internal steps to simplified ones
  const getClientStepStatus = (key: string) => {
    if (!isClientView) return getStatus(key);
    // For client: dc_visual maps to dc_visual + dc_copy; ppm maps to ppm
    if (key === "dc_visual") {
      const vis = getStatus("dc_visual");
      const copy = getStatus("dc_copy");
      if (vis === "completed" && copy === "completed") return "completed";
      if (vis !== "pending" || copy !== "pending") return "in_progress";
      return "pending";
    }
    return getStatus(key);
  };

  const currentIdx = steps.findIndex((s) => s.key === currentStep);
  // For client view, find the nearest simplified step
  const effectiveIdx = isClientView
    ? steps.reduce((best, s, i) => {
        const allStepsIdx = WORKFLOW_STEPS.findIndex((ws) => ws.key === currentStep);
        const thisIdx = WORKFLOW_STEPS.findIndex((ws) => ws.key === s.key);
        return thisIdx <= allStepsIdx ? i : best;
      }, 0)
    : currentIdx;

  return (
    <TooltipProvider delayDuration={200}>
      <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-thin" aria-label="Étapes du workflow">
        {steps.map((step, i) => {
          const status = getClientStepStatus(step.key);
          const isCurrent = i === effectiveIdx;
          const isCompleted = status === "completed";
          const isPending = status === "pending";
          const Icon = STEP_ICONS[step.key] || FileText;

          return (
            <div key={step.key} className="flex items-center">
              {i > 0 && (
                <motion.div
                  className="mx-0.5 h-px w-3 lg:w-5"
                  initial={false}
                  animate={{
                    backgroundColor: i <= effectiveIdx
                      ? "hsl(var(--success))"
                      : "hsl(var(--border))",
                  }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                />
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onStepClick?.(step.key)}
                    disabled={isPending && !isClientView}
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] lg:text-xs font-medium transition-all whitespace-nowrap ${
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                        : isCompleted
                        ? "bg-success/10 text-success hover:bg-success/20 cursor-pointer"
                        : status === "validation_pending"
                        ? "bg-warning/10 text-warning animate-pulse"
                        : "text-muted-foreground cursor-default opacity-50"
                    }`}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={`${step.label} — ${isCurrent ? "en cours" : isCompleted ? "terminé" : "à venir"}`}
                  >
                    {isCompleted && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
                        <Check className="h-3 w-3" />
                      </motion.div>
                    )}
                    {isCurrent && (
                      <motion.div
                        className="h-1.5 w-1.5 rounded-full bg-primary-foreground"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                    {!isCurrent && !isCompleted && <Icon className="h-3 w-3" />}
                    {step.shortLabel}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {step.label}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </nav>
    </TooltipProvider>
  );
};

export default WorkflowStepper;
