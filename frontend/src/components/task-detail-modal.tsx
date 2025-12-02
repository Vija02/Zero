import {
	X,
	Maximize2,
	MoreHorizontal,
	Circle,
	CheckCircle2,
	Play,
	Square,
	Paperclip,
	Calendar,
	ChevronLeft,
	ChevronRight,
	Trash2,
} from "lucide-react"
import { useTaskManager, type Task } from "./task-manager"
import { usePbOne } from "@/api/usePbQueries"
import { format } from "date-fns"
import { usePbMutations } from "use-pocketbase"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TaskDetailModalProps {
	taskId: string
	onClose: () => void
}

const tagColors: Record<string, string> = {
	Church: "#6366f1",
	Personal: "#22c55e",
	Chores: "#eab308",
}

export function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
	const { toggleTaskComplete, activeTask, startTask, stopTask, elapsedTime } =
		useTaskManager()

	const { data: task, isLoading } = usePbOne("tasks", taskId)

	// const tagColor = tagColors[task.tag] || "#666"

	// const isActive = activeTask?.task.id === task.id
	const {
		update: { mutate: updateTask },
		deleteRecord: { mutate: deleteTask },
	} = usePbMutations("tasks")

	const handleDelete = () => {
		if (task) {
			deleteTask(task.id)
			onClose()
		}
	}

	const handleCheckClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (task) {
			updateTask({ id: task.id, completed: !task.completed })
		}
	}
	// const handleCheckClick = () => {
	// 	// toggleTaskComplete(taskId, task.id)
	// }

	// const handlePlayClick = () => {
	// 	if (isActive) {
	// 		stopTask()
	// 	} else {
	// 		startTask(task, dayKey)
	// 	}
	// }

	if (isLoading) {
		return <p>Loading...</p>
	}
	if (!task) {
		return <p>ERROR</p>
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4"
			onClick={onClose}
		>
			<div className="absolute inset-0 bg-black/60" />
			<div
				className="relative w-full max-w-[540px] bg-[#1e1e1e] rounded-lg shadow-2xl border border-[#333] overflow-hidden"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-4 py-2.5 border-b border-[#333] bg-[#1a1a1a]">
					<div className="flex items-center gap-2">
						{/* <span className="text-sm" style={{ color: tagColor }}>
							# {task.tag}
						</span> */}
					</div>
					<div className="flex items-center gap-3">
						<button className="text-xs text-[#999] hover:text-[#e6e6e6]">
							Start: Nov 30
						</button>
						<button className="text-xs text-[#999] hover:text-[#e6e6e6]">
							Due
						</button>
						<button className="text-xs text-[#999] hover:text-[#e6e6e6]">
							Add subtasks
						</button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button className="p-1 text-[#666] hover:text-[#e6e6e6] hover:bg-[#333] rounded">
									<MoreHorizontal className="w-4 h-4" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="bg-[#1e1e1e] border-[#333]">
								<DropdownMenuItem
									onClick={handleDelete}
									className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
								>
									<Trash2 className="w-4 h-4 mr-2" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						{/* <button className="p-1 text-[#666] hover:text-[#e6e6e6] hover:bg-[#333] rounded">
							<Maximize2 className="w-4 h-4" />
						</button> */}
						<button
							className="p-1 text-[#666] hover:text-[#e6e6e6] hover:bg-[#333] rounded"
							onClick={onClose}
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Recurring task notice */}
				{/* {task.isRecurring && (
					<div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-[#333]">
						<span className="text-xs text-[#888]">
							This task repeats every week on Sunday.{" "}
							<button className="text-[#3b82f6] hover:underline">
								Edit task series.
							</button>
						</span>
						<div className="flex items-center gap-2">
							<button className="flex items-center gap-1 text-xs text-[#888] hover:text-[#e6e6e6]">
								<ChevronLeft className="w-3 h-3" />
								Previous
							</button>
							<button className="flex items-center gap-1 text-xs text-[#888] hover:text-[#e6e6e6]">
								Next
								<ChevronRight className="w-3 h-3" />
							</button>
						</div>
					</div>
				)} */}

				{/* Task title section */}
				<div className="px-4 py-4 border-b border-[#333]">
					<div className="flex items-center gap-3">
						<button
							onClick={handleCheckClick}
							className="flex-shrink-0 hover:scale-110 transition-transform"
						>
							{task.completed ? (
								<CheckCircle2 className="w-6 h-6 text-[#22c55e]" />
							) : (
								<Circle className="w-6 h-6 text-[#555] hover:text-[#888]" />
							)}
						</button>
						<h2
							className={`text-lg font-medium flex-1 ${
								task.completed ? "text-[#555] line-through" : "text-[#e6e6e6]"
							}`}
						>
							{task.title}
						</h2>
						{/* <button
							onClick={handlePlayClick}
							className={`p-1.5 rounded transition-colors ${
								isActive
									? "text-[#ef4444] hover:bg-[#333]"
									: "text-[#666] hover:text-[#e6e6e6] hover:bg-[#333]"
							}`}
						>
							{isActive ? (
								<Square className="w-4 h-4" />
							) : (
								<Play className="w-4 h-4" />
							)}
						</button>
						<div className="text-right text-xs">
							<div className="text-[#666]">ACTUAL</div>
							<div className={isActive ? "text-[#22c55e]" : "text-[#888]"}>
								{isActive
									? formatTime(elapsedTime)
									: task.actualTime
									? formatTime(task.actualTime)
									: "--:--"}
							</div>
						</div> */}
						<div className="text-right text-xs">
							<div className="text-[#666]">PLANNED</div>
							<div className="text-[#e6e6e6]">
								{/* {task.time?.split(" / ")[0] || task.time} */}
							</div>
						</div>
					</div>
				</div>

				{/* Notes section */}
				<div className="px-4 py-3 min-h-[120px] border-b border-[#333]">
					<input
						type="text"
						placeholder="Notes..."
						defaultValue={task.description}
						className="w-full bg-transparent text-sm text-[#888] placeholder-[#555] outline-none"
					/>
				</div>

				{/* Footer */}
				<div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-xs text-[#666]">
					<Calendar className="w-3.5 h-3.5" />
					<span>
						Created {format(new Date(task.created), "MMM d, hh:mmbbb")}
					</span>
				</div>
			</div>
		</div>
	)
}
