import { create } from "zustand"

interface BacklogState {
	showBacklog: boolean
	toggleBacklog: () => void
	setShowBacklog: (show: boolean) => void
}

export const useBacklogStore = create<BacklogState>((set) => ({
	showBacklog: false,
	toggleBacklog: () => set((state) => ({ showBacklog: !state.showBacklog })),
	setShowBacklog: (show: boolean) => set({ showBacklog: show }),
}))