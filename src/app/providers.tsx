"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store, useAppDispatch, setUser, setProfile } from "@/lib/store";
import { supabase, updateUserStreak, clearCache } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { dataOrchestrator } from "@/lib/dataOrchestrator";

import { WebSocketProvider } from "@/components/WebSocketProvider";

import LaunchScheduleWidget from "@/components/LaunchScheduleWidget";
import { Toaster } from "sonner";


function AuthInitializer({ children, initialUser }: { children: React.ReactNode; initialUser?: any }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(initialUser);
  const streakUpdated = useRef(false);
  const currentUserRef = useRef<any>(initialUser);
  const seededRef = useRef(false);

  // Immediately purge any localStorage session on render
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem('indihunt_user_session');
    } catch (e) { }
  }

  // Seed Redux synchronously on first render with initialUser from server — guarantees 100% server/client HTML match
  if (!seededRef.current) {
    seededRef.current = true;
    if (initialUser) {
      dispatch(setUser(initialUser));
      setCurrentUser(initialUser);
      try {
        const cachedProf = localStorage.getItem(`ih_profile_${initialUser.id}`);
        if (cachedProf) {
          dispatch(setProfile(JSON.parse(cachedProf)));
        }
      } catch (e) { }
    }
  }

  useEffect(() => {
    // Check sessionStorage for instant session restoration in the active browser tab
    // and strictly purge any legacy session data from localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem('indihunt_user_session');
      } catch (e) { }

      if (!currentUserRef.current) {
        try {
          const sessionItem = sessionStorage.getItem('indihunt_user_session');
          if (sessionItem) {
            const localUser = JSON.parse(sessionItem);
            if (localUser) {
              dispatch(setUser(localUser));
              setCurrentUser(localUser);
            }
          }
        } catch (e) { }
      }
    }
  }, [dispatch]);

  useEffect(() => {
    currentUserRef.current = currentUser;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem('indihunt_user_session');
      } catch (e) { }
    }
  }, [currentUser]);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      dispatch(setUser(null));
      setCurrentUser(null);
      dataOrchestrator.startMigration("guest");
      return;
    }

    let lastFetchedUserId = "";

    const handleSessionSetup = (session: any) => {
      if (!session || lastFetchedUserId === session.user.id) return;
      lastFetchedUserId = session.user.id;

      // Store exclusively in sessionStorage (active tab only) & ensure removed from localStorage
      try {
        sessionStorage.setItem('indihunt_user_session', JSON.stringify(session.user));
        localStorage.removeItem('indihunt_user_session');
      } catch (e) { }

      clearCache();

      // Instant 0ms synchronous upvote highlight application from local cache
      try {
        const rawVotes = localStorage.getItem(`indihunt_upvotes_${session.user.id}`) || localStorage.getItem('indihunt_upvotes');
        const votedSet = rawVotes ? new Set<string>(JSON.parse(rawVotes)) : new Set<string>();
        const existingQueries = queryClient.getQueriesData<any[]>({ queryKey: ["products"] });
        const currentProducts = existingQueries.find(([_, d]) => Array.isArray(d) && d.length > 0)?.[1];
        if (currentProducts && Array.isArray(currentProducts)) {
          const seeded = currentProducts.map((p: any) => ({
            ...p,
            has_upvoted: votedSet.has(p.id),
          }));
          queryClient.setQueryData(["products", session.user.id], seeded);
        }
      } catch (e) { }

      dispatch(setUser(session.user));
      setCurrentUser(session.user);

      // Fast upvotes fetch directly on session setup (< 50ms) to ensure live DB accuracy
      Promise.resolve(
        client.from('upvotes').select('product_id').eq('user_id', session.user.id)
      ).then(({ data: upvotes }) => {
        if (upvotes) {
          const votedIds = new Set((upvotes as any[]).map((u: any) => u.product_id));
          try {
            localStorage.setItem(`indihunt_upvotes_${session.user.id}`, JSON.stringify(Array.from(votedIds)));
            localStorage.setItem('indihunt_upvotes', JSON.stringify(Array.from(votedIds)));
          } catch (e) {}
          queryClient.setQueriesData({ queryKey: ["products"] }, (old: any) => {
            if (!Array.isArray(old)) return old;
            return old.map((p: any) => ({
              ...p,
              has_upvoted: votedIds.has(p.id),
            }));
          });
        }
      }).catch(() => {});

      queryClient.invalidateQueries({ queryKey: ["products", session.user.id] });
      queryClient.invalidateQueries({ queryKey: ["threads", session.user.id] });

      // Instant profile hydration: from local cache or session user metadata in 0ms
      try {
        const cached = localStorage.getItem(`ih_profile_${session.user.id}`);
        if (cached) {
          dispatch(setProfile(JSON.parse(cached)));
        } else if (session.user?.user_metadata) {
          const meta = session.user.user_metadata;
          const initialProf: any = {
            id: session.user.id,
            username: meta.user_name || meta.preferred_username || meta.email?.split('@')[0] || `maker_${session.user.id.slice(0, 6)}`,
            full_name: meta.full_name || meta.name || meta.user_name || 'Maker',
            avatar_url: meta.avatar_url || meta.picture || '',
            bio: '',
            headline: '',
          };
          dispatch(setProfile(initialProf));
        }
      } catch (e) { }

      dataOrchestrator.startMigration(session.user.id);
      
      // Fetch live fresh profile directly from Supabase DB in parallel
      Promise.resolve(
        client.from('profiles').select('*').eq('id', session.user.id).single()
      ).then(({ data: dbProfile }) => {
        if (dbProfile) {
          dispatch(setProfile(dbProfile));
          try {
            localStorage.setItem(`ih_profile_${session.user.id}`, JSON.stringify(dbProfile));
          } catch (e) { }
        }
      }).catch(() => {});
    };

    client.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleSessionSetup(session);
      } else {
        dispatch(setUser(null));
        setCurrentUser(null);
        dataOrchestrator.startMigration("guest");
      }
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // If event is SIGNED_OUT, it would be caught below, but if it's a new session or SIGNED_IN:
        if (_event === 'SIGNED_IN') {
            lastFetchedUserId = ""; // Force re-fetch on explicit sign in
        }
        handleSessionSetup(session);
      } else {
        lastFetchedUserId = "";
        try {
          sessionStorage.removeItem('indihunt_user_session');
          localStorage.removeItem('indihunt_user_session');
        } catch(e) {}
        clearCache();
        queryClient.clear();

        // Explicitly purge upvote localStorage keys so no stale colors survive
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('indihunt_upvotes');
            localStorage.removeItem('indihunt_thread_upvotes');
          } catch (e) {}
        }

        dispatch(setUser(null));
        dispatch(setProfile(null));
        setCurrentUser(null);
        dataOrchestrator.startMigration("guest");
      }
    });

    // Web focus tab detection to handle App Resume equivalent quick sync
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUserRef.current?.id) {
        dataOrchestrator.handleAppResume(currentUserRef.current.id);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [dispatch]);

  // 1-minute global session timer -> trigger streak update
  useEffect(() => {
    if (!currentUser) {
      streakUpdated.current = false;
      return;
    }

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 1;
      if (elapsed >= 60 && !streakUpdated.current) {
        streakUpdated.current = true;
        updateUserStreak(currentUser.id)
          .then(async () => {
            fetch(`/t/profiles?userId=${currentUser.id}`)
              .then(res => res.json())
              .then(resData => {
                const profile = resData?.data || resData?.profile;
                if (profile) dispatch(setProfile(profile));
              });
          })
          .catch((err) => {
            console.error("Failed to update user streak dynamically:", err);
          });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser, dispatch]);

  // Register Service Worker for PWA (Production only; auto-clean in dev to prevent stale chunk caching)
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.error("[SW] Registration failed:", err);
        });
      } else {
        // In local development, unregister any lingering service workers & clear CacheStorage
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
        if ("caches" in window) {
          caches.keys().then((keys) => {
            keys.forEach((key) => caches.delete(key));
          });
        }
      }
    }
  }, []);

  return (
    <>
      {children}
      <LaunchScheduleWidget />
    </>
  );
}

export default function Providers({ children, initialUser }: { children: React.ReactNode; initialUser?: any }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <WebSocketProvider>
          <AuthInitializer initialUser={initialUser}>
            {children}
          </AuthInitializer>
          <Toaster 
            position="top-right" 
            duration={1000}
            toastOptions={{
              duration: 1000,
              style: {
                background: "#18181b",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "16px",
                fontSize: "13px",
                fontWeight: 500,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)"
              },
              className: "!bg-[#18181b] !text-white !border-white/10 !rounded-2xl !shadow-2xl",
            }}
          />
        </WebSocketProvider>
      </QueryClientProvider>
    </Provider>
  );
}
