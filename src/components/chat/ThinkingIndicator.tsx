import { motion } from "framer-motion";
import { Loader2, Palette, FileText, Sparkles, Clapperboard, ImageIcon, Video, Music, CheckCircle2 } from "lucide-react";
import type { ThinkingEvent } from "@/lib/sse";

interface Props {
  /** Current thinking event from SSE (structured) */
  thinkingState: ThinkingState | null;
}

/** Accumulated thinking state for the current agent phase */
export interface ThinkingState {
  /** Stable agent display name (e.g., "Planner Strategique") */
  agentName: string;
  /** Current progress 0-100 (monotonically increasing) */
  progress: number;
  /** Ordered list of completed + current tasks */
  tasks: ThinkingTask[];
  /** Total tasks expected for this phase */
  taskTotal: number;
}

export interface ThinkingTask {
  label: string;
  status: "done" | "active";
}

// Map agent names to icons
const AGENT_ICON_MAP: Array<{ pattern: RegExp; icon: React.ElementType }> = [
  { pattern: /planner|strat/i, icon: Sparkles },
  { pattern: /dc.*visual|direction cr/i, icon: Palette },
  { pattern: /dc.*copy|copy/i, icon: FileText },
  { pattern: /ppm|pr.*production/i, icon: Clapperboard },
  { pattern: /prod.*image|image/i, icon: ImageIcon },
  { pattern: /prod.*vid/i, icon: Video },
  { pattern: /prod.*audio|audio/i, icon: Music },
];

function getAgentIcon(agentName: string): React.ElementType {
  for (const { pattern, icon } of AGENT_ICON_MAP) {
    if (pattern.test(agentName)) return icon;
  }
  return Loader2;
}

/**
 * Accumulate a new ThinkingEvent into the current ThinkingState.
 * Ensures:
 *  - Progress only goes forward (monotonic)
 *  - Agent name changes reset the task list (new phase)
 *  - Previous tasks are marked as "done", current as "active"
 */
export function accumulateThinking(
  prev: ThinkingState | null,
  event: ThinkingEvent,
): ThinkingState {
  const agentName = event.agentName || "Traitement";
  const progress = event.progress || 0;

  // No previous state — start fresh
  if (!prev) {
    return {
      agentName,
      progress,
      taskTotal: event.taskTotal || 0,
      tasks: [{ label: event.label, status: "active" }],
    };
  }

  // Agent changed — new task list but KEEP max progress (globally monotonic)
  if (prev.agentName !== agentName) {
    return {
      agentName,
      progress: Math.max(prev.progress, progress),
      taskTotal: event.taskTotal || 0,
      tasks: [{ label: event.label, status: "active" }],
    };
  }

  // Same agent: enforce monotonic progress
  const newProgress = Math.max(prev.progress, progress);

  // Build updated task list: mark previous active as done, add new if different
  const tasks = [...prev.tasks];
  const lastTask = tasks[tasks.length - 1];

  if (lastTask && lastTask.label !== event.label) {
    // Mark previous task as done
    lastTask.status = "done";
    // Add new active task
    tasks.push({ label: event.label, status: "active" });
  }
  // If same label, just keep it active (no duplicate)

  return {
    agentName,
    progress: newProgress,
    taskTotal: Math.max(prev.taskTotal, event.taskTotal || 0),
    tasks,
  };
}

const ThinkingIndicator = ({ thinkingState }: Props) => {
  if (!thinkingState) return null;

  const { agentName, progress, tasks } = thinkingState;
  const Icon = getAgentIcon(agentName);
  const isGenericIcon = Icon === Loader2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mx-4 mb-3"
    >
      <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/5">
        {/* Agent header - STATIC */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <div className="relative">
            <Icon className={`h-4 w-4 text-primary shrink-0 ${isGenericIcon ? "animate-spin" : ""}`} />
            {!isGenericIcon && (
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20"
                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-primary">
              {agentName}
            </span>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
            {progress}%
          </span>
        </div>

        {/* Progress bar - monotonically increasing */}
        <div className="mx-4 mb-2 h-1 rounded-full bg-primary/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary/60"
            initial={false}
            animate={{ width: `${Math.max(progress, 3)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        {/* Task list */}
        {tasks.length > 0 && (
          <div className="px-4 pb-3 space-y-0.5">
            {tasks.map((task, i) => (
              <div
                key={`${i}-${task.label}`}
                className="flex items-center gap-2"
              >
                {task.status === "done" ? (
                  <CheckCircle2 className="h-3 w-3 text-primary/50 shrink-0" />
                ) : (
                  <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
                )}
                <span
                  className={`text-[11px] truncate ${
                    task.status === "done"
                      ? "text-muted-foreground line-through"
                      : "text-foreground font-medium"
                  }`}
                >
                  {task.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ThinkingIndicator;
