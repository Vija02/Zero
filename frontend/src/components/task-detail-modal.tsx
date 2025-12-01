import {
  X,
  Maximize2,
  MoreHorizontal,
  Circle,
  CheckCircle2,
  Play,
  Square,
  Paperclip,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useTaskManager, type Task } from "./task-manager"

interface TaskDetailModalProps {
  task: Task
  dayKey: string
  onClose: () => void
}

const tagColors: Record<string, string> = {
  Church: "#6366f1",
  Personal: "#22c55e",
  Chores: "#eab308",
}

export function TaskDetailModal({ task, dayKey, onClose }: TaskDetailModalProps) {
  const { toggleTaskComplete, activeTask, startTask, stopTask, elapsedTime } = useTaskManager()
  const tagColor = tagColors[task.tag] || "#666"

  const isActive = activeTask?.task.id === task.id

  const handleCheckClick = () => {
    toggleTaskComplete(dayKey, task.id)
  }

  const handlePlayClick = () => {
    if (isActive) {
      stopTask()
    } else {
      startTask(task, dayKey)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-[540px] bg-[#1e1e1e] rounded-lg shadow-2xl border border-[#333] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#333] bg-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: tagColor }}>
              # {task.tag}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-xs text-[#999] hover:text-[#e6e6e6]">Start: Nov 30</button>
            <button className="text-xs text-[#999] hover:text-[#e6e6e6]">Due</button>
            <button className="text-xs text-[#999] hover:text-[#e6e6e6]">Add subtasks</button>
            <button className="p-1 text-[#666] hover:text-[#e6e6e6] hover:bg-[#333] rounded">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button className="p-1 text-[#666] hover:text-[#e6e6e6] hover:bg-[#333] rounded">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button className="p-1 text-[#666] hover:text-[#e6e6e6] hover:bg-[#333] rounded" onClick={onClose}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recurring task notice */}
        {task.isRecurring && (
          <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-[#333]">
            <span className="text-xs text-[#888]">
              This task repeats every week on Sunday.{" "}
              <button className="text-[#3b82f6] hover:underline">Edit task series.</button>
            </span>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-xs text-[#888] hover:text-[#e6e6e6]">
                <ChevronLeft className="w-3 h-3" />
                Previous
              </button>
              <button className="flex items-center gap-1 text-xs text-[#888] hover:text-[#e6e6e6]">
                Next
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Task title section */}
        <div className="px-4 py-4 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <button onClick={handleCheckClick} className="flex-shrink-0 hover:scale-110 transition-transform">
              {task.completed ? (
                <CheckCircle2 className="w-6 h-6 text-[#22c55e]" />
              ) : (
                <Circle className="w-6 h-6 text-[#555] hover:text-[#888]" />
              )}
            </button>
            <h2
              className={`text-lg font-medium flex-1 ${task.completed ? "text-[#555] line-through" : "text-[#e6e6e6]"}`}
            >
              {task.title}
            </h2>
            <button
              onClick={handlePlayClick}
              className={`p-1.5 rounded transition-colors ${
                isActive ? "text-[#ef4444] hover:bg-[#333]" : "text-[#666] hover:text-[#e6e6e6] hover:bg-[#333]"
              }`}
            >
              {isActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="text-right text-xs">
              <div className="text-[#666]">ACTUAL</div>
              <div className={isActive ? "text-[#22c55e]" : "text-[#888]"}>
                {isActive ? formatTime(elapsedTime) : task.actualTime ? formatTime(task.actualTime) : "--:--"}
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-[#666]">PLANNED</div>
              <div className="text-[#e6e6e6]">{task.time?.split(" / ")[0] || task.time}</div>
            </div>
          </div>
        </div>

        {/* Notes section */}
        <div className="px-4 py-3 min-h-[120px] border-b border-[#333]">
          <input
            type="text"
            placeholder="Notes..."
            defaultValue={task.notes}
            className="w-full bg-transparent text-sm text-[#888] placeholder-[#555] outline-none"
          />
        </div>

        {/* Comment section */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#333]">
          <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-xs text-[#888]">MS</div>
          <input
            type="text"
            placeholder="Comment..."
            className="flex-1 bg-transparent text-sm text-[#888] placeholder-[#555] outline-none"
          />
          <button className="p-1.5 text-[#666] hover:text-[#e6e6e6] hover:bg-[#333] rounded">
            <Paperclip className="w-4 h-4" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-xs text-[#666]">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            <span className="text-[#888]">{task.createdBy || "Michael Salim"}</span> created this in{" "}
            <span className="text-[#888]">{task.tag}</span> {task.createdAt || "Nov 23, 7:44 PM"}
          </span>
        </div>
      </div>
    </div>
  )
}
