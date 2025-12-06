import { CalendarEvent } from "@/api/useGoogleCalendarEvents"
import { usePbFullList } from "@/api/usePbQueries"
import { Input } from "@/components/ui/input"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Calendar, ExternalLink, Plus, X } from "lucide-react"
import { useMemo, useState } from "react"

interface CalendarEventModalProps {
	event: CalendarEvent
	onClose: () => void
}

export function CalendarEventModal({ event, onClose }: CalendarEventModalProps) {
	const queryClient = useQueryClient()
	const [isUpdating, setIsUpdating] = useState(false)
	const [showCreateTask, setShowCreateTask] = useState(false)
	const [daysBefore, setDaysBefore] = useState("1")
	const [customTitle, setCustomTitle] = useState("")
	const [dueDaysBefore, setDueDaysBefore] = useState("")

	// Get access token from settings
	const { data: settings } = usePbFullList("settings")
	const accessToken = useMemo(() => {
		if (!settings) return null
		const tokenSetting = settings.find((s) => s.key === "access_token")
		return tokenSetting?.value || null
	}, [settings])

	const updateDescriptionMutation = useMutation({
		mutationFn: async (newDescription: string) => {
			if (!accessToken) {
				throw new Error("Not authenticated")
			}

			const response = await fetch(
				`https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						description: newDescription,
					}),
				},
			)

			if (!response.ok) {
				throw new Error(`Failed to update event: ${response.statusText}`)
			}

			return response.json()
		},
		onSuccess: () => {
			// Invalidate calendar events to refetch
			queryClient.invalidateQueries({ queryKey: ["googleCalendarEvents"] })
			onClose()
		},
	})

	const handleSkip = async () => {
		setIsUpdating(true)
		const currentDescription = event.description || ""
		const newDescription = currentDescription
			? `${currentDescription}\n@@ignore`
			: "@@ignore"
		
		try {
			await updateDescriptionMutation.mutateAsync(newDescription)
		} finally {
			setIsUpdating(false)
		}
	}

	const handleCreateTask = async () => {
		if (!daysBefore || parseInt(daysBefore) < 0) return

		setIsUpdating(true)
		const currentDescription = event.description || ""
		
		// Build the task block
		let taskBlock = `@@task ${daysBefore}d`
		if (customTitle.trim()) {
			taskBlock += `\n@title ${customTitle.trim()}`
		}
		if (dueDaysBefore.trim() && parseInt(dueDaysBefore) >= 0) {
			taskBlock += `\n@due ${dueDaysBefore}d`
		}

		const newDescription = currentDescription
			? `${currentDescription}\n\n${taskBlock}`
			: taskBlock

		try {
			await updateDescriptionMutation.mutateAsync(newDescription)
		} finally {
			setIsUpdating(false)
		}
	}

	const handleOpenInGoogle = () => {
		if (event.htmlLink) {
			window.open(event.htmlLink, "_blank")
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			onClose()
		}
	}

	const hasTask = event.description?.includes("@@task")
	const isIgnored = event.description?.includes("@@ignore")

	return (
		<div
			className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-24 px-4"
			onClick={onClose}
			onKeyDown={handleKeyDown}
		>
			<div className="absolute inset-0 bg-black/60" />
			<div
				className="relative w-full max-w-[500px] bg-[#1e1e1e] rounded-lg shadow-2xl border border-[#333] overflow-hidden"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#1a1a1a]">
					<span className="text-sm text-[#888]">Calendar Event</span>
					<button
						onClick={onClose}
						className="p-1 text-[#666] hover:text-[#e6e6e6] hover:bg-[#333] rounded transition-colors"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Content */}
				<div className="p-4 space-y-4">
					{/* Event Title */}
					<div>
						<h2 className="text-lg font-medium text-[#e6e6e6]">{event.title}</h2>
					</div>

					{/* Event Time */}
					<div className="flex items-center gap-2 text-sm text-[#888]">
						<Calendar className="w-4 h-4" />
						<span>
							{event.allDay
								? format(event.start, "EEEE, MMMM d, yyyy")
								: `${format(event.start, "EEEE, MMMM d, yyyy")} • ${format(event.start, "HH:mm")} - ${format(event.end, "HH:mm")}`}
						</span>
					</div>

					{/* Status badges */}
					<div className="flex gap-2">
						{hasTask && (
							<span className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400">
								Has Task
							</span>
						)}
						{isIgnored && (
							<span className="px-2 py-1 text-xs rounded bg-gray-500/20 text-gray-400">
								Ignored
							</span>
						)}
						{!hasTask && !isIgnored && (
							<span className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400">
								No Task
							</span>
						)}
					</div>

					{/* Description */}
					{event.description && (
						<div className="text-sm text-[#888] bg-[#1a1a1a] rounded p-3 max-h-32 overflow-y-auto">
							<pre className="whitespace-pre-wrap font-sans">{event.description}</pre>
						</div>
					)}
	
					{/* Create Task Section */}
					{!hasTask && !isIgnored && (
						<div className="border-t border-[#333] pt-4">
							{!showCreateTask ? (
								<button
									onClick={() => setShowCreateTask(true)}
									className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
								>
									<Plus className="w-4 h-4" />
									Create Task from Event
								</button>
							) : (
								<div className="space-y-3">
									<div className="text-sm font-medium text-[#e6e6e6]">Create Task</div>
									
									<div className="space-y-2">
										<label className="block text-xs text-[#888]">
											Days before event to create task *
										</label>
										<Input
											type="number"
											min="0"
											value={daysBefore}
											onChange={(e) => setDaysBefore(e.target.value)}
											placeholder="1"
											className="bg-[#1a1a1a] border-[#333] text-sm h-8"
										/>
									</div>
	
									<div className="space-y-2">
										<label className="block text-xs text-[#888]">
											Custom title (optional, defaults to event title)
										</label>
										<Input
											type="text"
											value={customTitle}
											onChange={(e) => setCustomTitle(e.target.value)}
											placeholder={event.title}
											className="bg-[#1a1a1a] border-[#333] text-sm h-8"
										/>
									</div>
	
									<div className="space-y-2">
										<label className="block text-xs text-[#888]">
											Due date - days before event (optional)
										</label>
										<Input
											type="number"
											min="0"
											value={dueDaysBefore}
											onChange={(e) => setDueDaysBefore(e.target.value)}
											placeholder="0"
											className="bg-[#1a1a1a] border-[#333] text-sm h-8"
										/>
									</div>
	
									<div className="flex gap-2 pt-1">
										<button
											onClick={() => setShowCreateTask(false)}
											className="px-3 py-1.5 text-sm text-[#888] hover:text-[#e6e6e6] hover:bg-[#333] rounded transition-colors"
										>
											Cancel
										</button>
										<button
											onClick={handleCreateTask}
											disabled={isUpdating || !daysBefore || parseInt(daysBefore) < 0}
											className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{isUpdating ? "Creating..." : "Create Task"}
										</button>
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer with actions */}
				<div className="flex items-center justify-between px-4 py-3 border-t border-[#333] bg-[#1a1a1a]">
					<button
						onClick={handleOpenInGoogle}
						className="flex items-center gap-2 px-3 py-2 text-sm text-[#888] hover:text-[#e6e6e6] hover:bg-[#333] rounded transition-colors"
					>
						<ExternalLink className="w-4 h-4" />
						Open in Google
					</button>

					<div className="flex items-center gap-2">
						<button
							onClick={onClose}
							className="px-4 py-2 text-sm text-[#888] hover:text-[#e6e6e6] hover:bg-[#333] rounded transition-colors"
						>
							Close
						</button>
						{!hasTask && !isIgnored && (
							<button
								onClick={handleSkip}
								disabled={isUpdating}
								className="px-4 py-2 text-sm text-[#666] hover:text-[#888] border border-[#444] hover:border-[#555] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isUpdating ? "Updating..." : "Skip Event"}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}