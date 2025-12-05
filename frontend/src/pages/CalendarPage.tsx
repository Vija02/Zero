import { Calendar, Menu } from "lucide-react"
import { LeftSidebar } from "@/components/left-sidebar"
import { useSidebarStore } from "@/stores/useSidebarStore"

export function CalendarPage() {
	const { toggleSidebar } = useSidebarStore()

	return (
		<>
			<LeftSidebar />
			<main className="flex-1 flex flex-col overflow-hidden">
				<header className="h-12 flex items-center px-2 sm:px-4 border-b border-[#252525] bg-[#121212]">
					<button
						onClick={toggleSidebar}
						className="md:hidden flex items-center justify-center p-2 hover:bg-[#252525] rounded transition-colors"
					>
						<Menu className="w-5 h-5" />
					</button>
					<div className="flex items-center gap-2 ml-2">
						<Calendar className="w-5 h-5" />
						<h1 className="text-lg font-semibold">Calendar</h1>
					</div>
				</header>

				<div className="flex-1 overflow-auto p-8">
					<div className="max-w-4xl">
						<div className="bg-[#111213] border border-[#252525] rounded-lg p-6">
							<p className="text-[#888]">Calendar view coming soon...</p>
						</div>
					</div>
				</div>
			</main>
		</>
	)
}
