"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"
import { useTaskManager } from "./task-manager"

interface AddTaskModalProps {
  dayKey: string
  onClose: () => void
}

export function AddTaskModal({ dayKey, onClose }: AddTaskModalProps) {
  const { addTask, isMobile } = useTaskManager()
  const [title, setTitle] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    if (!title.trim()) return

    addTask(dayKey, {
      id: Date.now().toString(),
      title: title.trim(),
      time: "0:30",
      tag: "Personal",
      createdBy: "Michael Salim",
      createdAt: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    })
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && title.trim()) {
      handleSubmit()
    }
    if (e.key === "Escape") {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-24 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-[400px] bg-[#1e1e1e] rounded-lg shadow-2xl border border-[#333] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#1a1a1a]">
          <span className="text-sm text-[#888]">New task</span>
          <button
            onClick={onClose}
            className="p-1 text-[#666] hover:text-[#e6e6e6] hover:bg-[#333] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Simple input */}
        <div className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you need to do?"
            className="w-full text-base text-[#e6e6e6] bg-transparent outline-none placeholder-[#555]"
          />
        </div>

        {/* Footer hint */}
        <div className="px-4 pb-3">
          <p className="text-xs text-[#555]">
            Press <span className="text-[#888]">Enter</span> to add
          </p>
        </div>
      </div>
    </div>
  )
}
