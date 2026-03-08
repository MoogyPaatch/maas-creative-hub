import { motion } from "framer-motion";

interface Props {
  label: string;
}

const ThinkingIndicator = ({ label }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -5 }}
    className="flex items-center gap-3 px-4 py-3"
  >
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-primary"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
    <span className="text-xs text-muted-foreground">{label}</span>
  </motion.div>
);

export default ThinkingIndicator;
