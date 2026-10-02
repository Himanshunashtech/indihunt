"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store, useAppDispatch, setUser, setProfile } from "@/lib/store";
import { supabase, updateUserStreak, clearCache, getCachedProducts, getUserProfile, getUserUpvotedProductIds } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { dataOrchestrator } from "@/lib/dataOrchestrator";

import { WebSocketProvider } from "@/components/WebSocketProvider";

import LaunchScheduleWidget from "@/components/LaunchScheduleWidget";
import { Toaster } from "sonner";


function AuthInitializer({ children, initialUser }: { children: React.ReactNode; initialUser?: any }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(() => initialUser || null);
  const streakUpdated = useRef(false);
  const currentUserRef = useRef<any>(initialUser);

  // Initial client hydration for profile and cached products on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem('indihunt_user_session');
      } catch (e) { }

      if (initialUser) {
        dispatch(setUser(initialUser));
        try {
          const cachedProf = localStorage.getItem(`ih_profile_${initialUser.id}`);
          if (cachedProf) {
            dispatch(setProfile(JSON.parse(cachedProf)));
          }
        } catch (e) { }
      }

      try {
        const cachedProducts = getCachedProducts();
        if (cachedProducts && cachedProducts.length > 0) {
          queryClient.setQueryData(['products', 'guest'], cachedProducts);
          queryClient.setQueryData(['products', undefined], cachedProducts);
        }
      } catch (e) { }
    }
  }, [dispatch, initialUser]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      dispatch(setUser(null));
      setCurrentUser(null);
      return;
    }

    let lastFetchedUserId = "";

    const handleSessionSetup = (session: any) => {
      if (!session || lastFetchedUserId === session.user.id) return;
      lastFetchedUserId = session.user.id;

      try {
        sessionStorage.setItem('indihunt_user_session', JSON.stringify(session.user));
        localStorage.removeItem('indihunt_user_session');
      } catch (e) { }

      dispatch(setUser(session.user));
      setCurrentUser(session.user);

      // Instant profile hydration: from local cache or session user metadata in 0ms
      try {
        const cached = localStorage.getItem(`ih_profile_${session.user.id}`) || localStorage.getItem('indihunt_profile');
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

      // Fetch latest profile from DB asynchronously to keep state and cache accurate
      getUserProfile(session.user.id)
        .then((realProfile) => {
          if (realProfile) {
            dispatch(setProfile(realProfile));
            try {
              localStorage.setItem(`ih_profile_${session.user.id}`, JSON.stringify(realProfile));
              localStorage.setItem('indihunt_profile', JSON.stringify(realProfile));
            } catch (e) { }
          }
        })
        .catch(() => { });

      // Notify orchestrator listeners of completed setup
      dataOrchestrator.startMigration(session.user.id);

      // Upvotes fetch on login
      getUserUpvotedProductIds(session.user.id)
        .then((ids) => {
          if (!Array.isArray(ids)) return;
          const voted = new Set(ids);
          try {
            localStorage.setItem(`indihunt_upvotes_${session.user.id}`, JSON.stringify(ids));
          } catch (e) { }
          queryClient.setQueriesData({ queryKey: ["products"] }, (old: any) =>
            Array.isArray(old) ? old.map((p: any) => ({ ...p, has_upvoted: voted.has(p.id) })) : old
          );
        })
        .catch(() => { });
    };

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        lastFetchedUserId = "";
        dataOrchestrator.destroy();
        try {
          sessionStorage.removeItem('indihunt_user_session');
          localStorage.removeItem('indihunt_upvotes');
          localStorage.removeItem('indihunt_thread_upvotes');
        } catch (e) { }
        clearCache();
        queryClient.clear();
        dispatch(setUser(null));
        dispatch(setProfile(null));
        setCurrentUser(null);
        return;
      }
      if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        handleSessionSetup(session); // guard now dedupes by user id
      } else if (!session && event === 'INITIAL_SESSION') {
        dispatch(setUser(null));
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
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
