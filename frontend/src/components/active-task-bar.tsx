"use client"

import { Square } from "lucide-react"
import { useTaskManager } from "./task-manager"

const tagColors: Record<string, string> = {
  Church: "#6366f1",
  Personal: "#22c55e",
  Chores: "#eab308",
}

export function ActiveTaskBar() {
  const { activeTask, stopTask, elapsedTime } = useTaskManager()

  if (!activeTask) return null

  const tagColor = tagColors[activeTask.task.tag] || "#666"

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-[#1e1e1e] border border-[#333] rounded-full shadow-2xl">
      <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
      <span className="text-sm text-[#e6e6e6] max-w-[200px] sm:max-w-none truncate">{activeTask.task.title}</span>
      <span className="text-sm px-2 py-0.5 rounded" style={{ color: tagColor }}>
        # {activeTask.task.tag}
      </span>
      <span className="text-sm font-mono text-[#e6e6e6] tabular-nums">{formatTime(elapsedTime)}</span>
      <div className="flex items-center gap-1 ml-2">
        <button onClick={stopTask} className="p-1.5 hover:bg-[#333] rounded-full transition-colors" title="Stop">
          <Square className="w-4 h-4 text-[#ef4444]" />
        </button>
      </div>
    </div>
  )
}
