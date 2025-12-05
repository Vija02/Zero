"use client"

import type React from "react"
import { useState } from "react"
import { Search, Plus, Circle, CheckCircle2, X } from "lucide-react"
import { useBacklogStore } from "@/stores/useBacklogStore"

interface BacklogTask {
	id: string
	title: string
	time?: string
	tag: string
	subtaskCount?: string
	dueDate?: string
	completed?: boolean
}

const initialBacklogTasks: BacklogTask[] = [
	{ id: "b1", title: "New Sunsama", time: "0:10", tag: "Chores" },
	{ id: "b2", title: "Update Website", time: "0:10", tag: "Church" },
	{ id: "b3", title: "IG", tag: "" },
	{ id: "b4", title: "Research Run plan", time: "0:20", tag: "Church" },
	{ id: "b5", title: "Process HF pictures", time: "0:30", tag: "Church" },
	{
		id: "b6",
		title: "Auto start synology drive",
		time: "0:10",
		tag: "Personal",
	},
	{ id: "b7", title: "Transfer HTB ISA", time: "0:05", tag: "Personal" },
	{
		id: "b8",
		title: "Hard drive backup",
		time: "0:10",
		tag: "Personal",
		subtaskCount: "5 subtasks",
	},
	{
		id: "b9",
		title: "Operation Sabina",
		time: "1:01",
		tag: "Personal",
		dueDate: "Jan 16",
	},
	{ id: "b10", title: "Quiz Button", time: "0:10", tag: "Personal" },
]

const tagColors: Record<string, string> = {
	Church: "#6366f1",
	Personal: "#22c55e",
	Chores: "#eab308",
}

export function BacklogPanel() {
	const [tasks, setTasks] = useState(initialBacklogTasks)
	const { toggleBacklog } = useBacklogStore()

	const toggleComplete = (taskId: string) => {
		setTasks((prev) =>
			prev.map((task) =>
				task.id === taskId ? { ...task, completed: !task.completed } : task,
			),
		)
	}

	return (
		<>
			<div
				className="fixed inset-0 bg-black/50 z-40 sm:hidden"
				onClick={toggleBacklog}
			/>

			<div
				className={`
          fixed sm:relative inset-0 sm:inset-auto z-50 sm:z-auto
          w-full sm:w-[260px] 
          border-l border-[#252525] flex flex-col bg-[#151515]
          sm:rounded-none rounded-t-xl sm:rounded-none
        `}
			>
				<div className="sm:hidden flex justify-center pt-2 pb-1">
					<div className="w-10 h-1 bg-[#444] rounded-full" />
				</div>

				<div className="p-3 border-b border-[#252525]">
					<div className="flex items-center justify-between">
						<h2 className="text-base font-medium text-[#e6e6e6]">Backlog</h2>
						<div className="flex items-center gap-2">
							<button className="flex items-center gap-1 text-xs text-[#555] hover:text-[#999] transition-colors">
								<Search className="w-3.5 h-3.5" />
								Search
							</button>
							<button
								onClick={toggleBacklog}
								className="text-[#555] hover:text-[#999] hover:bg-[#252525] p-1 rounded transition-colors"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
					</div>
					<div className="text-xs text-[#555] mt-0.5"># all</div>
				</div>

				<div className="px-3 py-2">
					<button className="w-full flex items-center gap-1.5 px-2 py-1.5 text-sm text-[#555] hover:text-[#888] hover:bg-[#1e1e1e] hover:border-[#444] rounded border border-dashed border-[#333] transition-all">
						<Plus className="w-3.5 h-3.5" />
						Add a task
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
					{tasks.map((task) => (
						<BacklogTaskCard
							key={task.id}
							task={task}
							onToggle={() => toggleComplete(task.id)}
						/>
					))}
				</div>
			</div>
		</>
	)
}

function BacklogTaskCard({
	task,
	onToggle,
}: {
	task: BacklogTask
	onToggle: () => void
}) {
	const tagColor = tagColors[task.tag] || "#666"

	const handleCheckClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		onToggle()
	}

	return (
		<div className="bg-[#1a1a1a] rounded-md p-2.5 hover:bg-[#222] cursor-pointer transition-colors border border-transparent hover:border-[#333]">
			<div className="flex items-start justify-between gap-2">
				<span
					className={`text-sm ${
						task.completed ? "text-[#555] line-through" : "text-[#e6e6e6]"
					}`}
				>
					{task.title}
				</span>
				{task.time && (
					<span className="text-[10px] text-[#888] bg-[#252525] px-1.5 py-0.5 rounded flex-shrink-0">
						{task.time}
					</span>
				)}
			</div>

			{task.subtaskCount && (
				<span className="text-xs text-[#555] mt-1 block">
					{task.subtaskCount}
				</span>
			)}

			<div className="flex items-center justify-between mt-2">
				<div className="flex items-center gap-1">
					<button
						onClick={handleCheckClick}
						className="hover:scale-110 transition-transform"
					>
						{task.completed ? (
							<CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
						) : (
							<Circle className="w-3.5 h-3.5 text-[#444] hover:text-[#666]" />
						)}
					</button>
					{task.dueDate && (
						<span className="text-[10px] text-[#666]">{task.dueDate}</span>
					)}
				</div>
				{task.tag && (
					<span
						className="text-[10px] px-1.5 py-0.5 rounded"
						style={{ color: tagColor }}
					>
						# {task.tag}
					</span>
				)}
			</div>
		</div>
	)
}
