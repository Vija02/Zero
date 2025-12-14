import { usePbMutations } from "@/api/usePbMutations"
import { usePbOne } from "@/api/usePbQueries"
import { Calendar } from "@/components/ui/calendar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import useHotkeys from "@reecelucas/react-use-hotkeys"
import { format } from "date-fns"
import {
	Calendar as CalendarIcon,
	CheckCircle2,
	Circle,
	MoreHorizontal,
	Trash2,
	X,
} from "lucide-react"
import { useEffect, useState } from "react"

interface TaskDetailModalProps {
	taskId: string
	onClose: () => void
}

export function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
	const { data: task, isLoading } = usePbOne("tasks", taskId)
	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")

	// const isActive = activeTask?.task.id === task.id
	const {
		update: { mutate: updateTask },
		deleteRecord: { mutate: deleteTask },
	} = usePbMutations("tasks")

	// Initialize title and description when task is loaded
	useEffect(() => {
		if (task) {
			setTitle(task.title)
			setDescription(task.description || "")
		}
	}, [task])

	const handleTitleBlur = () => {
		if (task && title !== task.title) {
			updateTask({ id: task.id, title })
		}
	}

	const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.currentTarget.blur()
		}
	}

	const handleDescriptionBlur = () => {
		if (task && description !== (task.description || "")) {
			updateTask({ id: task.id, description })
		}
	}

	const handleDescriptionKeyDown = (
		e: React.KeyboardEvent<HTMLTextAreaElement>,
	) => {
		if (e.key === "Escape") {
			e.currentTarget.blur()
		}
	}

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

	const handleDueDateSelect = (date: Date | undefined) => {
		if (task) {
			updateTask({
				id: task.id,
				due_date: date ? format(date, "yyyy-MM-dd") : "",
			})
		}
	}

	useHotkeys("Escape", () => {
		onClose()
	})

	// const handlePlayClick = () => {
	// 	if (isActive) {
	// 		stopTask()
	// 	} else {
	// 		startTask(task, dayKey)
	// 	}
	// }

	if (isLoading) {
		return (
			<div
				className="fixed inset-0 z-50 flex items-center justify-center px-4"
				onClick={onClose}
			>
				<div className="absolute inset-0 bg-black/60" />
				<div
					className="relative w-full max-w-[540px] h-[85vh] sm:h-[70vh] bg-[#1e1e1e] rounded-lg shadow-2xl border border-[#333] overflow-hidden flex flex-col"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="flex items-center justify-between px-4 py-2.5 border-b border-[#333] bg-[#1a1a1a]">
						<div className="flex items-center gap-2">
							<div className="h-4 w-16 bg-[#333] rounded animate-pulse" />
						</div>
						<button
							className="p-1 text-[#666] hover:text-[#e6e6e6] hover:bg-[#333] rounded"
							onClick={onClose}
						>
							<X className="w-4 h-4" />
						</button>
					</div>
					<div className="px-4 py-8 flex flex-col items-center justify-center">
						<div className="w-8 h-8 border-2 border-[#333] border-t-[#666] rounded-full animate-spin mb-4" />
						<p className="text-[#888] text-sm">Loading task...</p>
					</div>
				</div>
			</div>
		)
	}

	if (!task) {
		return (
			<div
				className="fixed inset-0 z-50 flex items-center justify-center px-4"
				onClick={onClose}
			>
				<div className="absolute inset-0 bg-black/60" />
				<div
					className="relative w-full max-w-[540px] h-[85vh] sm:h-[70vh] bg-[#1e1e1e] rounded-lg shadow-2xl border border-[#333] overflow-hidden flex flex-col"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="flex items-center justify-between px-4 py-2.5 border-b border-[#333] bg-[#1a1a1a]">
						<div className="flex items-center gap-2">
							<span className="text-sm text-[#666]">Error</span>
						</div>
						<button
							className="p-1 text-[#666] hover:text-[#e6e6e6] hover:bg-[#333] rounded"
							onClick={onClose}
						>
							<X className="w-4 h-4" />
						</button>
					</div>
					<div className="px-4 py-8 flex flex-col items-center justify-center">
						<div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
							<X className="w-6 h-6 text-red-500" />
						</div>
						<h3 className="text-[#e6e6e6] font-medium mb-2">Task not found</h3>
						<p className="text-[#888] text-sm text-center mb-6">
							The task you're looking for doesn't exist or couldn't be loaded.
						</p>
						<button
							onClick={onClose}
							className="px-4 py-2 bg-[#333] hover:bg-[#444] text-[#e6e6e6] rounded transition-colors"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center px-4"
			onClick={onClose}
		>
			<div className="absolute inset-0 bg-black/60" />
			<div
				className="relative w-full max-w-[540px] h-[85vh] sm:h-[70vh] bg-[#1e1e1e] rounded-lg shadow-2xl border border-[#333] overflow-hidden flex flex-col"
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
						<Popover>
							<PopoverTrigger className="text-xs text-[#999] hover:text-[#e6e6e6] flex items-center">
								<CalendarIcon className="w-3 h-3 mr-1" />
								{task.due_date
									? `Due: ${format(new Date(task.due_date), "MMM d")}`
									: "Due"}
							</PopoverTrigger>
							<PopoverContent
								className="w-auto p-0 bg-[#1e1e1e] border-[#333] z-[60] dark"
								align="end"
							>
								<Calendar
									mode="single"
									selected={task.due_date ? new Date(task.due_date) : undefined}
									onSelect={handleDueDateSelect}
									initialFocus
									className="bg-[#1e1e1e] text-[#e6e6e6]"
								/>
							</PopoverContent>
						</Popover>
						<button className="text-xs text-[#999] hover:text-[#e6e6e6]">
							Add subtasks
						</button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button className="p-1 text-[#666] hover:text-[#e6e6e6] hover:bg-[#333] rounded">
									<MoreHorizontal className="w-4 h-4" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="bg-[#1e1e1e] border-[#333]"
							>
								<DropdownMenuItem
									onClick={handleDelete}
									className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
								>
									<Trash2 className="w-4 h-4 mr-2" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<button
							className="p-1 text-[#666] hover:text-[#e6e6e6] hover:bg-[#333] rounded"
							onClick={onClose}
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				</div>

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
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							onBlur={handleTitleBlur}
							onKeyDown={handleTitleKeyDown}
							className={`text-lg md:text-xl font-medium flex-1 border-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${
								task.completed ? "text-[#555] line-through" : "text-[#e6e6e6]"
							}`}
						/>
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
				<div className="px-4 py-3 border-b border-[#333] flex-1 overflow-hidden">
					<Textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						onBlur={handleDescriptionBlur}
						onKeyDown={handleDescriptionKeyDown}
						placeholder="Notes..."
						className="w-full h-full bg-transparent text-sm text-[#888] placeholder-[#555] border-none px-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 overflow-y-auto"
					/>
				</div>

				{/* Footer */}
				<div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-xs text-[#666]">
					<CalendarIcon className="w-3.5 h-3.5" />
					<span>
						Created {format(new Date(task.created), "MMM d, hh:mmbbb")}
					</span>
				</div>
			</div>
		</div>
	)
}
