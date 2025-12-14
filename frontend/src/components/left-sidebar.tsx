"use client"

import { usePocketBase } from "@/api/usePocketBase"
import {
	// Archive,
	BetweenHorizontalEnd,
	CalendarSync,
	ClipboardList,
	Home,
	LogOut,
	Settings,
	X,
} from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { useSidebarStore } from "@/stores/useSidebarStore"
// import { useBacklogStore } from "@/stores/useBacklogStore"
import { toast } from "react-toastify"

export function LeftSidebar() {
	const { sidebarOpen, toggleSidebar, setSidebarOpen } = useSidebarStore()
	// const { showBacklog, toggleBacklog } = useBacklogStore()

	const pb = usePocketBase()
	const navigate = useNavigate()
	const location = useLocation()

	const isOnDashboard =
		location.pathname === "/dashboard" || location.pathname === "/"
	const isOnTaskPlanner = location.pathname === "/task-planner"
	const isOnSlotFinder = location.pathname === "/slot-finder"

	const handleNavigate = (path: string) => {
		navigate(path)
		setSidebarOpen(false)
	}

	const handleLogout = () => {
		pb.authStore.clear()
		setSidebarOpen(false)
	}

	const toggleSyncRefresh = async () => {
		await pb.crons.run("generate_tasks_from_calendar")
		toast("Tasks synced")
	}

	return (
		<>
			{sidebarOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-40 md:hidden"
					onClick={toggleSidebar}
				/>
			)}

			<aside
				className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0
          fixed md:relative z-50 md:z-auto
          w-[180px] bg-[#08090A] border-r border-[#252525] flex flex-col h-full
          transition-transform duration-200 ease-in-out
        `}
			>
				<div className="p-3 flex items-center justify-between">
					<div className="flex items-center gap-1.5 text-white font-medium text-sm">
						<img src="/icon.svg" alt="Zero" className="w-5 h-5" />
						Zero
					</div>
					<button
						onClick={toggleSidebar}
						className="md:hidden p-1 hover:bg-[#252525] rounded transition-colors cursor-pointer"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<nav className="flex-1 px-2">
					<div className="space-y-0.5">
						<button
							onClick={() => handleNavigate("/dashboard")}
							className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors cursor-pointer ${
								isOnDashboard
									? "bg-[#252525] text-[#e6e6e6]"
									: "text-[#888] hover:bg-[#1e1e1e] hover:text-[#e6e6e6]"
							}`}
						>
							<Home className="w-4 h-4" />
							Home
						</button>
					</div>

					<div className="mt-6">
						<div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[#555] font-medium">
							Planning
						</div>
						<div className="space-y-0.5 mt-1">
							<button
								onClick={() => handleNavigate("/task-planner")}
								className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors cursor-pointer ${
									isOnTaskPlanner
										? "bg-[#252525] text-[#e6e6e6]"
										: "text-[#888] hover:bg-[#1e1e1e] hover:text-[#e6e6e6]"
								}`}
							>
								<ClipboardList className="w-4 h-4" />
								Task Planner
							</button>
							<button
								onClick={() => handleNavigate("/slot-finder")}
								className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors cursor-pointer ${
									isOnSlotFinder
										? "bg-[#252525] text-[#e6e6e6]"
										: "text-[#888] hover:bg-[#1e1e1e] hover:text-[#e6e6e6]"
								}`}
							>
								<BetweenHorizontalEnd className="w-4 h-4" />
								Slot Finder
							</button>
						</div>
					</div>
					<div className="mt-6">
						<div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[#555] font-medium">
							Misc.
						</div>
						<div className="space-y-0.5 mt-1">
							{/* <button
								onClick={toggleBacklog}
								className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors cursor-pointer ${
									showBacklog
										? "bg-[#252525] text-[#e6e6e6]"
										: "text-[#888] hover:bg-[#1e1e1e] hover:text-[#e6e6e6]"
								}`}
							>
								<Archive className="w-4 h-4" />
								Backlog
							</button> */}
							<button
								onClick={toggleSyncRefresh}
								className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors cursor-pointer text-[#888] hover:bg-[#1e1e1e] hover:text-[#e6e6e6]`}
							>
								<CalendarSync className="w-4 h-4" />
								Resync
							</button>
						</div>
					</div>
				</nav>
				<nav className="px-2 pb-2">
					<div className="space-y-0.5 mt-1">
						<button
							onClick={() => handleNavigate("/settings")}
							className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors cursor-pointer text-[#888] hover:bg-[#1e1e1e] hover:text-[#e6e6e6]"
						>
							<Settings className="w-4 h-4" />
							Settings
						</button>
						<button
							onClick={handleLogout}
							className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors cursor-pointer text-[#888] hover:bg-[#1e1e1e] hover:text-[#e6e6e6]"
						>
							<LogOut className="w-4 h-4" />
							Logout
						</button>
					</div>
				</nav>
			</aside>
		</>
	)
}
