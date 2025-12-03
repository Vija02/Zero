import { useState, useEffect, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { usePbMutations } from "@/api/usePbMutations"
import { usePbFullList } from "@/api/usePbQueries"

const CLIENT_ID_KEY = "client_id"
const CLIENT_SECRET_KEY = "client_secret"
const REDIRECT_URI_KEY = "redirect_uri"
const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"

export function SettingsPage() {
	const [clientId, setClientId] = useState("")
	const [clientSecret, setClientSecret] = useState("")
	const [redirectUri, setRedirectUri] = useState("")
	const [accessToken, setAccessToken] = useState("")
	const [refreshToken, setRefreshToken] = useState("")
	const [isExchanging, setIsExchanging] = useState(false)
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

	// Initialize state from fetched data
	useEffect(() => {
		if (data) {
			if (clientIdRecord) setClientId(clientIdRecord.value || "")
			if (clientSecretRecord) setClientSecret(clientSecretRecord.value || "")
			if (redirectUriRecord) setRedirectUri(redirectUriRecord.value || "")
			if (accessTokenRecord) setAccessToken(accessTokenRecord.value || "")
			if (refreshTokenRecord) setRefreshToken(refreshTokenRecord.value || "")
		}
	}, [
		data,
		clientIdRecord,
		clientSecretRecord,
		redirectUriRecord,
		accessTokenRecord,
		refreshTokenRecord,
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
				</div>
			</div>
		</div>
	)
}
