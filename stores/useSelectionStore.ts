'use client';

import { create } from 'zustand';

interface SelectionState {
  selectedIds: Set<string>;
  lastSelectedId: string | null;

  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  selectRange: (fromId: string, toId: string, allIds: string[]) => void;
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  selectedIds: new Set<string>(),
  lastSelectedId: null,

  toggleSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedIds: next, lastSelectedId: id };
    }),

  selectAll: (ids) =>
    set({ selectedIds: new Set(ids) }),

  deselectAll: () =>
    set({ selectedIds: new Set<string>(), lastSelectedId: null }),

  selectRange: (fromId, toId, allIds) =>
    set((state) => {
      const fromIndex = allIds.indexOf(fromId);
      const toIndex = allIds.indexOf(toId);
      if (fromIndex === -1 || toIndex === -1) return state;
      const [start, end] = fromIndex < toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
      const next = new Set(state.selectedIds);
      for (let i = start; i <= end; i++) {
        next.add(allIds[i]);
      }
      return { selectedIds: next, lastSelectedId: toId };
    }),
}));
