import { AppEvent, eventBus } from './eventBus';

export enum DataPriority {
    CRITICAL = 0,
    UI_BLOCKING = 1,
    REALTIME = 2,
    UI_DEFERRED = 3,
    BACKGROUND = 4
}

type OrchestratorStage = 'IDLE' | 'CRITICAL' | 'UI_BLOCKING' | 'UI_DEFERRED' | 'BACKGROUND' | 'REALTIME' | 'COMPLETED';

class DataOrchestrator {
    private currentStage: OrchestratorStage = 'IDLE';
    private listeners: ((stage: OrchestratorStage) => void)[] = [];
    private userId: string | null = null;

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
        this.userId = null;
        this.currentStage = 'IDLE';
        this.listeners = [];
    }

    public async handleAppResume(_userId: string) {
        // no-op: individual pages/components manage their own data lifecycle
    }

    public async startMigration(userId: string) {
        this.userId = userId;
        this.updateStage('COMPLETED'); // no background fetching; pages load their own data
    }
}

export const dataOrchestrator = new DataOrchestrator();

