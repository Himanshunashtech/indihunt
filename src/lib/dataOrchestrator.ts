import { queryClient } from './queryClient';
import { store } from './store';
import { setProfile } from './store';
import { 
  getProducts, 
  getThreads, 
  getStories, 
  getUserProfile, 
  getKarmaLeaderboard, 
  getStreakLeaderboard,
  Product
} from './supabase';
import { AppEvent, eventBus } from './eventBus';

export enum DataPriority {
    CRITICAL = 0,    // Session check, core profile flags
    UI_BLOCKING = 1,
    REALTIME = 2,
    UI_DEFERRED = 3, // Stories, leaderboards
    BACKGROUND = 4   // Cache warmup, other assets
}

type OrchestratorStage = 'IDLE' | 'CRITICAL' | 'UI_BLOCKING' | 'UI_DEFERRED' | 'BACKGROUND' | 'REALTIME' | 'COMPLETED';

class DataOrchestrator {
    private currentStage: OrchestratorStage = 'IDLE';
    private listeners: ((stage: OrchestratorStage) => void)[] = [];
    private userId: string | null = null;
    private migrationId = 0;
    private safetyTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly CRITICAL_TIMEOUT = 10000; // 10 seconds for web

    constructor() { }

    public setUserId(id: string) {
        this.userId = id;
    }

