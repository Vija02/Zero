import { useState, useCallback, useMemo } from "react"
import { usePbFullList } from "./usePbQueries"
import { usePbMutations } from "./usePbMutations"

export interface GoogleCalendar {
	id: string
	summary: string
	primary?: boolean
	backgroundColor?: string
}

const ACCESS_TOKEN_KEY = "access_token"

// Common setting keys for different use cases
export const CALENDAR_SETTING_KEYS = {
	TASK_PLANNER_CALENDAR: "task_planner_calendar_ids",
	TASK_IMPORT: "task_import_calendar_ids",
	SLOT_FINDER_CALENDAR: "slot_finder_calendar_ids",
} as const

// Default setting key for backward compatibility
export const DEFAULT_CALENDAR_IDS_KEY = CALENDAR_SETTING_KEYS.TASK_IMPORT

interface UseCalendarSettingsOptions {
	/**
	 * The setting key to use for storing/retrieving calendar IDs
	 * Different use cases can use different keys
	 */
	settingKey?: string
}

export function useCalendarSettings(options: UseCalendarSettingsOptions = {}) {
	const { settingKey = DEFAULT_CALENDAR_IDS_KEY } = options
	const [isFetchingCalendars, setIsFetchingCalendars] = useState(false)
	const [availableCalendars, setAvailableCalendars] = useState<
		GoogleCalendar[]
	>([])
	const [error, setError] = useState<string | null>(null)

	const { data: settings, isLoading: isLoadingSettings } =
		usePbFullList("settings")

	const {
		create: { mutate: createSetting },
		update: { mutate: updateSetting },
	} = usePbMutations("settings")

	// Get existing settings from data
	const accessTokenRecord = settings?.find((x) => x.key === ACCESS_TOKEN_KEY)
	const calendarIdsRecord = settings?.find((x) => x.key === settingKey)

	const accessToken = accessTokenRecord?.value || ""
	const calendarIds = calendarIdsRecord?.value || ""
	const isAuthenticated = !!accessToken

	// Parse selected calendar IDs
	const selectedCalendarIds = useMemo(() => {
		return calendarIds.split("\n").filter((id) => id.trim())
	}, [calendarIds])

	// Save setting helper - creates if doesn't exist, updates if it does
	const saveSetting = useCallback(
		(
			key: string,
			value: string,
			existingRecord: { id: string } | undefined,
		) => {
			if (existingRecord) {
				updateSetting({ id: existingRecord.id, key, value })
			} else {
				createSetting({ key, value })
			}
		},
		[createSetting, updateSetting],
	)

	const fetchCalendars = useCallback(async () => {
		if (!accessToken) return

		setIsFetchingCalendars(true)
		setError(null)

		try {
			const response = await fetch(
				"https://www.googleapis.com/calendar/v3/users/me/calendarList",
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				},
			)

			if (!response.ok) {
				throw new Error(`Failed to fetch calendars: ${response.statusText}`)
			}

			const data = await response.json()
			const calendars: GoogleCalendar[] = data.items.map(
				(item: GoogleCalendar) => ({
					id: item.id,
					summary: item.summary,
					primary: item.primary,
					backgroundColor: item.backgroundColor,
				}),
			)

			setAvailableCalendars(calendars)
		} catch (err) {
			const errorMessage = `Failed to fetch calendars: ${
				err instanceof Error ? err.message : "Unknown error"
			}`
			setError(errorMessage)
		} finally {
			setIsFetchingCalendars(false)
		}
	}, [accessToken])

	const toggleCalendar = useCallback(
		(calendarId: string) => {
			const currentIds = calendarIds.split("\n").filter((id) => id.trim())
			const isSelected = currentIds.includes(calendarId)

			let newIds: string[]
			if (isSelected) {
				newIds = currentIds.filter((id) => id !== calendarId)
			} else {
				newIds = [...currentIds, calendarId]
			}

			const newValue = newIds.join("\n")
			saveSetting(settingKey, newValue, calendarIdsRecord)
		},
		[calendarIds, calendarIdsRecord, saveSetting, settingKey],
	)

	const updateCalendarIds = useCallback(
		(newCalendarIds: string) => {
			saveSetting(settingKey, newCalendarIds, calendarIdsRecord)
		},
		[calendarIdsRecord, saveSetting, settingKey],
	)

	return {
		// Authentication state
		isAuthenticated,
		accessToken,
		isLoadingSettings,

		// Calendar management
		availableCalendars,
		selectedCalendarIds,
		calendarIds,
		isFetchingCalendars,
		error,

		// Configuration
		settingKey,

		// Actions
		fetchCalendars,
		toggleCalendar,
		updateCalendarIds,
	}
}
