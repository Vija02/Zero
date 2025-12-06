import { useQuery } from "@tanstack/react-query"
import { usePbFullList } from "./usePbQueries"
import { useMemo } from "react"
import { startOfWeek, endOfWeek, addDays, subDays } from "date-fns"

interface GoogleCalendarEvent {
	id: string
	summary: string
	description?: string
	start: {
		dateTime?: string
		date?: string
	}
	end: {
		dateTime?: string
		date?: string
	}
	htmlLink: string
	status: string
}

export interface CalendarEvent {
	id: string
	title: string
	start: Date
	end: Date
	description?: string
	htmlLink?: string
	allDay?: boolean
}

interface UseGoogleCalendarEventsOptions {
	currentDate?: Date
	// Extend date range around the current week for smoother navigation
	bufferDays?: number
}

export function useGoogleCalendarEvents(
	options: UseGoogleCalendarEventsOptions = {},
) {
	const { currentDate = new Date(), bufferDays = 7 } = options

	// Get settings from PocketBase
	const { data: settings, isLoading: isLoadingSettings } =
		usePbFullList("settings")

	// Extract access token from settings
	const accessToken = useMemo(() => {
		if (!settings) return null
		const tokenSetting = settings.find((s) => s.key === "access_token")
		return tokenSetting?.value || null
	}, [settings])

	// Calculate date range for the current view with buffer
	const dateRange = useMemo(() => {
		const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
		const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }) // Sunday
		return {
			timeMin: subDays(weekStart, bufferDays),
			timeMax: addDays(weekEnd, bufferDays),
		}
	}, [currentDate, bufferDays])

	// Fetch calendar events
	const {
		data: events,
		isLoading: isLoadingEvents,
		error,
		refetch,
	} = useQuery({
		queryKey: [
			"googleCalendarEvents",
			"primary",
			dateRange.timeMin.toISOString(),
			dateRange.timeMax.toISOString(),
		],
		queryFn: async (): Promise<CalendarEvent[]> => {
			if (!accessToken) {
				return []
			}

			const params = new URLSearchParams({
				timeMin: dateRange.timeMin.toISOString(),
				timeMax: dateRange.timeMax.toISOString(),
				singleEvents: "true",
				orderBy: "startTime",
				maxResults: "250",
			})

			const response = await fetch(
				`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				},
			)

			if (!response.ok) {
				if (response.status === 401) {
					throw new Error("Access token expired. Please re-authenticate.")
				}
				throw new Error(`Failed to fetch events: ${response.statusText}`)
			}

			const data = await response.json()
			const items: GoogleCalendarEvent[] = data.items || []

			// Transform Google Calendar events to react-big-calendar format
			return items.map((event): CalendarEvent => {
				const isAllDay = !event.start.dateTime
				const start = new Date(event.start.dateTime || event.start.date || "")
				const end = new Date(event.end.dateTime || event.end.date || "")

				return {
					id: event.id,
					title: event.summary || "(No title)",
					start,
					end,
					description: event.description,
					allDay: isAllDay,
				}
			})
		},
		enabled: !!accessToken,
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: false,
	})

	return {
		events: events || [],
		isLoading: isLoadingSettings || isLoadingEvents,
		isAuthenticated: !!accessToken,
		error,
		refetch,
	}
}
