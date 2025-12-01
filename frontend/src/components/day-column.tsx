import type React from "react"
import { useState } from "react"
import { Plus, Circle, CheckCircle2 } from "lucide-react"
import { useTaskManager, type Task } from "./task-manager"

interface DayColumnProps {
  day: string
  date: string
  dayKey: string
  totalTime: string
  progress?: number
}

const tagColors: Record<string, string> = {
  Church: "#6366f1",
  Personal: "#22c55e",
  Chores: "#eab308",
}

export function DayColumn({ day, date, dayKey, totalTime, progress }: DayColumnProps) {
  const { tasks, openAddTask, moveTask, reorderTask } = useTaskManager()
  const dayTasks = tasks[dayKey] || []
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)

    const data = e.dataTransfer.getData("application/json")
    if (!data) return

    const { taskId, fromDay, fromIndex } = JSON.parse(data)

    if (fromDay === dayKey) {
      // Reorder within same day
      if (fromIndex !== toIndex) {
        reorderTask(dayKey, fromIndex, toIndex)
      }
    } else {
      // Move to different day
      moveTask(fromDay, dayKey, taskId, toIndex)
    }
  }

  const handleDropOnColumn = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverIndex(null)

    const data = e.dataTransfer.getData("application/json")
    if (!data) return

    const { taskId, fromDay } = JSON.parse(data)

    if (fromDay !== dayKey) {
      moveTask(fromDay, dayKey, taskId)
    }
  }

  return (
    <div
      className="flex-1 min-w-0 sm:min-w-[250px] sm:w-[250px] sm:flex-none flex flex-col border-r border-[#252525] last:border-r-0"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDropOnColumn}
    >
      <div className="p-3 pb-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-medium text-[#e6e6e6]">{day}</h2>
        </div>
        <p className="text-xs text-[#555] mt-0.5">{date}</p>
        {progress !== undefined && (
          <div className="mt-2 h-1.5 bg-[#252525] rounded-full overflow-hidden">
            <div className="h-full bg-[#22c55e] rounded-full" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div className="px-2 mb-2">
        <button
          onClick={() => openAddTask(dayKey)}
          className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-[#555] hover:text-[#888] hover:bg-[#1e1e1e] hover:border-[#555] rounded border border-dashed border-[#333] transition-all cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add task
          </span>
          {totalTime && <span className="text-xs text-[#555]">{totalTime}</span>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1.5">
        {dayTasks.map((task, index) => (
          <div
            key={task.id}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
          >
            {dragOverIndex === index && <div className="h-1 bg-[#6366f1] rounded-full mb-1.5" />}
            <TaskCard task={task} dayKey={dayKey} index={index} />
          </div>
        ))}
        {/* Drop zone at the end */}
        <div
          className="h-8"
          onDragOver={(e) => handleDragOver(e, dayTasks.length)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, dayTasks.length)}
        >
          {dragOverIndex === dayTasks.length && <div className="h-1 bg-[#6366f1] rounded-full" />}
        </div>
      </div>
    </div>
  )
}

function TaskCard({ task, dayKey, index }: { task: Task; dayKey: string; index: number }) {
  const { toggleTaskComplete, openTaskDetail } = useTaskManager()
  const tagColor = tagColors[task.tag] || "#666"
  const [isDragging, setIsDragging] = useState(false)

  const handleCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleTaskComplete(dayKey, task.id)
  }

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        taskId: task.id,
        fromDay: dayKey,
        fromIndex: index,
      }),
    )
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`bg-[#1a1a1a] rounded-md p-2.5 hover:bg-[#222] cursor-pointer active:cursor-grabbing transition-all border border-transparent hover:border-[#333] ${
        isDragging ? "opacity-50 scale-95" : ""
      }`}
      onClick={() => openTaskDetail(task, dayKey)}
    >
      {task.scheduledTime && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[#666]">{task.scheduledTime}</span>
          <span className="text-[10px] text-[#888] bg-[#252525] px-1.5 py-0.5 rounded">{task.time}</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className={`text-sm ${task.completed ? "text-[#555] line-through" : "text-[#e6e6e6]"}`}>
            {task.title}
          </span>
          {!task.scheduledTime && (
            <span className="text-[10px] text-[#888] bg-[#252525] px-1.5 py-0.5 rounded flex-shrink-0 flex items-center gap-0.5">
              {task.time}
              {task.hasNotification && <span className="w-1.5 h-1.5 bg-[#ef4444] rounded-full" />}
            </span>
          )}
        </div>

        {task.subtask && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Circle className="w-3 h-3 text-[#444]" />
            <span className="text-xs text-[#e6e6e6]">{task.subtask}</span>
          </div>
        )}

        {task.subtaskCount && <span className="text-xs text-[#555] mt-1 block">{task.subtaskCount}</span>}

        <div className="flex items-center justify-between mt-2">
          <button
            onClick={handleCheckClick}
            className="flex-shrink-0 hover:scale-110 transition-transform cursor-pointer"
          >
            {task.completed ? (
              <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
            ) : (
              <Circle className="w-4 h-4 text-[#444] hover:text-[#666]" />
            )}
          </button>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: tagColor }}>
            # {task.tag}
          </span>
        </div>
      </div>
    </div>
  )
}
