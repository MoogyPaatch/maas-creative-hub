import type { ChatMessage, QuickReply, ClientBriefDraft } from "@/types";

export async function parseSSEStream(
  stream: ReadableStream<Uint8Array>,
  onMessage: (msg: ChatMessage) => void,
  onDone?: () => void,
  onThinking?: (label: string) => void,
  onBriefDraft?: (draft: Partial<ClientBriefDraft>) => void
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

            // Thinking indicator
            if (data.role === "thinking" && onThinking) {
              onThinking(data.content || "Traitement en cours...");
              continue;
            }

            // Status update with phase_label → route to thinking indicator
            if (data.metadata?.type === "status_update" && data.metadata?.status === "working" && data.metadata?.phase_label) {
              onThinking?.(data.metadata.phase_label);
              continue;
            }

            // Client brief draft → update brief panel in real-time
            if (data.metadata?.type === "client_brief_draft" && data.metadata?.brief_draft) {
              onBriefDraft?.(data.metadata.brief_draft);
              // Also emit as a regular message if there's content
              if (!data.content) continue;
            }

            if (data.role !== "thinking") {
              const role: ChatMessage["role"] =
                data.role === "user" || data.role === "system" ? data.role : "agent";

              const quickReplies: QuickReply[] | undefined = data.quick_replies?.map(
                (qr: any) => ({ id: qr.id, label: qr.label })
              );

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
