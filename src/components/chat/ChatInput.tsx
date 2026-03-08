import { useState, useRef, forwardRef } from "react";
import { Send, Paperclip, Upload, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onSend: (message: string) => void;
  onAttach?: (files: FileList) => void;
  disabled?: boolean;
}

const ChatInput = forwardRef<HTMLDivElement, Props>(({ onSend, onAttach, disabled }, ref) => {
  const [value, setValue] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed && pendingFiles.length === 0) return;
    if (disabled) return;

    // If we have files, send them first
    if (pendingFiles.length > 0 && onAttach) {
      const dt = new DataTransfer();
      pendingFiles.forEach((f) => dt.items.add(f));
      onAttach(dt.files);
      setPendingFiles([]);
    }

    if (trimmed) {
      onSend(trimmed);
      setValue("");
    }
    if (inputRef.current) inputRef.current.style.height = "auto";
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setPendingFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = "";
    }
  };

  const removeFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div ref={ref} className="border-t border-border bg-card p-4">
      {/* Pending files preview */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex flex-wrap gap-2"
          >
            {pendingFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs text-foreground"
              >
                <Upload className="h-3 w-3 text-muted-foreground" />
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(i)}
                  className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-border hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-3 rounded-xl border border-border bg-surface px-4 py-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
          aria-label="Joindre un fichier"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.svg,.mp4,.mov,.mp3,.wav"
          onChange={handleFileSelect}
        />
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre message..."
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          style={{ maxHeight: "120px" }}
          aria-label="Message"
          onInput={(e) => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = "auto";
            t.style.height = Math.min(t.scrollHeight, 120) + "px";
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || (!value.trim() && pendingFiles.length === 0)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-30 active:scale-95"
          aria-label="Envoyer"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
