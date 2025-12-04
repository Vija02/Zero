import type React from "react"
import { useRef, useState, useCallback, MutableRefObject } from "react"
import { Plus, Circle, CheckCircle2, RefreshCw } from "lucide-react"
import { useTaskManager } from "./task-manager"
import { format, isSameDay } from "date-fns"
import { usePbFullList } from "@/api/usePbQueries"
import { TasksResponse } from "@/pocketbase-types"
import { usePbMutations } from "@/api/usePbMutations"
import { useDrag, useDrop } from "react-dnd"

const ITEM_TYPE = "TASK"

interface DragItem {
	id: string
	order: number
	day: Date
	index: number
	completed: boolean
}

// Calculate new order when dropping
const calculateNewOrder = (
	dropIndex: number,
	incompleteTasks: TasksResponse<unknown>[],
): number => {
	if (incompleteTasks.length === 0) {
		return 1000
	}

	// Dropping at the top (index 0)
	if (dropIndex === 0) {
		const topTask = incompleteTasks[0]
		return topTask.order + 1000
	}

	// Dropping at the end of incomplete tasks
	if (dropIndex >= incompleteTasks.length) {
		const bottomTask = incompleteTasks[incompleteTasks.length - 1]
		return bottomTask.order / 2
	}

	// Dropping in the middle - get the order between two adjacent incomplete tasks
	const taskAbove = incompleteTasks[dropIndex - 1]
	const taskBelow = incompleteTasks[dropIndex]
	return (taskAbove.order + taskBelow.order) / 2
}

interface DayColumnProps {
	day: Date
	progress?: number
}

const totalTime = "10:00"

