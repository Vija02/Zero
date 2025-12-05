import { LeftSidebar } from "@/components/left-sidebar"
import { useWindowWidth } from "@react-hook/window-size"
import { addDays, startOfDay } from "date-fns"
import {
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Filter,
	LayoutGrid,
	Menu,
} from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useSidebarStore } from "@/stores/useSidebarStore"
import { DayColumn } from "@/components/day-column"

export function DashboardPage() {
	const { toggleSidebar } = useSidebarStore()
	const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()))

	const width = useWindowWidth()
	const visibleCount = useMemo(() => {
		if (width < 640) {
			return 1
		} else if (width < 768) {
			return 2
		} else if (width < 1024) {
			return 3
		} else {
			return 4
		}
	}, [width])

	const visibleDays = useMemo(
		() =>
			Array.from(new Array(visibleCount)).map((_, i) =>
				addDays(selectedDate, i),
			),
		[selectedDate, visibleCount],
	)

	const setToToday = useCallback(() => {
		setSelectedDate(startOfDay(new Date()))
	}, [])

	const goBack = useCallback(() => {
		setSelectedDate((prev) => addDays(prev, -1))
	}, [])

	const goForward = useCallback(() => {
		setSelectedDate((prev) => addDays(prev, 1))
	}, [])
	return (
		<>
			<LeftSidebar />
			<main className="flex flex-1 overflow-hidden">
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
								className="flex items-center justify-center p-1.5 cursor-pointer hover:bg-[#252525] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
							>
								<ChevronLeft className="w-4 h-4" />
							</button>
							<button
								onClick={setToToday}
								className="flex items-center gap-1.5 px-2.5 py-1 cursor-pointer bg-[#252525] hover:bg-[#333] rounded text-sm text-[#e6e6e6] transition-colors"
							>
								<CalendarDays className="w-3.5 h-3.5" />
								<span className="hidden sm:inline">Today</span>
							</button>
							<button
								onClick={goForward}
								className="flex items-center justify-center p-1.5 cursor-pointer hover:bg-[#252525] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
							<DayColumn key={day.getTime()} day={day} />
						))}
					</div>
				</div>
			</main>
		</>
	)
}
