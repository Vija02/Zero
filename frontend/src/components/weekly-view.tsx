import { useState, useEffect } from "react"
import { CalendarDays, Filter, LayoutGrid, ChevronLeft, ChevronRight, Menu } from "lucide-react"
import { DayColumn } from "./day-column"
import { useTaskManager } from "./task-manager"

const allDays = [
  { day: "Sunday", date: "November 30", dayKey: "sunday", totalTime: "1:20", progress: 40 },
  { day: "Monday", date: "December 1", dayKey: "monday", totalTime: "0:15" },
  { day: "Tuesday", date: "December 2", dayKey: "tuesday", totalTime: "0:30" },
  { day: "Wednesday", date: "December 3", dayKey: "wednesday", totalTime: "" },
  { day: "Thursday", date: "December 4", dayKey: "thursday", totalTime: "0:30" },
  { day: "Friday", date: "December 5", dayKey: "friday", totalTime: "0:45" },
  { day: "Saturday", date: "December 6", dayKey: "saturday", totalTime: "" },
]

export function WeeklyView() {
  const { toggleSidebar } = useTaskManager()
  const [startIndex, setStartIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(4)

  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth
      if (width < 640) {
        setVisibleCount(1) // Mobile: 1 day
      } else if (width < 768) {
        setVisibleCount(2)
      } else if (width < 1024) {
        setVisibleCount(3)
      } else {
        setVisibleCount(4)
      }
    }

    updateVisibleCount()
    window.addEventListener("resize", updateVisibleCount)
    return () => window.removeEventListener("resize", updateVisibleCount)
  }, [])

  const visibleDays = allDays.slice(startIndex, startIndex + visibleCount)

  const canGoBack = startIndex > 0
  const canGoForward = startIndex + visibleCount < allDays.length

  const goBack = () => {
    if (canGoBack) setStartIndex((prev) => prev - 1)
  }

  const goForward = () => {
    if (canGoForward) setStartIndex((prev) => prev + 1)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="h-12 flex items-center justify-between px-2 sm:px-4 border-b border-[#252525] bg-[#121212]">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="md:hidden flex items-center justify-center p-2 hover:bg-[#252525] rounded transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className="flex items-center justify-center p-1.5 hover:bg-[#252525] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1 bg-[#252525] hover:bg-[#333] rounded text-sm text-[#e6e6e6] transition-colors">
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Today</span>
          </button>
          <button
            onClick={goForward}
            disabled={!canGoForward}
            className="flex items-center justify-center p-1.5 hover:bg-[#252525] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#252525] hover:bg-[#333] rounded text-sm text-[#e6e6e6] transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>
        <button className="flex items-center gap-1.5 px-2.5 py-1 bg-[#252525] hover:bg-[#333] rounded text-sm text-[#e6e6e6] transition-colors">
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Board</span>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {visibleDays.map((day) => (
          <DayColumn key={day.dayKey} {...day} />
        ))}
      </div>
    </div>
  )
}
