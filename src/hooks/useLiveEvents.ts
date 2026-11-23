"use client";

import { useEffect, useRef } from "react";
import { LiveEventPayload } from "@/lib/sseBroadcaster";

export function useLiveEvents(onEvent?: (event: LiveEventPayload) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return;

    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    function connect() {
      try {
        eventSource = new EventSource("/t/live-events");

        eventSource.onmessage = (event) => {
          try {
            const data: LiveEventPayload = JSON.parse(event.data);
            if (data && data.type !== ("connected" as any)) {
              if (onEventRef.current) {
                onEventRef.current(data);
              }
            }
          } catch {}
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Reconnect with backoff
          retryTimeout = setTimeout(connect, 5000);
        };
      } catch {}
    }

    connect();

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (eventSource) eventSource.close();
    };
  }, []);
}
