import { useCallback, useEffect } from "react"
import { X, RefreshCw, Check, AlertCircle } from "lucide-react"
import { useCalendarSettings, DEFAULT_CALENDAR_IDS_KEY } from "@/api/useCalendarSettings"

interface CalendarSettingsModalProps {
	isOpen: boolean
	onClose: () => void
	/**
	 * The setting key to use for storing/retrieving calendar IDs
	 * Different use cases can use different keys
	 */
	settingKey?: string
	/**
	 * Optional title for the modal
	 */
	title?: string
}

export function CalendarSettingsModal({
	isOpen,
	onClose,
	settingKey = DEFAULT_CALENDAR_IDS_KEY,
	title = "Calendar Settings"
}: CalendarSettingsModalProps) {
	const {
		isAuthenticated,
		availableCalendars,
		selectedCalendarIds,
		isFetchingCalendars,
		error,
		fetchCalendars,
		toggleCalendar,
	} = useCalendarSettings({ settingKey })

	// Auto-fetch calendars when modal opens and user is authenticated
	useEffect(() => {
		if (isOpen && isAuthenticated && availableCalendars.length === 0) {
			fetchCalendars()
		}
	}, [isOpen, isAuthenticated, availableCalendars.length, fetchCalendars])

	const handleOverlayClick = useCallback((e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose()
		}
	}, [onClose])

	if (!isOpen) return null

	return (
		<div 
			className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
			onClick={handleOverlayClick}
		>
			<div className="bg-[#111213] border border-[#252525] rounded-lg w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-[#252525]">
					<h2 className="text-lg font-medium">{title}</h2>
					<button
						onClick={onClose}
						className="p-1 hover:bg-[#252525] rounded transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-4 overflow-y-auto">
					{!isAuthenticated ? (
						<div className="text-center py-8">
							<AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
							<h3 className="text-lg font-medium mb-2">
								Google Calendar Not Connected
							</h3>
							<p className="text-[#888] mb-4">
								Please connect your Google Calendar in the settings to manage calendar visibility.
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{/* Fetch Calendars Button */}
							<div className="flex items-center justify-between">
								<h3 className="font-medium">Select Calendars</h3>
								<button
									onClick={fetchCalendars}
									disabled={isFetchingCalendars}
									className="flex items-center gap-2 px-3 py-1 text-sm bg-[#1e1e1e] border border-[#333] rounded-md text-[#888] hover:text-white hover:border-[#555] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									<RefreshCw
										className={`w-4 h-4 ${
											isFetchingCalendars ? "animate-spin" : ""
										}`}
									/>
									{isFetchingCalendars ? "Loading..." : "Refresh"}
								</button>
							</div>

							{/* Error Message */}
							{error && (
								<div className="p-3 rounded-md text-sm bg-red-900/30 text-red-400 border border-red-800">
									{error}
								</div>
							)}

							{/* Calendar List */}
							{availableCalendars.length > 0 ? (
								<div className="space-y-2 max-h-60 overflow-y-auto">
									{availableCalendars.map((calendar) => {
										const isSelected = selectedCalendarIds.includes(calendar.id)
										return (
											<button
												key={calendar.id}
												onClick={() => toggleCalendar(calendar.id)}
												className={`w-full flex items-center gap-3 p-3 rounded-md border transition-colors text-left ${
													isSelected
														? "bg-blue-900/30 border-blue-700 text-white"
														: "bg-[#1e1e1e] border-[#333] text-[#888] hover:text-white hover:border-[#555]"
												}`}
											>
												{/* Color indicator */}
												<div
													className="w-3 h-3 rounded-sm flex-shrink-0"
													style={{
														backgroundColor: calendar.backgroundColor || "#4285f4",
													}}
												/>
												
												{/* Calendar info */}
												<div className="flex-1 min-w-0">
													<div className="font-medium truncate">
														{calendar.summary}
														{calendar.primary && (
															<span className="ml-2 text-xs text-[#666]">
																(Primary)
															</span>
														)}
													</div>
													<div className="text-xs text-[#555] truncate">
														{calendar.id}
													</div>
												</div>
												
												{/* Selected indicator */}
												{isSelected && (
													<Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
												)}
											</button>
										)
									})}
								</div>
							) : !isFetchingCalendars && !error ? (
								<div className="text-center py-8 text-[#888]">
									<p className="mb-4">No calendars loaded yet.</p>
									<p className="text-sm">Click "Refresh" to fetch your calendars.</p>
								</div>
							) : null}

							{/* Selection summary */}
							{selectedCalendarIds.length > 0 && (
								<div className="pt-2 border-t border-[#252525]">
									<p className="text-sm text-[#666]">
										{selectedCalendarIds.length} calendar{selectedCalendarIds.length !== 1 ? 's' : ''} selected
									</p>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-4 border-t border-[#252525] flex justify-end">
					<button
						onClick={onClose}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Done
					</button>
				</div>
			</div>
		</div>
	)
}