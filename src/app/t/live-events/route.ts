import { NextRequest } from "next/server";
import { registerLiveClient, LiveEventPayload } from "@/lib/sseBroadcaster";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  let unregister: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection ACK
      const initData = `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(initData));

      // Register client for live events
      unregister = registerLiveClient((event: LiveEventPayload) => {
        try {
          const chunk = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Stream closed
        }
      });
    },
    cancel() {
      if (unregister) {
        unregister();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
