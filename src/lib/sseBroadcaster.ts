// Lightweight in-memory SSE Broadcaster for real-time live events

export interface LiveEventPayload {
  type: "upvote" | "launch_drop" | "new_product" | "comment";
  productId?: string;
  hasUpvoted?: boolean;
  upvotesCount?: number;
  userId?: string;
  timestamp: string;
  data?: any;
}

type ClientWriter = (event: LiveEventPayload) => void;

const clients = new Set<ClientWriter>();

export function registerLiveClient(writer: ClientWriter): () => void {
  clients.add(writer);
  return () => {
    clients.delete(writer);
  };
}

export function broadcastLiveEvent(payload: Omit<LiveEventPayload, "timestamp">) {
  const fullPayload: LiveEventPayload = {
    ...payload,
    timestamp: new Date().toISOString(),
  };

  for (const client of clients) {
    try {
      client(fullPayload);
    } catch {
      clients.delete(client);
    }
  }
}
