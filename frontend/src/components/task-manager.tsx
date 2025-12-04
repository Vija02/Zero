import {
	useState,
	createContext,
	useContext,
	useEffect,
	useCallback,
	useRef,
} from "react"
import { LeftSidebar } from "./left-sidebar"
import { WeeklyView } from "./weekly-view"
import { BacklogPanel } from "./backlog-panel"
import { TaskDetailModal } from "./task-detail-modal"
import { AddTaskModal } from "./add-task-modal"
import { ActiveTaskBar } from "./active-task-bar"

export interface Task {
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
	actualTime?: number // in seconds
}

interface TaskManagerContextType {
	// tasks: Record<string, Task[]>
	// setTasks: React.Dispatch<React.SetStateAction<Record<string, Task[]>>>
	// toggleTaskComplete: (dayKey: string, taskId: string) => void
	openTaskDetail: (taskId: string) => void
	showBacklog: boolean
	toggleBacklog: () => void
	openAddTask: (day: Date) => void
	isMobile: boolean
	sidebarOpen: boolean
	toggleSidebar: () => void
	activeTask: { task: Task; dayKey: string } | null
	startTask: (task: Task, dayKey: string) => void
	stopTask: () => void
	elapsedTime: number
}

export const TaskManagerContext = createContext<TaskManagerContextType | null>(
	null,
)
export const useTaskManager = () => {
	const ctx = useContext(TaskManagerContext)
	if (!ctx)
		throw new Error("useTaskManager must be used within TaskManagerContext")
	return ctx
}

export function TaskManager() {
	const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
	const [showBacklog, setShowBacklog] = useState(false)
	const [addTaskDay, setAddTaskDay] = useState<Date | null>(null)
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [isMobile, setIsMobile] = useState(false)
	const [activeTask, setActiveTask] = useState<{
		task: Task
		dayKey: string
	} | null>(null)
	const [elapsedTime, setElapsedTime] = useState(0)
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768)
		checkMobile()
		window.addEventListener("resize", checkMobile)
		return () => window.removeEventListener("resize", checkMobile)
	}, [])

	useEffect(() => {
		if (activeTask) {
			timerRef.current = setInterval(() => {
				setElapsedTime((prev) => prev + 1)
			}, 1000)
		} else {
			if (timerRef.current) {
				clearInterval(timerRef.current)
				timerRef.current = null
			}
			setElapsedTime(0)
		}
		return () => {
			if (timerRef.current) clearInterval(timerRef.current)
		}
	}, [activeTask])

	const openTaskDetail = useCallback((taskId: string) => {
		setSelectedTaskId(taskId)
	}, [])

	const toggleBacklog = useCallback(() => {
		setShowBacklog((prev) => !prev)
	}, [])

	const openAddTask = useCallback((day: Date) => {
		setAddTaskDay(day)
	}, [])

	const toggleSidebar = useCallback(() => {
		setSidebarOpen((prev) => !prev)
	}, [])

	const startTask = useCallback((task: Task, dayKey: string) => {
		setActiveTask({ task, dayKey })
		setElapsedTime(task.actualTime || 0)
	}, [])

	const stopTask = useCallback(() => {
		// if (activeTask) {
		// 	// Save elapsed time to the task
		// 	setTasks((prev) => ({
		// 		...prev,
		// 		[activeTask.dayKey]: prev[activeTask.dayKey].map((t) =>
		// 			t.id === activeTask.task.id ? { ...t, actualTime: elapsedTime } : t,
		// 		),
		// 	}))
		// }
		// setActiveTask(null)
	}, [])

	return (
		<TaskManagerContext.Provider
			value={{
				// tasks,
				// setTasks,
				// toggleTaskComplete,
				openTaskDetail,
				showBacklog,
				toggleBacklog,
				openAddTask,
				isMobile,
				sidebarOpen,
				toggleSidebar,
				activeTask,
				startTask,
				stopTask,
				elapsedTime,
			}}
		>
			<div className="flex h-screen bg-[#131314] text-[#e6e6e6] overflow-hidden">
				<LeftSidebar />
				<main className="flex flex-1 overflow-hidden">
					<WeeklyView />
					{showBacklog && <BacklogPanel />}
				</main>

				{selectedTaskId && (
					<TaskDetailModal
						taskId={selectedTaskId}
						onClose={() => setSelectedTaskId(null)}
					/>
				)}
				{addTaskDay && (
					<AddTaskModal day={addTaskDay} onClose={() => setAddTaskDay(null)} />
				)}

				{activeTask && <ActiveTaskBar />}
			</div>
		</TaskManagerContext.Provider>
	)
}
