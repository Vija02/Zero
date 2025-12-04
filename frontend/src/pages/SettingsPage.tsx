import { useState, useEffect, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, ExternalLink, AlertCircle, RefreshCw, Check } from "lucide-react"
import { usePbMutations } from "@/api/usePbMutations"
import { usePbFullList } from "@/api/usePbQueries"

interface GoogleCalendar {
	id: string
	summary: string
	primary?: boolean
	backgroundColor?: string
}

const CLIENT_ID_KEY = "client_id"
const CLIENT_SECRET_KEY = "client_secret"
const REDIRECT_URI_KEY = "redirect_uri"
const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"
const CALENDAR_IDS_KEY = "calendar_ids"
const DAYS_IN_ADVANCE_KEY = "days_in_advance"

export function SettingsPage() {
	const [clientId, setClientId] = useState("")
	const [clientSecret, setClientSecret] = useState("")
	const [redirectUri, setRedirectUri] = useState("")
	const [accessToken, setAccessToken] = useState("")
	const [refreshToken, setRefreshToken] = useState("")
	const [calendarIds, setCalendarIds] = useState("")
	const [daysInAdvance, setDaysInAdvance] = useState("30")
	const [isExchanging, setIsExchanging] = useState(false)
	const [isFetchingCalendars, setIsFetchingCalendars] = useState(false)
	const [availableCalendars, setAvailableCalendars] = useState<GoogleCalendar[]>([])
	const [message, setMessage] = useState<{
		type: "success" | "error"
		text: string
	} | null>(null)
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()

	const { data, isLoading } = usePbFullList("settings")

	const {
		create: { mutate: createSetting },
		update: { mutate: updateSetting },
	} = usePbMutations("settings")

	// Get existing settings from data
	const clientIdRecord = data?.find((x) => x.key === CLIENT_ID_KEY)
	const clientSecretRecord = data?.find((x) => x.key === CLIENT_SECRET_KEY)
	const redirectUriRecord = data?.find((x) => x.key === REDIRECT_URI_KEY)
	const accessTokenRecord = data?.find((x) => x.key === ACCESS_TOKEN_KEY)
	const refreshTokenRecord = data?.find((x) => x.key === REFRESH_TOKEN_KEY)
	const calendarIdsRecord = data?.find((x) => x.key === CALENDAR_IDS_KEY)
	const daysInAdvanceRecord = data?.find((x) => x.key === DAYS_IN_ADVANCE_KEY)

	const isAuthenticated = !!accessToken

	// Initialize state from fetched data
	useEffect(() => {
		if (data) {
			if (clientIdRecord) setClientId(clientIdRecord.value || "")
			if (clientSecretRecord) setClientSecret(clientSecretRecord.value || "")
			if (redirectUriRecord) setRedirectUri(redirectUriRecord.value || "")
			if (accessTokenRecord) setAccessToken(accessTokenRecord.value || "")
			if (refreshTokenRecord) setRefreshToken(refreshTokenRecord.value || "")
			if (calendarIdsRecord) setCalendarIds(calendarIdsRecord.value || "")
			if (daysInAdvanceRecord) setDaysInAdvance(daysInAdvanceRecord.value || "30")
		}
	}, [
		data,
		clientIdRecord,
		clientSecretRecord,
		redirectUriRecord,
		accessTokenRecord,
		refreshTokenRecord,
		calendarIdsRecord,
		daysInAdvanceRecord,
	])

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

	// Blur handlers for auto-save
	const handleClientIdBlur = () => {
		saveSetting(CLIENT_ID_KEY, clientId, clientIdRecord)
	}

	const handleClientSecretBlur = () => {
		saveSetting(CLIENT_SECRET_KEY, clientSecret, clientSecretRecord)
	}

	const handleRedirectUriBlur = () => {
		saveSetting(REDIRECT_URI_KEY, redirectUri, redirectUriRecord)
	}

	const handleCalendarIdsBlur = () => {
		saveSetting(CALENDAR_IDS_KEY, calendarIds, calendarIdsRecord)
	}

	const handleDaysInAdvanceBlur = () => {
		saveSetting(DAYS_IN_ADVANCE_KEY, daysInAdvance, daysInAdvanceRecord)
	}

	const fetchCalendars = useCallback(async () => {
		if (!accessToken) return

		setIsFetchingCalendars(true)
		try {
			const response = await fetch(
				"https://www.googleapis.com/calendar/v3/users/me/calendarList",
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			)

			if (!response.ok) {
				throw new Error(`Failed to fetch calendars: ${response.statusText}`)
			}

			const data = await response.json()
			const calendars: GoogleCalendar[] = data.items.map((item: GoogleCalendar) => ({
				id: item.id,
				summary: item.summary,
				primary: item.primary,
				backgroundColor: item.backgroundColor,
			}))

			setAvailableCalendars(calendars)
		} catch (err) {
			setMessage({
				type: "error",
				text: `Failed to fetch calendars: ${
					err instanceof Error ? err.message : "Unknown error"
				}`,
			})
		} finally {
			setIsFetchingCalendars(false)
		}
	}, [accessToken])

	const toggleCalendar = (calendarId: string) => {
		const currentIds = calendarIds.split("\n").filter((id) => id.trim())
		const isSelected = currentIds.includes(calendarId)

		let newIds: string[]
		if (isSelected) {
			newIds = currentIds.filter((id) => id !== calendarId)
		} else {
			newIds = [...currentIds, calendarId]
		}

		const newValue = newIds.join("\n")
		setCalendarIds(newValue)
		saveSetting(CALENDAR_IDS_KEY, newValue, calendarIdsRecord)
	}

	const selectedCalendarIds = calendarIds.split("\n").filter((id) => id.trim())

	const exchangeCodeForToken = useCallback(
		async (code: string) => {
			setIsExchanging(true)
			setMessage(null)

			try {
				const response = await fetch("https://oauth2.googleapis.com/token", {
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						code,
						client_id: clientId,
						client_secret: clientSecret,
						redirect_uri: redirectUri,
						grant_type: "authorization_code",
					}),
				})

				const tokenData = await response.json()

				if (tokenData.error) {
					throw new Error(tokenData.error_description || tokenData.error)
				}

				// Update state
				setAccessToken(tokenData.access_token)
				if (tokenData.refresh_token) {
					setRefreshToken(tokenData.refresh_token)
				}

				// Save tokens to backend
				saveSetting(ACCESS_TOKEN_KEY, tokenData.access_token, accessTokenRecord)
				if (tokenData.refresh_token) {
					saveSetting(
						REFRESH_TOKEN_KEY,
						tokenData.refresh_token,
						refreshTokenRecord,
					)
				}

				setMessage({
					type: "success",
					text: "Successfully obtained access token!",
				})

				// Clear the code from URL
				navigate("/settings", { replace: true })
			} catch (err) {
				setMessage({
					type: "error",
					text: `Failed to exchange code: ${
						err instanceof Error ? err.message : "Unknown error"
					}`,
				})
			} finally {
				setIsExchanging(false)
			}
		},
		[
			accessTokenRecord,
			clientId,
			clientSecret,
			navigate,
			redirectUri,
			refreshTokenRecord,
			saveSetting,
		],
	)

	// Handle OAuth callback
	useEffect(() => {
		const code = searchParams.get("code")
		if (code && clientId && clientSecret && redirectUri) {
			exchangeCodeForToken(code)
		}
	}, [clientId, clientSecret, exchangeCodeForToken, redirectUri, searchParams])

	const initiateOAuthFlow = () => {
		if (!clientId || !redirectUri) {
			setMessage({
				type: "error",
				text: "Please enter Client ID and Redirect URI first",
			})
			return
		}

		const scope = encodeURIComponent(
			"https://www.googleapis.com/auth/calendar.readonly",
		)
		const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
			clientId,
		)}&redirect_uri=${encodeURIComponent(
			redirectUri,
		)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`

		window.location.href = authUrl
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#08090A] text-white flex items-center justify-center">
				<p className="text-[#888]">Loading settings...</p>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#08090A] text-white">
			<div className="max-w-2xl mx-auto py-8 px-4">
				<button
					onClick={() => navigate("/dashboard")}
					className="flex items-center gap-2 text-[#888] hover:text-white mb-6 transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to Dashboard
				</button>

				<h1 className="text-2xl font-bold mb-8">Settings</h1>

				<div className="space-y-6">
					<div className="bg-[#111213] border border-[#252525] rounded-lg p-6">
						<h2 className="text-lg font-medium mb-4">OAuth Configuration</h2>
						<p className="text-sm text-[#888] mb-6">
							Configure your OAuth credentials for Google Calendar integration.
							Settings are saved automatically when you leave a field.
						</p>

						{message && (
							<div
								className={`mb-4 p-3 rounded-md text-sm ${
									message.type === "success"
										? "bg-green-900/30 text-green-400 border border-green-800"
										: "bg-red-900/30 text-red-400 border border-red-800"
								}`}
							>
								{message.text}
							</div>
						)}

						<div className="space-y-4">
							<div>
								<label
									htmlFor="clientId"
									className="block text-sm font-medium mb-2"
								>
									Client ID
								</label>
								<input
									id="clientId"
									type="text"
									value={clientId}
									onChange={(e) => setClientId(e.target.value)}
									onBlur={handleClientIdBlur}
									className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#333] rounded-md text-white placeholder-[#555] focus:outline-none focus:border-[#555] focus:ring-1 focus:ring-[#555]"
									placeholder="Enter your client ID"
								/>
							</div>

							<div>
								<label
									htmlFor="clientSecret"
									className="block text-sm font-medium mb-2"
								>
									Client Secret
								</label>
								<input
									id="clientSecret"
									type="text"
									value={clientSecret}
									onChange={(e) => setClientSecret(e.target.value)}
									onBlur={handleClientSecretBlur}
									className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#333] rounded-md text-white placeholder-[#555] focus:outline-none focus:border-[#555] focus:ring-1 focus:ring-[#555]"
									placeholder="Enter your client secret"
								/>
							</div>

							<div>
								<label
									htmlFor="redirectUri"
									className="block text-sm font-medium mb-2"
								>
									Redirect URI
								</label>
								<input
									id="redirectUri"
									type="text"
									value={redirectUri}
									onChange={(e) => setRedirectUri(e.target.value)}
									onBlur={handleRedirectUriBlur}
									className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#333] rounded-md text-white placeholder-[#555] focus:outline-none focus:border-[#555] focus:ring-1 focus:ring-[#555]"
									placeholder="https://example.com/callback"
								/>
							</div>
						</div>
					</div>

					<div className="bg-[#111213] border border-[#252525] rounded-lg p-6">
						<h2 className="text-lg font-medium mb-4">Get Access Token</h2>
						<p className="text-sm text-[#888] mb-6">
							Click the button below to authenticate with Google and obtain an
							access token. Make sure you've entered your OAuth credentials
							above first.
						</p>

						<button
							onClick={initiateOAuthFlow}
							disabled={!clientId || !redirectUri || isExchanging}
							className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#08090A] focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							<ExternalLink className="w-4 h-4" />
							{isExchanging ? "Exchanging code..." : "Connect to Google"}
						</button>

						{accessToken && (
							<div className="mt-4 space-y-3">
								<div>
									<label className="block text-sm font-medium mb-2">
										Access Token
									</label>
									<div className="p-3 bg-[#1e1e1e] border border-[#333] rounded-md text-xs font-mono text-[#888] break-all">
										{accessToken}
									</div>
								</div>
								{refreshToken && (
									<div>
										<label className="block text-sm font-medium mb-2">
											Refresh Token
										</label>
										<div className="p-3 bg-[#1e1e1e] border border-[#333] rounded-md text-xs font-mono text-[#888] break-all">
											{refreshToken}
										</div>
									</div>
								)}
							</div>
						)}
					</div>

					<div className="bg-[#111213] border border-[#252525] rounded-lg p-6">
						<h2 className="text-lg font-medium mb-4">Calendar Settings</h2>
						<p className="text-sm text-[#888] mb-6">
							Configure which calendars to sync and how far in advance to create tasks.
						</p>

						{!isAuthenticated && (
							<div className="mb-6 p-3 rounded-md text-sm bg-yellow-900/30 text-yellow-400 border border-yellow-800 flex items-start gap-2">
								<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
								<span>
									Please connect to Google Calendar above to enable these settings.
									Once authenticated, you'll be able to select which calendars to use.
								</span>
							</div>
						)}

						<div className="space-y-4">
							<div>
								<div className="flex items-center justify-between mb-2">
									<label className="block text-sm font-medium">
										Calendars to Sync
									</label>
									{isAuthenticated && (
										<button
											onClick={fetchCalendars}
											disabled={isFetchingCalendars}
											className="flex items-center gap-1 px-2 py-1 text-xs bg-[#1e1e1e] border border-[#333] rounded-md text-[#888] hover:text-white hover:border-[#555] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										>
											<RefreshCw className={`w-3 h-3 ${isFetchingCalendars ? 'animate-spin' : ''}`} />
											{isFetchingCalendars ? 'Fetching...' : 'Fetch Calendars'}
										</button>
									)}
								</div>

								{availableCalendars.length > 0 ? (
									<div className="space-y-2 mb-2">
										{availableCalendars.map((calendar) => {
											const isSelected = selectedCalendarIds.includes(calendar.id)
											return (
												<button
													key={calendar.id}
													onClick={() => toggleCalendar(calendar.id)}
													className={`w-full flex items-center gap-3 p-3 rounded-md border transition-colors text-left ${
														isSelected
															? 'bg-blue-900/30 border-blue-700 text-white'
															: 'bg-[#1e1e1e] border-[#333] text-[#888] hover:text-white hover:border-[#555]'
													}`}
												>
													<div
														className="w-3 h-3 rounded-sm flex-shrink-0"
														style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
													/>
													<div className="flex-1 min-w-0">
														<div className="font-medium truncate">
															{calendar.summary}
															{calendar.primary && (
																<span className="ml-2 text-xs text-[#666]">(Primary)</span>
															)}
														</div>
														<div className="text-xs text-[#555] truncate">{calendar.id}</div>
													</div>
													{isSelected && (
														<Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
													)}
												</button>
											)
										})}
									</div>
								) : (
									<div className="mb-2">
										<textarea
											id="calendarIds"
											value={calendarIds}
											onChange={(e) => setCalendarIds(e.target.value)}
											onBlur={handleCalendarIdsBlur}
											disabled={!isAuthenticated}
											rows={3}
											className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#333] rounded-md text-white placeholder-[#555] focus:outline-none focus:border-[#555] focus:ring-1 focus:ring-[#555] disabled:opacity-50 disabled:cursor-not-allowed"
											placeholder="Enter calendar IDs (one per line) or click 'Fetch Calendars' to select from your calendars"
										/>
									</div>
								)}
								
								<p className="text-xs text-[#666]">
									{availableCalendars.length > 0
										? `${selectedCalendarIds.length} calendar(s) selected`
										: "Click 'Fetch Calendars' to see your available calendars, or enter calendar IDs manually (one per line)."}
								</p>
							</div>

							<div>
								<label
									htmlFor="daysInAdvance"
									className="block text-sm font-medium mb-2"
								>
									Days in Advance
								</label>
								<input
									id="daysInAdvance"
									type="number"
									min="1"
									max="365"
									value={daysInAdvance}
									onChange={(e) => setDaysInAdvance(e.target.value)}
									onBlur={handleDaysInAdvanceBlur}
									disabled={!isAuthenticated}
									className="w-32 px-3 py-2 bg-[#1e1e1e] border border-[#333] rounded-md text-white placeholder-[#555] focus:outline-none focus:border-[#555] focus:ring-1 focus:ring-[#555] disabled:opacity-50 disabled:cursor-not-allowed"
								/>
								<p className="mt-1 text-xs text-[#666]">
									How many days ahead to create tasks from calendar events. Default is 30 days.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
