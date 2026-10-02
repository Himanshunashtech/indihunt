"use client";

import React, { createContext, useContext, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";

interface WebSocketContextType {
  subscribe: (room: string, eventName: string, callback: (data: any) => void) => () => void;
  publish: (room: string, eventName: string, data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  // Map of room name -> channel entry
  const channelsRef = useRef<
    Map<
      string,
      {
        supabaseChannel?: any;
        broadcastChannel?: BroadcastChannel;
        refCount: number;
      }
    >
  >(new Map());

  // Map of "room:event" -> Set of callbacks
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  const subscribe = useCallback((room: string, eventName: string, callback: (data: any) => void) => {
    const listenerKey = `${room}:${eventName}`;

    // Register the callback listener
    if (!listenersRef.current.has(listenerKey)) {
      listenersRef.current.set(listenerKey, new Set());
    }
    listenersRef.current.get(listenerKey)!.add(callback);

    // Setup the communication channel if it doesn't exist
    let roomEntry = channelsRef.current.get(room);
    if (!roomEntry) {
      roomEntry = { refCount: 0 };
      channelsRef.current.set(room, roomEntry);

      if (supabase) {
        // Use Supabase Realtime Broadcast Channels
        const channel = supabase.channel(room, {
          config: { broadcast: { self: false } },
        });

        channel.on("broadcast", { event: "*" }, (payload: any) => {
          const receivedEvent = payload.event;
          const data = payload.payload;
          const key = `${room}:${receivedEvent}`;
          const callbacks = listenersRef.current.get(key);
          if (callbacks) {
            callbacks.forEach((cb) => cb(data));
          }
        });

        channel.subscribe();

        roomEntry.supabaseChannel = channel;
      } else {
        // Fallback to native BroadcastChannel for local offline multi-tab dev
        if (typeof window !== "undefined") {
          try {
            const bc = new BroadcastChannel(room);
            bc.onmessage = (event) => {
              const { event: receivedEvent, data } = event.data;
              const key = `${room}:${receivedEvent}`;
              const callbacks = listenersRef.current.get(key);
              if (callbacks) {
                callbacks.forEach((cb) => cb(data));
              }
            };
            roomEntry.broadcastChannel = bc;
          } catch (err) {
            // silent catch
          }
        }
      }
    }

    roomEntry.refCount += 1;

    // Return the unsubscribe/cleanup function
    return () => {
      // Remove callback listener
      const callbacks = listenersRef.current.get(listenerKey);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          listenersRef.current.delete(listenerKey);
        }
      }

      // Close the channel if reference count drops to 0
      const currentEntry = channelsRef.current.get(room);
      if (currentEntry) {
        currentEntry.refCount -= 1;
        if (currentEntry.refCount <= 0) {
          if (currentEntry.supabaseChannel) {
            supabase?.removeChannel(currentEntry.supabaseChannel);
          }
          if (currentEntry.broadcastChannel) {
            currentEntry.broadcastChannel.close();
          }
          channelsRef.current.delete(room);
        }
      }
    };
  }, []);

  const publish = useCallback((room: string, eventName: string, data: any) => {
    const roomEntry = channelsRef.current.get(room);

    if (supabase) {
      if (roomEntry?.supabaseChannel) {
        // Use existing active subscription channel
        roomEntry.supabaseChannel.send({
          type: "broadcast",
          event: eventName,
          payload: data,
        });
      } else {
        // Transient channel for publishing only: subscribe, send, and cleanly remove
        const tempChannel = supabase.channel(room);
        tempChannel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            tempChannel.send({
              type: "broadcast",
              event: eventName,
              payload: data,
            }).finally(() => {
              supabase?.removeChannel(tempChannel);
            });
          }
        });
      }
    } else {
      // Publish event to local browser BroadcastChannel
      if (typeof window !== "undefined") {
        try {
          const bc =
            roomEntry?.broadcastChannel || new BroadcastChannel(room);
          bc.postMessage({ event: eventName, data });
          if (!roomEntry?.broadcastChannel) {
            bc.close();
          }
        } catch (err) {
          console.error("Failed to publish via BroadcastChannel:", err);
        }
      }
    }
  }, []);

  // Clean up all connections on unmount
  useEffect(() => {
    return () => {
      channelsRef.current.forEach((entry) => {
        if (entry.supabaseChannel) {
          supabase?.removeChannel(entry.supabaseChannel);
        }
        if (entry.broadcastChannel) {
          entry.broadcastChannel.close();
        }
      });
      channelsRef.current.clear();
      listenersRef.current.clear();
    };
  }, []);

  const value = useMemo(() => ({ subscribe, publish }), [subscribe, publish]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}

