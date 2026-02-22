import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiError } from './apiClient';
import { useUIStore } from '@/stores/useUIStore';
import { showToast } from '@/components/Toast';

const STORAGE_KEY = 'spotapp-offline-queue';
const MAX_RETRIES = 5;

export interface QueuedMutation {
  id: string;
  type: string;
  label: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  timestamp: number;
  retryCount: number;
}

async function persist(queue: QueuedMutation[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export async function getQueue(): Promise<QueuedMutation[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as QueuedMutation[]) : [];
}

/** Load persisted queue into UI store (call on app startup) */
export async function restoreQueueToUI() {
  const queue = await getQueue();
  const store = useUIStore.getState();
  for (const entry of queue) {
    store.addPendingAction({
      id: entry.id,
      type: entry.type,
      label: entry.label,
      timestamp: entry.timestamp,
      status: 'pending',
    });
  }
}

export async function enqueueMutation(
  mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount'>,
) {
  const entry: QueuedMutation = {
    ...mutation,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    retryCount: 0,
  };

  const queue = await getQueue();
  queue.push(entry);
  await persist(queue);

  useUIStore.getState().addPendingAction({
    id: entry.id,
    type: entry.type,
    label: entry.label,
    timestamp: entry.timestamp,
    status: 'pending',
  });

  showToast(`${entry.label} queued for sync`, 'info');
}

export async function removeMutation(id: string) {
  const queue = await getQueue();
  await persist(queue.filter((m) => m.id !== id));
  useUIStore.getState().removePendingAction(id);
}

export async function flushOfflineQueue() {
  const queue = await getQueue();
  if (queue.length === 0) return;

  const remaining: QueuedMutation[] = [];

  for (const mutation of queue) {
    useUIStore.getState().updatePendingAction(mutation.id, { status: 'syncing' });

    try {
      if (mutation.method === 'POST') {
        await api.post(mutation.endpoint, mutation.body ?? {});
      } else if (mutation.method === 'PUT') {
        await api.put(mutation.endpoint, mutation.body ?? {});
      } else if (mutation.method === 'DELETE') {
        await api.delete(mutation.endpoint);
      }

      // Success — remove from queue
      useUIStore.getState().removePendingAction(mutation.id);
    } catch (error: unknown) {
      const statusCode = error instanceof ApiError ? error.statusCode : undefined;

      if (statusCode && statusCode >= 400 && statusCode < 500) {
        // Client error — drop and notify
        useUIStore.getState().removePendingAction(mutation.id);
        showToast(`${mutation.label} failed: cannot sync`, 'error');
      } else {
        // Server error or network — keep for retry if under limit
        mutation.retryCount += 1;
        if (mutation.retryCount >= MAX_RETRIES) {
          useUIStore.getState().removePendingAction(mutation.id);
          showToast(`${mutation.label} dropped after ${MAX_RETRIES} retries`, 'error');
        } else {
          remaining.push(mutation);
          useUIStore.getState().updatePendingAction(mutation.id, { status: 'pending' });
        }
      }
    }
  }

  await persist(remaining);
}
