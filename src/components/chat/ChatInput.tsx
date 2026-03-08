import { useState, useRef, forwardRef } from "react";
import { Send, Paperclip } from "lucide-react";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = forwardRef<HTMLDivElement, Props>(({ onSend, disabled }, ref) => {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div ref={ref} className="border-t border-border bg-card p-4">
      <div className="flex items-end gap-3 rounded-xl border border-border bg-surface px-4 py-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
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
          onInput={(e) => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = "auto";
            t.style.height = Math.min(t.scrollHeight, 120) + "px";
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-30 active:scale-95"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
