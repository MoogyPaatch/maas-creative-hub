import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { FileText, Pencil, Check, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  content: string;
  onContentChange?: (newContent: string) => void;
}

const CreativeBrief = ({ content, onContentChange }: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  const startEdit = useCallback(() => {
    setDraft(content);
    setEditing(true);
  }, [content]);

  const save = useCallback(() => {
    onContentChange?.(draft);
    setEditing(false);
  }, [draft, onContentChange]);

  const cancel = useCallback(() => {
    setDraft(content);
    setEditing(false);
  }, [content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full overflow-y-auto p-8 scrollbar-thin"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Brief Client</h2>
              <p className="text-xs text-muted-foreground">Modifiable par le client</p>
            </div>
          </div>

          {!editing && onContentChange && (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </button>
          )}

          {editing && (
            <div className="flex items-center gap-2">
              <button
                onClick={cancel}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Annuler
              </button>
              <button
                onClick={save}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Check className="h-3.5 w-3.5" />
                Enregistrer
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[500px] rounded-xl border-border bg-card p-6 font-mono text-sm leading-relaxed text-foreground"
          />
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CreativeBrief;
