import { create } from 'zustand';

export interface PendingAction {
  id: string;
  type: string;
  label: string;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
}

interface UIState {
  isOffline: boolean;
  pendingActions: PendingAction[];
  setOffline: (offline: boolean) => void;
  addPendingAction: (action: PendingAction) => void;
  updatePendingAction: (id: string, updates: Partial<PendingAction>) => void;
  removePendingAction: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isOffline: false,
  pendingActions: [],
  setOffline: (offline) => set({ isOffline: offline }),
  addPendingAction: (action) =>
    set((state) => ({ pendingActions: [...state.pendingActions, action] })),
  updatePendingAction: (id, updates) =>
    set((state) => ({
      pendingActions: state.pendingActions.map((a) =>
        a.id === id ? { ...a, ...updates } : a,
      ),
    })),
  removePendingAction: (id) =>
    set((state) => ({
      pendingActions: state.pendingActions.filter((a) => a.id !== id),
    })),
}));
