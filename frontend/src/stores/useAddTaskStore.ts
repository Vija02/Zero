import { create } from "zustand"

interface AddTaskState {
	addTaskDay: Date | null
	openAddTask: (day: Date) => void
	closeAddTask: () => void
}

export const useAddTaskStore = create<AddTaskState>((set) => ({
	addTaskDay: null,
	openAddTask: (day: Date) => set({ addTaskDay: day }),
	closeAddTask: () => set({ addTaskDay: null }),
}))