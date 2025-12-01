import type React from "react"

import { useState, createContext, useContext, useEffect, useCallback, useRef } from "react"
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
  tasks: Record<string, Task[]>
  setTasks: React.Dispatch<React.SetStateAction<Record<string, Task[]>>>
  toggleTaskComplete: (dayKey: string, taskId: string) => void
  openTaskDetail: (task: Task, dayKey: string) => void
  showBacklog: boolean
  toggleBacklog: () => void
  openAddTask: (dayKey: string) => void
  addTask: (dayKey: string, task: Task) => void
  isMobile: boolean
  sidebarOpen: boolean
  toggleSidebar: () => void
  activeTask: { task: Task; dayKey: string } | null
  startTask: (task: Task, dayKey: string) => void
  stopTask: () => void
  elapsedTime: number
  moveTask: (fromDay: string, toDay: string, taskId: string, toIndex?: number) => void
  reorderTask: (dayKey: string, fromIndex: number, toIndex: number) => void
}

export const TaskManagerContext = createContext<TaskManagerContextType | null>(null)
export const useTaskManager = () => {
  const ctx = useContext(TaskManagerContext)
  if (!ctx) throw new Error("useTaskManager must be used within TaskManagerContext")
  return ctx
}

const initialTasks: Record<string, Task[]> = {
  sunday: [
    { id: "1", title: "Weekly Reorientation", time: "0:10", tag: "Church", hasNotification: true },
    {
      id: "2",
      title: "Cooking Schedule",
      time: "0:10",
      tag: "Personal",
      isRecurring: true,
      notes: "",
      createdBy: "Michael Salim",
      createdAt: "Nov 23, 7:44 PM",
    },
    {
      id: "3",
      title: "Plan trip",
      time: "0:10",
      tag: "Personal",
      subtask: "Decide how long in each country",
    },
    { id: "4", title: "Teaching next week", time: "0:20", tag: "Church", hasNotification: true },
    { id: "5", title: "Prepare Darren", time: "0:15", tag: "Church", hasNotification: true },
    { id: "6", title: "Prepare Daniel", time: "0:15", tag: "Church", hasNotification: true },
    { id: "7", title: "TOP System monitoring", time: "0:05 / 0:05", tag: "Personal", completed: true },
    { id: "8", title: "End of month", time: "0:30 / 0:30", tag: "Church", completed: true },
  ],
  monday: [{ id: "9", title: "MOT", time: "0:15", tag: "Chores", scheduledTime: "9:00 am" }],
  tuesday: [
    {
      id: "10",
      title: "Prepare Pasta bake",
      time: "0:15",
      tag: "Chores",
      scheduledTime: "9:00 am",
      subtaskCount: "2 subtasks",
    },
    { id: "11", title: "Plan meeting Sam HK", time: "0:15", tag: "Church", scheduledTime: "9:15 am" },
  ],
  wednesday: [],
  thursday: [{ id: "12", title: "Team standup", time: "0:30", tag: "Church", scheduledTime: "10:00 am" }],
  friday: [{ id: "13", title: "Weekly report", time: "0:45", tag: "Personal" }],
  saturday: [],
}

export function TaskManager() {
  const [tasks, setTasks] = useState(initialTasks)
  const [selectedTask, setSelectedTask] = useState<{ task: Task; dayKey: string } | null>(null)
  const [showBacklog, setShowBacklog] = useState(false)
  const [addTaskDay, setAddTaskDay] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeTask, setActiveTask] = useState<{ task: Task; dayKey: string } | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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

  const toggleTaskComplete = useCallback((dayKey: string, taskId: string) => {
    setTasks((prev) => ({
      ...prev,
      [dayKey]: prev[dayKey].map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
    }))
  }, [])

  const openTaskDetail = useCallback((task: Task, dayKey: string) => {
    setSelectedTask({ task, dayKey })
  }, [])

  const toggleBacklog = useCallback(() => {
    setShowBacklog((prev) => !prev)
  }, [])

  const openAddTask = useCallback((dayKey: string) => {
    setAddTaskDay(dayKey)
  }, [])

  const addTask = useCallback((dayKey: string, task: Task) => {
    setTasks((prev) => ({
      ...prev,
      [dayKey]: [...(prev[dayKey] || []), task],
    }))
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const startTask = useCallback((task: Task, dayKey: string) => {
    setActiveTask({ task, dayKey })
    setElapsedTime(task.actualTime || 0)
  }, [])

  const stopTask = useCallback(() => {
    if (activeTask) {
      // Save elapsed time to the task
      setTasks((prev) => ({
        ...prev,
        [activeTask.dayKey]: prev[activeTask.dayKey].map((t) =>
          t.id === activeTask.task.id ? { ...t, actualTime: elapsedTime } : t,
        ),
      }))
    }
    setActiveTask(null)
  }, [activeTask, elapsedTime])

  const moveTask = useCallback((fromDay: string, toDay: string, taskId: string, toIndex?: number) => {
    setTasks((prev) => {
      const taskToMove = prev[fromDay].find((t) => t.id === taskId)
      if (!taskToMove) return prev

      const newFromTasks = prev[fromDay].filter((t) => t.id !== taskId)
      const newToTasks = [...(prev[toDay] || [])]

      if (toIndex !== undefined) {
        newToTasks.splice(toIndex, 0, taskToMove)
      } else {
        newToTasks.push(taskToMove)
      }

      return {
        ...prev,
        [fromDay]: newFromTasks,
        [toDay]: newToTasks,
      }
    })
  }, [])

  const reorderTask = useCallback((dayKey: string, fromIndex: number, toIndex: number) => {
    setTasks((prev) => {
      const newTasks = [...prev[dayKey]]
      const [removed] = newTasks.splice(fromIndex, 1)
      newTasks.splice(toIndex, 0, removed)
      return { ...prev, [dayKey]: newTasks }
    })
  }, [])

  return (
		<TaskManagerContext.Provider
			value={{
				tasks,
				setTasks,
				toggleTaskComplete,
				openTaskDetail,
				showBacklog,
				toggleBacklog,
				openAddTask,
				addTask,
				isMobile,
				sidebarOpen,
				toggleSidebar,
				activeTask,
				startTask,
				stopTask,
				elapsedTime,
				moveTask,
				reorderTask,
			}}
		>
			<div className="flex h-screen bg-[#131314] text-[#e6e6e6] overflow-hidden">
				<LeftSidebar />
				<main className="flex flex-1 overflow-hidden">
					<WeeklyView />
					{showBacklog && <BacklogPanel />}
				</main>

				{selectedTask && (
					<TaskDetailModal
						task={selectedTask.task}
						dayKey={selectedTask.dayKey}
						onClose={() => setSelectedTask(null)}
					/>
				)}
				{addTaskDay && (
					<AddTaskModal
						dayKey={addTaskDay}
						onClose={() => setAddTaskDay(null)}
					/>
				)}

				{activeTask && <ActiveTaskBar />}
			</div>
		</TaskManagerContext.Provider>
	)
}
