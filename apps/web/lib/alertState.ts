type AlertAction = 'ack' | 'snooze';

type AlertSuppression = {
  id: string;
  action: AlertAction;
  until: number;
  note?: string;
  updatedAt: string;
};

type Store = {
  alerts: Map<string, AlertSuppression>;
};

const globalStore = globalThis as unknown as { __alertState?: Store };

function getStore(): Store {
  if (!globalStore.__alertState) {
    globalStore.__alertState = { alerts: new Map<string, AlertSuppression>() };
  }
  return globalStore.__alertState;
}

function pruneExpired() {
  const now = Date.now();
  const store = getStore();
  for (const [id, item] of store.alerts.entries()) {
    if (item.until <= now) {
      store.alerts.delete(id);
    }
  }
}

export function isAlertSuppressed(id: string): boolean {
  pruneExpired();
  const item = getStore().alerts.get(id);
  return Boolean(item && item.until > Date.now());
}

export function getSuppressionSnapshot() {
  pruneExpired();
  return Array.from(getStore().alerts.values()).map((item) => ({
    id: item.id,
    action: item.action,
    until: new Date(item.until).toISOString(),
    note: item.note ?? null,
    updatedAt: item.updatedAt,
  }));
}

export function applyAlertAction(id: string, action: AlertAction, minutes: number, note?: string) {
  const duration = Math.max(1, Math.min(minutes, 60 * 24 * 14));
  const until = Date.now() + duration * 60 * 1000;
  const payload: AlertSuppression = {
    id,
    action,
    until,
    note,
    updatedAt: new Date().toISOString(),
  };

  getStore().alerts.set(id, payload);
  return {
    id,
    action,
    until: new Date(until).toISOString(),
    note: note ?? null,
  };
}
