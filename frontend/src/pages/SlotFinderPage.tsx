import { useState, useCallback, useMemo, useRef } from "react"
import {
	Calendar as CalendarIcon,
	Menu,
	AlertCircle,
	Settings,
	Eye,
	EyeOff,
	Trash2,
} from "lucide-react"
import { Calendar, dateFnsLocalizer, View, SlotInfo } from "react-big-calendar"
import { format, parse, startOfWeek, getDay, addMinutes } from "date-fns"
import { enGB } from "date-fns/locale"
import { LeftSidebar } from "@/components/left-sidebar"
import { useSidebarStore } from "@/stores/useSidebarStore"
import {
	useGoogleCalendarEvents,
	CalendarEvent,
} from "@/api/useGoogleCalendarEvents"
import { useNavigate } from "react-router-dom"
import { CalendarSettingsModal } from "@/components/modal/calendar-settings-modal"
import { CALENDAR_SETTING_KEYS } from "@/api/useCalendarSettings"
import "react-big-calendar/lib/css/react-big-calendar.css"

// Setup date-fns localizer for react-big-calendar
const locales = {
	"en-GB": enGB,
}

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
	getDay,
	locales,
})

interface AvailabilitySlot {
	id: string
	start: Date
	end: Date
	title: string
}

export function SlotFinderPage() {
	const { toggleSidebar } = useSidebarStore()
	const navigate = useNavigate()
	const [currentDate, setCurrentDate] = useState(new Date())
	const [view, setView] = useState<View>("week")
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)
	const [hideEventText, setHideEventText] = useState(false)
	const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
	
	// Drawing state
	const [isDrawing, setIsDrawing] = useState(false)
	const [drawStart, setDrawStart] = useState<Date | null>(null)
	const drawingRef = useRef<boolean>(false)

	const { events, isLoading, isAuthenticated, error } = useGoogleCalendarEvents(
		{
			currentDate,
			calendarIdsSettingKey: CALENDAR_SETTING_KEYS.SLOT_FINDER_CALENDAR,
		},
	)

	const handleNavigate = useCallback((newDate: Date) => {
		setCurrentDate(newDate)
	}, [])

	const handleViewChange = useCallback((newView: View) => {
		setView(newView)
	}, [])

	const handleOpenSettings = useCallback(() => {
		setIsSettingsOpen(true)
	}, [])

	const handleCloseSettings = useCallback(() => {
		setIsSettingsOpen(false)
	}, [])

	const handleToggleEventText = useCallback(() => {
		setHideEventText((prev) => !prev)
	}, [])

	const handleClearSlots = useCallback(() => {
		setAvailabilitySlots([])
	}, [])

	// Handle slot selection (clicking and dragging on calendar)
	const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
		const newSlot: AvailabilitySlot = {
			id: `slot-${Date.now()}`,
			start: slotInfo.start,
			end: slotInfo.end,
			title: "Available",
		}
		setAvailabilitySlots((prev) => [...prev, newSlot])
	}, [])

	// Handle clicking on an availability slot to remove it
	const handleSelectAvailabilitySlot = useCallback((slot: AvailabilitySlot) => {
		setAvailabilitySlots((prev) => prev.filter((s) => s.id !== slot.id))
	}, [])

	// Combine calendar events with availability slots for display
	const allEvents = useMemo(() => {
		const calendarEvents = events.map((event) => ({
			...event,
			isCalendarEvent: true,
		}))
		const availabilityEvents = availabilitySlots.map((slot) => ({
			...slot,
			isAvailabilitySlot: true,
		}))
		return [...calendarEvents, ...availabilityEvents]
	}, [events, availabilitySlots])

	// Custom event styling
	const eventStyleGetter = useCallback(
		(event: CalendarEvent & { isAvailabilitySlot?: boolean }) => {
			// Style for availability slots
			if (event.isAvailabilitySlot) {
				return {
					style: {
						backgroundColor: "rgba(34, 197, 94, 0.6)",
						borderRadius: "4px",
						opacity: 0.9,
						color: "white",
						border: "2px solid #22c55e",
						display: "block",
						fontSize: "12px",
						cursor: "pointer",
					} as React.CSSProperties,
				}
			}

			// Style for calendar events
			const now = new Date()
			const isPastEvent = event.end < now

			const style: React.CSSProperties = {
				backgroundColor: isPastEvent ? "#64748b" : "#3b82f6",
				borderRadius: "4px",
				opacity: isPastEvent ? 0.5 : 0.9,
				color: isPastEvent ? "#cbd5e1" : "white",
				border: "none",
				display: "block",
				fontSize: "12px",
			}

			if (event.allDay) {
				style.backgroundColor = isPastEvent ? "#64748b" : "#6366f1"
			}

			return { style }
		},
		[],
	)

	// Custom formats for the calendar
	const formats = useMemo(
		() => ({
			timeGutterFormat: (date: Date) => format(date, "HH:mm"),
			eventTimeRangeFormat: () => ``,
			dayHeaderFormat: (date: Date) => format(date, "EEE dd/MM"),
			dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
				`${format(start, "dd MMM")} - ${format(end, "dd MMM yyyy")}`,
		}),
		[],
	)

	// Custom title accessor to hide text when toggle is on
	const titleAccessor = useCallback(
		(event: CalendarEvent & { isAvailabilitySlot?: boolean }) => {
			if (event.isAvailabilitySlot) {
				return hideEventText ? "" : "Available"
			}
			if (hideEventText) {
				return ""
			}
			return (
				<span>
					{event.title}, {format(event.start, "HH:mm")}
				</span>
			)
		},
		[hideEventText],
	)

	return (
		<>
			<LeftSidebar />
			<CalendarSettingsModal
				isOpen={isSettingsOpen}
				onClose={handleCloseSettings}
				settingKey={CALENDAR_SETTING_KEYS.SLOT_FINDER_CALENDAR}
				title="Display Calendars"
			/>
			<main className="flex-1 flex flex-col overflow-hidden">
				<header className="h-12 flex items-center justify-between px-2 sm:px-4 border-b border-[#252525] bg-[#121212]">
					<div className="flex items-center">
						<button
							onClick={toggleSidebar}
							className="md:hidden flex items-center justify-center p-2 hover:bg-[#252525] rounded transition-colors"
						>
							<Menu className="w-5 h-5" />
						</button>
						<div className="flex items-center gap-2 ml-2">
							<CalendarIcon className="w-5 h-5" />
							<h1 className="text-lg font-semibold">Slot Finder</h1>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={handleClearSlots}
							className="flex items-center justify-center p-2 hover:bg-[#252525] rounded transition-colors text-red-400 hover:text-red-300"
							title="Clear all availability slots"
						>
							<Trash2 className="w-5 h-5" />
						</button>
						<button
							onClick={handleToggleEventText}
							className={`flex items-center justify-center p-2 hover:bg-[#252525] rounded transition-colors ${
								hideEventText ? "text-yellow-400" : ""
							}`}
							title={hideEventText ? "Show event text" : "Hide event text"}
						>
							{hideEventText ? (
								<EyeOff className="w-5 h-5" />
							) : (
								<Eye className="w-5 h-5" />
							)}
						</button>
						<button
							onClick={handleOpenSettings}
							className="flex items-center justify-center p-2 hover:bg-[#252525] rounded transition-colors"
							title="Calendar Settings"
						>
							<Settings className="w-5 h-5" />
						</button>
					</div>
				</header>

				<div className="flex-1 overflow-hidden p-4">
					{!isAuthenticated ? (
						<div className="h-full flex items-center justify-center">
							<div className="bg-[#111213] border border-[#252525] rounded-lg p-6 max-w-md text-center">
								<AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
								<h2 className="text-lg font-medium mb-2">
									Google Calendar Not Connected
								</h2>
								<p className="text-[#888] mb-4">
									Connect your Google Calendar in the settings to view your
									events here.
								</p>
								<button
									onClick={() => navigate("/settings")}
									className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
								>
									Go to Settings
								</button>
							</div>
						</div>
					) : error ? (
						<div className="h-full flex items-center justify-center">
							<div className="bg-[#111213] border border-red-800 rounded-lg p-6 max-w-md text-center">
								<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
								<h2 className="text-lg font-medium mb-2">
									Error Loading Calendar
								</h2>
								<p className="text-red-400 mb-4">
									{error instanceof Error ? error.message : "Unknown error"}
								</p>
								<button
									onClick={() => navigate("/settings")}
									className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
								>
									Check Settings
								</button>
							</div>
						</div>
					) : (
						<div className="h-full calendar-container">
							{isLoading && (
								<div className="absolute inset-0 bg-[#08090A]/50 flex items-center justify-center z-10">
									<div className="text-[#888]">Loading events...</div>
								</div>
							)}
							<div className="mb-2 text-sm text-[#888]">
								Click and drag on the calendar to mark available time slots. Click on a green slot to remove it.
							</div>
							<Calendar
								localizer={localizer}
								events={allEvents}
								startAccessor="start"
								endAccessor="end"
								// @ts-expect-error -- Expected
								titleAccessor={titleAccessor}
								view={view}
								onView={handleViewChange}
								date={currentDate}
								onNavigate={handleNavigate}
								onSelectSlot={handleSelectSlot}
								onSelectEvent={(event: CalendarEvent & { isAvailabilitySlot?: boolean }) => {
									if (event.isAvailabilitySlot) {
										handleSelectAvailabilitySlot(event as unknown as AvailabilitySlot)
									}
								}}
								eventPropGetter={eventStyleGetter}
								formats={formats}
								selectable
								defaultView="week"
								views={["week", "day", "month"]}
								step={30}
								timeslots={2}
								min={new Date(1970, 1, 1, 9, 0, 0)}
								max={new Date(1970, 1, 1, 23, 0, 0)}
								style={{ height: "calc(100% - 32px)" }}
								tooltipAccessor={null}
							/>
						</div>
					)}
				</div>
			</main>
		</>
	)
}