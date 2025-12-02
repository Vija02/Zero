import type React from "react"
import { Plus, Circle, CheckCircle2 } from "lucide-react"
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

	const {
		update: { mutate: updateTask },
	} = usePbMutations("tasks")

	// Sort tasks: incomplete first (by order descending), then completed (by order descending)
	const sortedTasks = currentDayData?.sort(
		(a, b) =>
			(a.completed === b.completed ? 0 : a.completed ? 1 : -1) ||
			b.order - a.order,
	)

	// Get only incomplete tasks for order calculations
	const incompleteTasks = sortedTasks?.filter((t) => !t.completed) ?? []

	// Drop zone for the column (when dropping at the end) - places at end of incomplete tasks
	const [{ isOver }, dropRef] = useDrop({
		accept: ITEM_TYPE,
		drop: (item: DragItem, monitor) => {
			// If already handled by a TaskCardWrapper, don't handle again
			if (monitor.didDrop()) return

			const newOrder = calculateNewOrder(incompleteTasks.length, incompleteTasks)
			const isSameDay_ = isSameDay(item.day, day)
			
			// If same day and dragging from the last incomplete position, no change needed
			const lastIncompleteIndex = incompleteTasks.length - 1
			if (isSameDay_ && item.index === lastIncompleteIndex && !item.completed) {
				return
			}
			
			if (isSameDay_) {
				// Just update order
				updateTask({ id: item.id, order: newOrder })
			} else {
				// Update both order and allocated_date
				updateTask({
					id: item.id,
					order: newOrder,
					allocated_date: format(day, "yyyy-MM-dd")
				})
			}
		},
		collect: (monitor) => ({
			isOver: monitor.isOver({ shallow: true }),
		}),
	})

	return (
		<div
			ref={dropRef}
			className={`flex-1 min-w-0 sm:min-w-[250px] sm:w-[250px] sm:flex-none flex flex-col border-r border-[#252525] last:border-r-0 ${
				isOver ? "bg-[#1e1e1e]" : ""
			}`}
		>
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

			<div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1.5">
				{sortedTasks?.map((task, index) => (
					<TaskCardWrapper
						key={task.id}
						task={task}
						day={day}
						index={index}
						incompleteTasks={incompleteTasks}
					/>
				))}
				{/* Empty drop zone at the end for better UX */}
				<div className="h-8" />
			</div>
		</div>
	)
}

interface TaskCardWrapperProps {
	task: TasksResponse<unknown>
	day: Date
	index: number
	incompleteTasks: TasksResponse<unknown>[]
}

function TaskCardWrapper({ task, day, index, incompleteTasks }: TaskCardWrapperProps) {
	const {
		update: { mutate: updateTask },
	} = usePbMutations("tasks")

	// Get the index within incomplete tasks (for order calculation)
	const incompleteIndex = incompleteTasks.findIndex((t) => t.id === task.id)
	
	const [{ isOver, canShowIndicator }, dropRef] = useDrop({
		accept: ITEM_TYPE,
		drop: (item: DragItem) => {
			// Don't do anything if dropping on itself
			if (item.id === task.id) return

			const isSameDay_ = isSameDay(item.day, day)

			// If dropping on a completed task, place at end of incomplete tasks
			if (task.completed) {
				const newOrder = calculateNewOrder(incompleteTasks.length, incompleteTasks)
				if (isSameDay_) {
					updateTask({ id: item.id, order: newOrder })
				} else {
					updateTask({
						id: item.id,
						order: newOrder,
						allocated_date: format(day, "yyyy-MM-dd"),
					})
				}
				return
			}

			// If same day, check if the drop would result in no visual change
			// Dropping at incompleteIndex means "place before this item"
			// If dragging from index i, dropping at i or i+1 results in no change
			if (isSameDay_ && !item.completed && (item.index === incompleteIndex || item.index === incompleteIndex - 1)) {
				return
			}

			const newOrder = calculateNewOrder(incompleteIndex, incompleteTasks)

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
		collect: (monitor) => {
			const item = monitor.getItem() as DragItem | null
			const isOver = monitor.isOver()
			if (!item) return { isOver, canShowIndicator: true }
			
			// If target is completed task, always allow drop indicator
			if (task.completed) {
				return { isOver, canShowIndicator: true }
			}
			
			const isSameDay_ = isSameDay(item.day, day)
			// Don't show indicator if this would result in no change
			if (isSameDay_ && !item.completed && (item.index === incompleteIndex || item.index === incompleteIndex - 1)) {
				return { isOver, canShowIndicator: false }
			}
			return { isOver, canShowIndicator: true }
		},
	})

	return (
		<div ref={dropRef} className="relative">
			{isOver && canShowIndicator && (
				<div className="absolute -top-[5px] left-0 right-0 h-1 bg-[#6366f1] rounded-full z-10" />
			)}
			<TaskCard task={task} day={day} index={index} />
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
