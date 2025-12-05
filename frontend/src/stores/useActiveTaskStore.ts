import { create } from "zustand"

interface Task {
	id: string
	title: string
	time: string
	tag: string
	scheduledTime?: string
	subtask?: string
	subtaskCount?: string
	hasNotification?: boolean
	hasAssignee?: boolean
	completed?: boolean
	notes?: string
	createdBy?: string
	createdAt?: string
	isRecurring?: boolean
	actualTime?: number
}

interface ActiveTaskState {
	activeTask: { task: Task; dayKey: string } | null
	elapsedTime: number
	timerInterval: ReturnType<typeof setInterval> | null
	startTask: (task: Task, dayKey: string) => void
	stopTask: () => void
	tick: () => void
	setTimerInterval: (interval: ReturnType<typeof setInterval> | null) => void
}

export const useActiveTaskStore = create<ActiveTaskState>((set, get) => ({
	activeTask: null,
	elapsedTime: 0,
	timerInterval: null,
	startTask: (task: Task, dayKey: string) => {
		const currentInterval = get().timerInterval
		if (currentInterval) {
			clearInterval(currentInterval)
		}

		const interval = setInterval(() => {
			get().tick()
		}, 1000)

		set({
			activeTask: { task, dayKey },
			elapsedTime: task.actualTime || 0,
			timerInterval: interval,
		})
	},
	stopTask: () => {
		const currentInterval = get().timerInterval
		if (currentInterval) {
			clearInterval(currentInterval)
		}
		set({
			activeTask: null,
			elapsedTime: 0,
			timerInterval: null,
		})
	},
	tick: () => set((state) => ({ elapsedTime: state.elapsedTime + 1 })),
	setTimerInterval: (interval) => set({ timerInterval: interval }),
}))