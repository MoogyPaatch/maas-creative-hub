import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { WORKFLOW_STEPS, type WorkflowStep } from "@/types";
import type { PipelineStep } from "@/types";

interface Props {
  pipeline: PipelineStep[];
  currentStep: string;
  onStepClick?: (step: WorkflowStep) => void;
}

const WorkflowStepper = ({ pipeline, currentStep, onStepClick }: Props) => {
  const getStatus = (key: string) => {
    const found = pipeline.find((p) => p.step === key);
    return found?.status || "pending";
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
      {WORKFLOW_STEPS.map((step, i) => {
        const status = getStatus(step.key);
        const isCurrent = step.key === currentStep;
        const isCompleted = status === "completed";
        const isPending = status === "pending";

        return (
          <div key={step.key} className="flex items-center">
            {i > 0 && (
              <div
                className={`mx-1 h-px w-6 transition-colors ${
                  isCompleted ? "bg-success" : "bg-border"
                }`}
              />
            )}
            <button
              onClick={() => onStepClick?.(step.key)}
              disabled={isPending}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                isCurrent
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : isCompleted
                  ? "bg-success/10 text-success hover:bg-success/20 cursor-pointer"
                  : status === "validation_pending"
                  ? "bg-warning/10 text-warning"
                  : "text-muted-foreground cursor-default"
              }`}
            >
              {isCompleted && <Check className="h-3 w-3" />}
              {isCurrent && (
                <motion.div
                  className="h-1.5 w-1.5 rounded-full bg-primary-foreground"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              {step.label}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default WorkflowStepper;
