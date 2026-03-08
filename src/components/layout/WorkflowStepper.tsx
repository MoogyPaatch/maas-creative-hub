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

  const getClientStepStatus = (key: string) => {
    if (!isClientView) return getStatus(key);
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
  const effectiveIdx = isClientView
    ? steps.reduce((best, s, i) => {
        const allStepsIdx = WORKFLOW_STEPS.findIndex((ws) => ws.key === currentStep);
        const thisIdx = WORKFLOW_STEPS.findIndex((ws) => ws.key === s.key);
        return thisIdx <= allStepsIdx ? i : best;
      }, 0)
    : currentIdx;

  return (
    <TooltipProvider delayDuration={200}>
      <nav className="flex items-center gap-1 overflow-x-auto scrollbar-thin" aria-label="Pipeline">
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
                      ? "hsl(var(--foreground))"
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
                    className={`flex items-center gap-1 px-2 py-1 text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                      isCurrent
                        ? "bg-foreground text-background"
                        : isCompleted
                        ? "text-foreground hover:bg-secondary cursor-pointer"
                        : status === "validation_pending"
                        ? "text-accent animate-pulse"
                        : "text-muted-foreground/40 cursor-default"
                    }`}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {isCompleted && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
                        <Check className="h-3 w-3" />
                      </motion.div>
                    )}
                    {isCurrent && (
                      <motion.div
                        className="h-1.5 w-1.5 bg-background"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                    {!isCurrent && !isCompleted && <Icon className="h-3 w-3" />}
                    {step.shortLabel}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs font-medium">
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