export function DayColumn({ day, progress }: DayColumnProps) {
	const { openAddTask } = useTaskManager()

	const { data } = usePbFullList("tasks")
	const currentDayData = data?.filter((x) => isSameDay(x.allocated_date, day))

	// Sort tasks: incomplete first (by order descending), then completed (by order descending)
	const sortedTasks = currentDayData?.sort(
		(a, b) =>
			(a.completed === b.completed ? 0 : a.completed ? 1 : -1) ||
			b.order - a.order,
	)

	// Get only incomplete tasks for order calculations
	const incompleteTasks = sortedTasks?.filter((t) => !t.completed) ?? []

	return (
		<div className="flex-1 min-w-0 sm:min-w-[250px] sm:w-[250px] sm:flex-none flex flex-col border-r border-[#252525] last:border-r-0">
			<div className="p-3 pb-2">
				<div className="flex items-baseline justify-between">
					<h2 className="text-base font-medium text-[#e6e6e6]">
						{format(day, "EEEE")}
					</h2>
				</div>
				<p className="text-xs text-[#555] mt-0.5">{format(day, "MMMM d")}</p>
				{progress !== undefined && (
					<div className="mt-2 h-1.5 bg-[#252525] rounded-full overflow-hidden">
						<div
							className="h-full bg-[#22c55e] rounded-full"
							style={{ width: `${progress}%` }}
						/>
					</div>
				)}
			</div>

			<div className="px-2 mb-2">
				<button
					onClick={() => openAddTask(day)}
					className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-[#555] hover:text-[#888] hover:bg-[#1e1e1e] hover:border-[#555] rounded border border-dashed border-[#333] transition-all cursor-pointer"
				>
					<span className="flex items-center gap-1.5">
						<Plus className="w-3.5 h-3.5" />
						Add task
					</span>
					{totalTime && (
						<span className="text-xs text-[#555]">{totalTime}</span>
					)}
				</button>
			</div>

			<TasksDropZone
				day={day}
				sortedTasks={sortedTasks}
				incompleteTasks={incompleteTasks}
			/>
		</div>
	)
}

interface TasksDropZoneProps {
	day: Date
	sortedTasks: TasksResponse<unknown>[] | undefined
	incompleteTasks: TasksResponse<unknown>[]
}

function TasksDropZone({
	day,
	sortedTasks,
	incompleteTasks,
}: TasksDropZoneProps) {
	const containerRef = useRef<HTMLDivElement | null>(
		null,
	) as MutableRefObject<HTMLDivElement | null>
	const [dropIndex, setDropIndex] = useState<number | null>(null)

	const {
		update: { mutate: updateTask },
	} = usePbMutations("tasks")

	const [{ isOver }, dropRef] = useDrop({
		accept: ITEM_TYPE,
		hover: (item: DragItem, monitor) => {
			if (!containerRef.current) return

			const clientOffset = monitor.getClientOffset()
			if (!clientOffset) return

			// Calculate which index to drop at based on mouse Y position
			const containerRect = containerRef.current.getBoundingClientRect()
			const y =
				clientOffset.y - containerRect.top + containerRef.current.scrollTop

			// Find the drop index based on the task card positions
			const cards = containerRef.current.querySelectorAll("[data-task-id]")
			let newDropIndex = incompleteTasks.length // Default to end of incomplete tasks

			for (let i = 0; i < cards.length; i++) {
				const card = cards[i] as HTMLElement
				const cardRect = card.getBoundingClientRect()
				const cardTop =
					cardRect.top - containerRect.top + containerRef.current.scrollTop
				const cardMiddle = cardTop + cardRect.height / 2

				// Check if this is a completed task - if so, we've reached the end of incomplete tasks
				const taskId = card.getAttribute("data-task-id")
				const task = sortedTasks?.find((t) => t.id === taskId)
				if (task?.completed) {
					break
				}

				if (y < cardMiddle) {
					newDropIndex = i
					break
				} else {
					newDropIndex = i + 1
				}
			}

			// Clamp to incomplete tasks length
			newDropIndex = Math.min(newDropIndex, incompleteTasks.length)

			// Check if this would result in no change (for same-day moves)
			const isSameDay_ = isSameDay(item.day, day)
			if (isSameDay_ && !item.completed) {
				// Dragging from index i to position i or i+1 results in no visual change
				if (item.index === newDropIndex || item.index === newDropIndex - 1) {
					setDropIndex(null)
					return
				}
			}

			setDropIndex(newDropIndex)
		},
		drop: (item: DragItem) => {
			if (dropIndex === null) return

			const isSameDay_ = isSameDay(item.day, day)

			// Check if this would result in no change
			if (isSameDay_ && !item.completed) {
				if (item.index === dropIndex || item.index === dropIndex - 1) {
					return
				}
			}

			const newOrder = calculateNewOrder(dropIndex, incompleteTasks)

			if (isSameDay_) {
				updateTask({ id: item.id, order: newOrder })
			} else {
				updateTask({
					id: item.id,
					order: newOrder,
					allocated_date: format(day, "yyyy-MM-dd"),
				})
			}
		},
		collect: (monitor) => ({
			isOver: monitor.isOver(),
		}),
	})

	// Reset drop index when not hovering
	const prevIsOver = useRef(isOver)
	if (prevIsOver.current && !isOver) {
		if (dropIndex !== null) setDropIndex(null)
	}
	prevIsOver.current = isOver

	// Combine refs
	const setRefs = useCallback(
		(node: HTMLDivElement | null) => {
			containerRef.current = node
			dropRef(node)
		},
		[dropRef],
	)

	return (
		<div ref={setRefs} className="flex-1 overflow-y-auto px-2 pb-2">
			{/* Show indicator at the top of the list (dropIndex === 0 with tasks) */}
			{isOver && dropIndex === 0 && incompleteTasks.length > 0 && (
				<div className="h-1 bg-[#6366f1] rounded-full mb-1.5" />
			)}
			{sortedTasks?.map((task, index) => {
				const incompleteIndex = incompleteTasks.findIndex(
					(t) => t.id === task.id,
				)
				// Don't show indicator for dropIndex === 0, we render it above the list instead
				const showIndicatorAbove =
					isOver &&
					dropIndex !== null &&
					dropIndex !== 0 &&
					!task.completed &&
					incompleteIndex === dropIndex
				// Show indicator before the first completed task (when dropIndex === incompleteTasks.length)
				const isFirstCompletedTask =
					task.completed && (index === 0 || !sortedTasks[index - 1]?.completed)
				const showIndicatorBeforeCompleted =
					isOver &&
					dropIndex === incompleteTasks.length &&
					incompleteTasks.length > 0 &&
					isFirstCompletedTask

				return (
					<div key={task.id} data-task-id={task.id} className="relative mb-1.5">
						{showIndicatorAbove && (
							<div className="absolute -top-[5px] left-0 right-0 h-1 bg-[#6366f1] rounded-full z-10" />
						)}
						{showIndicatorBeforeCompleted && (
							<div className="absolute -top-[5px] left-0 right-0 h-1 bg-[#6366f1] rounded-full z-10" />
						)}
						<TaskCard
							task={task}
							day={day}
							index={incompleteIndex !== -1 ? incompleteIndex : index}
						/>
					</div>
				)
			})}
			{/* Show indicator at the end when there are only incomplete tasks (no completed tasks) */}
			{isOver &&
				dropIndex === incompleteTasks.length &&
				incompleteTasks.length > 0 &&
				!sortedTasks?.some((t) => t.completed) && (
					<div className="h-1 bg-[#6366f1] rounded-full mb-1.5" />
				)}
			{/* Show indicator when dropping into empty list */}
			{isOver && dropIndex === 0 && incompleteTasks.length === 0 && (
				<div className="h-1 bg-[#6366f1] rounded-full mb-1.5" />
			)}
			{/* Empty drop zone at the end for better UX */}
			<div className="h-8" />
		</div>
	)
}

interface TaskCardProps {
	task: TasksResponse<unknown>
	day: Date
	index: number
}

function TaskCard({ task, day, index }: TaskCardProps) {
	const { openTaskDetail } = useTaskManager()
	const tagColor = "#666"

	const {
		update: { mutate: updateTask },
	} = usePbMutations("tasks")

	const [{ isDragging }, dragRef] = useDrag({
		type: ITEM_TYPE,
		item: (): DragItem => ({
			id: task.id,
			order: task.order,
			day: day,
			index: index,
			completed: task.completed,
		}),
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	})

	const handleCheckClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		updateTask({ id: task.id, completed: !task.completed })
	}

	return (
		<div
			ref={dragRef}
			className={`bg-[#1a1a1a] rounded-md p-2.5 hover:bg-[#222] cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-[#333] ${
				isDragging ? "opacity-50 scale-95" : ""
			}`}
			onClick={() => openTaskDetail(task.id)}
		>
			{/* {task.scheduledTime && (
				<div className="flex items-center justify-between mb-1">
					<span className="text-[10px] text-[#666]">{task.scheduledTime}</span>
					<span className="text-[10px] text-[#888] bg-[#252525] px-1.5 py-0.5 rounded">
						{task.time}
					</span>
				</div>
			)} */}

			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<span
						className={`text-sm ${
							task.completed ? "text-[#555] line-through" : "text-[#e6e6e6]"
						}`}
					>
						{task.title}
					</span>
					{/* {!task.scheduledTime && (
						<span className="text-[10px] text-[#888] bg-[#252525] px-1.5 py-0.5 rounded flex-shrink-0 flex items-center gap-0.5">
							{task.time}
							{task.hasNotification && (
								<span className="w-1.5 h-1.5 bg-[#ef4444] rounded-full" />
							)}
						</span>
					)} */}
				</div>

				{/* {task.subtask && (
					<div className="flex items-center gap-1.5 mt-1.5">
						<Circle className="w-3 h-3 text-[#444]" />
						<span className="text-xs text-[#e6e6e6]">{task.subtask}</span>
					</div>
				)} */}

				{/* {task.subtaskCount && (
					<span className="text-xs text-[#555] mt-1 block">
						{task.subtaskCount}
					</span>
				)} */}

				<div className="flex items-center justify-between mt-2">
					<div className="flex items-center gap-2">
						<button
							onClick={handleCheckClick}
							className="flex-shrink-0 hover:scale-110 transition-transform cursor-pointer"
						>
							{task.completed ? (
								<CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
							) : (
								<Circle className="w-4 h-4 text-[#444] hover:text-[#666]" />
							)}
						</button>
						{task.carry_over > 0 && (
							<div
								className="relative flex items-center justify-center"
								title={`Carried over ${task.carry_over} time${
									task.carry_over > 1 ? "s" : ""
								}`}
							>
								<RefreshCw className="w-5 h-5 opacity-30" />
								<span className="absolute text-[10px] font-bold opacity-30">
									{task.carry_over}
								</span>
							</div>
						)}
					</div>
					<span
						className="text-[10px] px-1.5 py-0.5 rounded"
						style={{ color: tagColor }}
					>
						{/* # {task.tag} */}
					</span>
				</div>
			</div>
		</div>
	)
}
