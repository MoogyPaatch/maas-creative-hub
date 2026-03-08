import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

interface Props {
  content: string;
}

const CreativeBrief = ({ content }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="h-full overflow-y-auto p-8 scrollbar-thin"
  >
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Brief Créatif Stratégique</h2>
          <p className="text-xs text-muted-foreground">Élaboré par le Planner Stratégique Marcel</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-8 prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  </motion.div>
);

export default CreativeBrief;
