import { motion } from "framer-motion";
import { Check, FileText, Palette, Film, Rocket, Lightbulb, PenTool, Image, Video, AudioLines } from "lucide-react";
import { WORKFLOW_STEPS, type WorkflowStep } from "@/types";
import type { PipelineStep } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  pipeline: PipelineStep[];
  currentStep: string;
  onStepClick?: (step: WorkflowStep) => void;
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

const WorkflowStepper = ({ pipeline, currentStep, onStepClick }: Props) => {
  const getStatus = (key: string) => {
    const found = pipeline.find((p) => p.step === key);
    return found?.status || "pending";
  };

  const currentIdx = WORKFLOW_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <TooltipProvider delayDuration={200}>
      <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-thin" aria-label="Étapes du workflow">
        {WORKFLOW_STEPS.map((step, i) => {
          const status = getStatus(step.key);
          const isCurrent = step.key === currentStep;
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
                    backgroundColor: i <= currentIdx
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
                    disabled={isPending}
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] lg:text-xs font-medium transition-all whitespace-nowrap ${
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                        : isCompleted
                        ? "bg-success/10 text-success hover:bg-success/20 cursor-pointer"
                        : status === "validation_pending"
                        ? "bg-warning/10 text-warning"
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
