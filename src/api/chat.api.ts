import { BASE_URL, fetchWithAuth, request } from './client';

export type StreamMessageType =
  | { type: 'ai'; payload: { text: string } }
  | {
      type: 'toolCall:start';
      payload: { name: string; args: Record<string, unknown> };
    }
  | { type: 'tool'; payload: { name: string; result: Record<string, unknown> } }
  | { type: 'error'; payload: { text: string } };

export interface ChatMessage {
  id: number;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ThreadSummary {
  threadId: string;
  title: string | null;
  messageCount: number;
  lastMessageAt: string;
  preview: string;
}

interface ChatStreamCallbacks {
  onMessage: (msg: StreamMessageType) => void;
  onError?: (err: Error) => void;
  onDone?: () => void;
}

export function streamChat(
  query: string,
  threadId: string,
  callbacks: ChatStreamCallbacks,
): () => void {
  let isCancelled = false;

  (async () => {
    try {
      // fetchWithAuth handles 401 → refresh → retry automatically,
      // so the stream always starts with a valid token.
      const res = await fetchWithAuth(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, threadId }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!isCancelled) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        let pendingData = '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            pendingData = line.slice(6);
          } else if (line === '' && pendingData) {
            try {
              const parsed = JSON.parse(pendingData) as StreamMessageType;
              if (parsed.type) callbacks.onMessage(parsed);
            } catch {
              void 0;
            }
            pendingData = '';
          }
        }
      }

      callbacks.onDone?.();
    } catch (err) {
      if (!isCancelled)
        callbacks.onError?.(
          err instanceof Error ? err : new Error(String(err)),
        );
    }
  })();

  return () => {
    isCancelled = true;
  };
}

export const chatApi = {
  getHistory: async (threadId?: string, limit = 50) => {
    const params = new URLSearchParams();
    if (threadId) params.set('threadId', threadId);
    params.set('limit', String(limit));
    const res = await fetchWithAuth(`${BASE_URL}/chat/history?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  deleteHistory: async (threadId?: string) => {
    const params = new URLSearchParams();
    if (threadId) params.set('threadId', threadId);
    const res = await fetchWithAuth(`${BASE_URL}/chat/history?${params}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  listThreads: async () => {
    return request<ThreadSummary[]>('/chat/threads');
  },
};
