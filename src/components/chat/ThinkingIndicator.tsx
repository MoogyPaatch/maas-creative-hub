import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface Props {
  label: string;
}

const ThinkingIndicator = ({ label }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mx-4 mb-3"
    >
      <div className="flex items-center gap-3 border border-border bg-muted/30 px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-foreground">{label}</span>
      </div>
    </motion.div>
  );
};

export default ThinkingIndicator;
