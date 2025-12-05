import { create } from "zustand"

interface SidebarState {
	sidebarOpen: boolean
	toggleSidebar: () => void
	setSidebarOpen: (open: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
	sidebarOpen: false,
	toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
	setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
}))