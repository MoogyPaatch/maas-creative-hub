import type { ChatMessage, QuickReply, ClientBriefDraft } from "@/types";

export interface SSECallbacks {
  onMessage: (msg: ChatMessage) => void;
  onDone?: () => void;
  onThinking?: (label: string) => void;
  onBriefDraft?: (draft: Partial<ClientBriefDraft>) => void;
  onActionRequired?: (action: string, options?: string[], validationData?: any) => void;
  onTimeout?: () => void;
}

export async function parseSSEStream(
  stream: ReadableStream<Uint8Array>,
  onMessage: (msg: ChatMessage) => void,
  onDone?: () => void,
  onThinking?: (label: string) => void,
  onBriefDraft?: (draft: Partial<ClientBriefDraft>) => void,
  onActionRequired?: (action: string, options?: string[], validationData?: any) => void,
  onTimeout?: () => void
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let messageCount = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));

            // Workflow timeout
            if (data.role === "system" && data.content === "workflow_timeout") {
              onTimeout?.();
              continue;
            }

            // Thinking indicator
            if (data.role === "thinking" && onThinking) {
              onThinking(data.content || "Traitement en cours...");
              continue;
            }

            // Status update → route to thinking or let completed fall through
            if (data.metadata?.type === "status_update") {
              if (data.metadata?.status === "working" && data.metadata?.phase_label) {
                onThinking?.(data.metadata.phase_label);
                continue;
              }
              if (data.metadata?.status === "completed") {
                // Let completed status_update fall through to normal message handling
              }
            }

            // action_required → handle user choices/validation
            if (data.metadata?.type === "action_required") {
              onActionRequired?.(
                data.metadata.action,
                data.metadata.options,
                data.metadata.validation_data
              );
              const quickReplies: QuickReply[] = data.metadata.options?.map((option: string, idx: number) => ({
                id: `action_${idx}`,
                label: option
              })) || [];
              
              onMessage({
                role: "agent",
                content: data.content || data.metadata.message || "",
                quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
                metadata: data.metadata,
                timestamp: new Date(),
              });
              messageCount++;
              continue;
            }

            if (data.role !== "thinking") {
              const role: ChatMessage["role"] =
                data.role === "user" || data.role === "system" ? data.role : "agent";

              const quickReplies: QuickReply[] | undefined = data.quick_replies?.map(
                (qr: any) => ({ id: qr.id, label: qr.label })
              );

              // Check for brief draft in metadata
              if (data.metadata?.type === "client_brief_draft" && data.metadata?.brief_draft) {
                onBriefDraft?.(data.metadata.brief_draft);
                if (!data.content) continue;
              }

              onMessage({
                role,
                content: data.content || "",
                quickReplies,
                metadata: data.metadata || undefined,
                timestamp: new Date(),
              });
              messageCount++;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
    if (messageCount === 0) {
      onMessage({
        role: "agent",
        content: "La connexion a été interrompue. Veuillez renvoyer votre message.",
        timestamp: new Date(),
      });
    }
    onDone?.();
  }
}
