/**
 * Decoupled Event Bus (TypeScript)
 * Broadcasts agent events to UI (SSE), CLI, audit logs, and webhooks.
 */

export type EventListener = (event: any) => void;

export class EventBus {
  private listeners: EventListener[] = [];

  subscribe(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  publish(event: any): void {
    const payload = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString()
    };
    this.listeners.forEach(fn => {
      try {
        fn(payload);
      } catch (err: any) {
        console.error("EventBus listener error:", err.message);
      }
    });
  }
}

export default new EventBus();
