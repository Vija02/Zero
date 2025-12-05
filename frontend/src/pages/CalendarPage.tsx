import { useState, useCallback, useMemo } from "react"
import { Calendar as CalendarIcon, Menu, AlertCircle } from "lucide-react"
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enGB } from "date-fns/locale"
import { LeftSidebar } from "@/components/left-sidebar"
import { useSidebarStore } from "@/stores/useSidebarStore"
import { useGoogleCalendarEvents, CalendarEvent } from "@/api/useGoogleCalendarEvents"
import { useNavigate } from "react-router-dom"
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

export function CalendarPage() {
	const { toggleSidebar } = useSidebarStore()
	const navigate = useNavigate()
	const [currentDate, setCurrentDate] = useState(new Date())
	const [view, setView] = useState<View>("week")

	const { events, isLoading, isAuthenticated, error } = useGoogleCalendarEvents({
		currentDate,
	})

	const handleNavigate = useCallback((newDate: Date) => {
		setCurrentDate(newDate)
	}, [])

	const handleViewChange = useCallback((newView: View) => {
		setView(newView)
	}, [])

	const handleSelectEvent = useCallback((event: CalendarEvent) => {
		if (event.htmlLink) {
			window.open(event.htmlLink, "_blank")
		}
	}, [])

	// Custom event styling
	const eventStyleGetter = useCallback((event: CalendarEvent) => {
		const style: React.CSSProperties = {
			backgroundColor: "#3b82f6",
			borderRadius: "4px",
			opacity: 0.9,
			color: "white",
			border: "none",
			display: "block",
			fontSize: "12px",
		}

		if (event.allDay) {
			style.backgroundColor = "#6366f1"
		}

		return { style }
	}, [])

	// Custom formats for the calendar
	const formats = useMemo(
		() => ({
			timeGutterFormat: (date: Date) => format(date, "HH:mm"),
			eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
				`${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
			dayHeaderFormat: (date: Date) => format(date, "EEE dd/MM"),
			dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
				`${format(start, "dd MMM")} - ${format(end, "dd MMM yyyy")}`,
		}),
		[],
	)

	return (
		<>
			<LeftSidebar />
			<main className="flex-1 flex flex-col overflow-hidden">
				<header className="h-12 flex items-center px-2 sm:px-4 border-b border-[#252525] bg-[#121212]">
					<button
						onClick={toggleSidebar}
						className="md:hidden flex items-center justify-center p-2 hover:bg-[#252525] rounded transition-colors"
					>
						<Menu className="w-5 h-5" />
					</button>
					<div className="flex items-center gap-2 ml-2">
						<CalendarIcon className="w-5 h-5" />
						<h1 className="text-lg font-semibold">Calendar</h1>
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
							<Calendar
								localizer={localizer}
								events={events}
								startAccessor="start"
								endAccessor="end"
								titleAccessor="title"
								view={view}
								onView={handleViewChange}
								date={currentDate}
								onNavigate={handleNavigate}
								onSelectEvent={handleSelectEvent}
								eventPropGetter={eventStyleGetter}
								formats={formats}
								defaultView="week"
								views={["week", "day", "month"]}
								step={30}
								timeslots={2}
								min={new Date(1970, 1, 1, 6, 0, 0)}
								max={new Date(1970, 1, 1, 22, 0, 0)}
								style={{ height: "100%" }}
							/>
						</div>
					)}
				</div>
			</main>
		</>
	)
}