    public subscribe(listener: (stage: OrchestratorStage) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private updateStage(stage: OrchestratorStage) {
        this.currentStage = stage;
        this.listeners.forEach(l => l(stage));
        eventBus.dispatch(AppEvent.SYNC_STAGE_CHANGED, { stage });
    }

    public getStage() {
        return this.currentStage;
    }

    public destroy() {
        this.migrationId++;
        this.userId = null;
        this.currentStage = 'IDLE';
        this.listeners = [];
        if (this.safetyTimer) {
            clearTimeout(this.safetyTimer);
            this.safetyTimer = null;
        }
    }

    public async handleAppResume(userId: string) {
        if (this.userId !== userId) return;


        if (this.currentStage === 'COMPLETED' || this.currentStage === 'IDLE') {
            const guard = () => this.userId === userId;
            try {
                await this.runCriticalStage(guard);
            } catch (err) {
                console.warn('[DataOrchestrator] Tab focus sync failed:', err);
            }
        }
    }

    public async startMigration(userId: string) {
        // 1. Guard check before mutating state or bumping migrationId
        if (this.userId === userId && this.currentStage !== 'IDLE' && this.currentStage !== 'COMPLETED') {
            return;
        }

        // 2. Increment migrationId to invalidate any previous in-flight run
        this.migrationId++;
        const currentMigration = this.migrationId;
        const guard = () => currentMigration === this.migrationId;

        this.userId = userId;
        this.updateStage('CRITICAL');

        // Clear any existing safety timer
        if (this.safetyTimer) {
            clearTimeout(this.safetyTimer);
            this.safetyTimer = null;
        }

        // Safety timeout: ensure orchestrator does not stay stuck in non-completed state
        this.safetyTimer = setTimeout(() => {
            if (guard() && this.currentStage !== 'COMPLETED' && this.currentStage !== 'IDLE') {
                console.warn('[DataOrchestrator] Safety timeout reached (10s), forcing COMPLETED');
                this.updateStage('COMPLETED');
            }
        }, this.CRITICAL_TIMEOUT);

        // Execute stages asynchronously in the background so login and first paint are completely unblocked
        (async () => {
            try {
                // CRITICAL stage (session check & profile load with retry)
                await this.runCriticalStage(guard);
                if (!guard()) return;

                // UI_BLOCKING stage (prefetch products & threads lists)
                this.updateStage('UI_BLOCKING');
                await this.runUiBlockingStage(guard);
                if (!guard()) return;

                // UI_DEFERRED stage (secondary feeds, stories, leaderboards)
                this.updateStage('UI_DEFERRED');
                await this.runUiDeferredStage(guard);
                if (!guard()) return;

                // BACKGROUND stage (warm up auxiliary best-products cache)
                this.updateStage('BACKGROUND');
                await this.runBackgroundStage(guard);
                if (!guard()) return;

                if (this.safetyTimer) {
                    clearTimeout(this.safetyTimer);
                    this.safetyTimer = null;
                }
                this.updateStage('COMPLETED');
            } catch (error) {
                console.warn('[DataOrchestrator] Migration pipeline error:', error);
                if (!guard()) return;
                if (this.safetyTimer) {
                    clearTimeout(this.safetyTimer);
                    this.safetyTimer = null;
                }
                this.updateStage('COMPLETED');
            }
        })();
    }

    private async runWithRetry(fn: () => Promise<void>, retries: number, guard: () => boolean): Promise<void> {
        for (let i = 0; i < retries; i++) {
            try {
                await fn();
                return;
            } catch (err) {
                if (!guard()) return;
                if (i === retries - 1) throw err;
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
    }

    private async runCriticalStage(guard: () => boolean) {
        if (!guard() || !this.userId || this.userId === 'guest') return;

        await this.runWithRetry(async () => {
            if (!guard() || !this.userId || this.userId === 'guest') return;
            const profile = await queryClient.fetchQuery({
                queryKey: ['user_profile', this.userId],
                queryFn: () => getUserProfile(this.userId!)
            });

            if (profile && guard()) {
                store.dispatch(setProfile(profile));
                eventBus.dispatch(AppEvent.PROFILE_UPDATED, {
                    payload: { new: profile },
                    source: 'orchestrator'
                });
            }
        }, 2, guard);
    }

    private async runUiBlockingStage(guard: () => boolean) {
        if (!guard()) return;
        const targetUserId = this.userId === 'guest' ? undefined : (this.userId || undefined);
        const queryKeyUser = targetUserId || "guest";

        // Check if queryClient already has active data populated from SSR / seed to avoid redundant API calls
        const cachedProducts = queryClient.getQueryData(["products", queryKeyUser]);
        const cachedThreads = queryClient.getQueryData(["threads", queryKeyUser]);

        const tasks: Promise<any>[] = [];
        if (!cachedProducts) {
            tasks.push(
                queryClient.prefetchQuery({
                    queryKey: ["products", queryKeyUser],
                    queryFn: () => getProducts(targetUserId),
                    staleTime: 5 * 60 * 1000,
                })
            );
        }
        if (!cachedThreads) {
            tasks.push(
                queryClient.prefetchQuery({
                    queryKey: ["threads", queryKeyUser],
                    queryFn: () => getThreads(targetUserId),
                    staleTime: 5 * 60 * 1000,
                })
            );
        }

        if (tasks.length > 0) {
            await Promise.allSettled(tasks);
        }
    }

    private async runUiDeferredStage(guard: () => boolean): Promise<void> {
        if (!guard()) return;

        // Defer secondary resources by 2 seconds so first paint & user interaction are completely unhindered
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (!guard()) return;

        // Prefetch secondary feed views like stories and leaderboards
        await Promise.allSettled([
            queryClient.prefetchQuery({
                queryKey: ["stories", ""],
                queryFn: () => getStories(),
                staleTime: 5 * 60 * 1000,
            }),
            queryClient.prefetchQuery({
                queryKey: ["karmaLeaderboard"],
                queryFn: () => getKarmaLeaderboard(20),
                staleTime: 5 * 60 * 1000,
            }),
            queryClient.prefetchQuery({
                queryKey: ["streakLeaderboard"],
                queryFn: () => getStreakLeaderboard(20),
                staleTime: 5 * 60 * 1000,
            })
        ]);

        // Prefetch product logo/screenshot images in the browser background
        const productsList = queryClient.getQueryData<Product[]>(["products", this.userId === 'guest' ? "guest" : (this.userId || "guest")]);
        if (productsList && productsList.length > 0 && typeof window !== 'undefined') {
            const urlsToPrefetch = productsList
                .slice(0, 10)
                .map(p => p.logo_url)
                .filter(Boolean);

            if (urlsToPrefetch.length > 0) {
                urlsToPrefetch.forEach(url => {
                    const img = new window.Image();
                    img.src = url;
                });
            }
        }
    }

    private async runBackgroundStage(guard: () => boolean): Promise<void> {
        if (!guard()) return;
        // Warm up cache for "products-best" if they navigate to best products page
        await queryClient.prefetchQuery({
            queryKey: ["products-best", "all", "all", undefined, undefined, undefined],
            queryFn: async () => {
                const dataList = await getProducts();
                return dataList || [];
            },
            staleTime: 5 * 60 * 1000,
        });
    }
}

export const dataOrchestrator = new DataOrchestrator();
