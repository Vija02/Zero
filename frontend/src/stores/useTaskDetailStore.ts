import { create } from "zustand"

interface TaskDetailState {
	selectedTaskId: string | null
	openTaskDetail: (taskId: string) => void
	closeTaskDetail: () => void
}

export const useTaskDetailStore = create<TaskDetailState>((set) => ({
	selectedTaskId: null,
	openTaskDetail: (taskId: string) => set({ selectedTaskId: taskId }),
	closeTaskDetail: () => set({ selectedTaskId: null }),
}))