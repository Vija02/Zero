"use client"

import {
	Home,
	ListTodo,
	Target,
	Archive,
	ChevronDown,
	X,
	LogOut,
} from "lucide-react"
import { useTaskManager } from "./task-manager"
import { useAuthStore } from "@/store/authStore"
import { useNavigate } from "react-router-dom"

const mainNavItems = [
	{ icon: Home, label: "Home", active: true },
	{ icon: ListTodo, label: "Today" },
	{ icon: Target, label: "Focus" },
]

export function LeftSidebar() {
	const { showBacklog, toggleBacklog, sidebarOpen, toggleSidebar } =
		useTaskManager()

	const logout = useAuthStore((state) => state.logout)
	const navigate = useNavigate()

	const handleLogout = () => {
		logout()
		navigate("/login")
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
					<button className="flex items-center gap-1 text-white font-medium text-sm transition-colors">
						Zero
						<ChevronDown className="w-3 h-3 ml-1" />
					</button>
					<button
						onClick={toggleSidebar}
						className="md:hidden p-1 hover:bg-[#252525] rounded transition-colors"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<nav className="flex-1 px-2">
					<div className="space-y-0.5">
						{mainNavItems.map((item) => (
							<button
								key={item.label}
								className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors cursor-pointer ${
									item.active
										? "bg-[#252525] text-[#e6e6e6]"
										: "text-[#888] hover:bg-[#1e1e1e] hover:text-[#e6e6e6]"
								}`}
							>
								<item.icon className="w-4 h-4" />
								{item.label}
							</button>
						))}
					</div>

					<div className="mt-6">
						<div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[#555] font-medium">
							Planning
						</div>
						<div className="space-y-0.5 mt-1">
							<button
								onClick={toggleBacklog}
								className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors cursor-pointer ${
									showBacklog
										? "bg-[#252525] text-[#e6e6e6]"
										: "text-[#888] hover:bg-[#1e1e1e] hover:text-[#e6e6e6]"
								}`}
							>
								<Archive className="w-4 h-4" />
								Backlog
							</button>
						</div>
					</div>
				</nav>
				<nav className="px-2 pb-2">
					<div className="space-y-0.5 mt-1">
						<button
							onClick={handleLogout}
							className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors cursor-pointer`}
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
