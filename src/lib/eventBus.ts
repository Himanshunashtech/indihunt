export enum AppEvent {
  SYNC_STAGE_CHANGED = 'SYNC_STAGE_CHANGED',
  PROFILE_UPDATED = 'PROFILE_UPDATED'
}

type EventCallback = (data: any) => void;

class EventBus {
  private listeners: Record<string, EventCallback[]> = {};

  public subscribe(event: AppEvent, callback: EventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  public dispatch(event: AppEvent, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[EventBus] Error in listener for ${event}:`, e);
        }
      });
    }
  }
}

export const eventBus = new EventBus();
