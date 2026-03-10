import { motion } from "framer-motion";
import { Loader2, Palette, Video, Music, FileText, Sparkles, Clapperboard, ImageIcon } from "lucide-react";

interface Props {
  label: string;
}

// Map known agent/phase keywords to icons and display names
const AGENT_ICONS: Array<{ pattern: RegExp; icon: React.ElementType; name: string }> = [
  { pattern: /dc\s*visual|moodboard|mockup|piste|direction/i, icon: Palette, name: "DC Visual" },
  { pattern: /dc\s*copy|headline|body\s*copy|script/i, icon: FileText, name: "DC Copy" },
  { pattern: /ppm|pre.?production|storyboard|casting/i, icon: Clapperboard, name: "PPM" },
  { pattern: /prod.*image|image.*prod|generat.*image/i, icon: ImageIcon, name: "Prod Image" },
  { pattern: /prod.*video|video.*prod|montage/i, icon: Video, name: "Prod Video" },
  { pattern: /prod.*audio|audio.*prod|voix/i, icon: Music, name: "Prod Audio" },
  { pattern: /planner|brief.*creatif|analyse/i, icon: Sparkles, name: "Planner" },
];

function detectAgent(label: string): { icon: React.ElementType; name: string } | null {
  for (const { pattern, icon, name } of AGENT_ICONS) {
    if (pattern.test(label)) return { icon, name };
  }
  return null;
}

const ThinkingIndicator = ({ label }: Props) => {
  const agent = detectAgent(label);
  const Icon = agent?.icon || Loader2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mx-4 mb-3"
    >
      <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/5">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative">
            <Icon className={`h-4 w-4 text-primary shrink-0 ${agent ? "" : "animate-spin"}`} />
            {agent && (
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20"
                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {agent && (
              <span className="block text-[10px] font-bold uppercase tracking-wider text-primary">
                {agent.name}
              </span>
            )}
            <span className="block text-xs font-medium text-foreground truncate">{label}</span>
          </div>
        </div>
        {/* Animated progress bar */}
        <div className="h-0.5 w-full bg-primary/10">
          <motion.div
            className="h-full bg-primary/40"
            initial={{ width: "0%" }}
            animate={{ width: ["0%", "70%", "30%", "90%", "50%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ThinkingIndicator;
