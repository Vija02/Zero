"use client"

import { Calendar, BarChart3, BookmarkIcon, Lightbulb, Search, Zap, Plus, FileText } from "lucide-react"

const sidebarItems = [
  { icon: Calendar },
  { icon: BarChart3 },
  { icon: BookmarkIcon },
  { icon: FileText },
  { icon: Lightbulb },
  { icon: Search },
  { icon: Zap },
  { icon: Plus },
]

export function RightSidebar() {
  return (
    <aside className="w-10 bg-[#1a1a1a] border-l border-[#333] flex flex-col items-center py-3 gap-3">
      {sidebarItems.map((item, index) => (
        <button
          key={index}
          className="w-7 h-7 flex items-center justify-center rounded text-[#666] hover:text-[#999] hover:bg-[#262626] transition-colors"
        >
          <item.icon className="w-4 h-4" />
        </button>
      ))}
    </aside>
  )
}
