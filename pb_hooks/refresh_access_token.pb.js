/// <reference path="../pb_data/types.d.ts" />

// Google access token expire every hour
// So we just run it every half an hour to renew it
cronAdd("refresh_access_token", "*/30 * * * *", () => {
	function getSettingRecord(key) {
		const record = $app.findRecordsByFilter(
			"settings",
			`key = '${key}'`,
			null,
			1,
			0,
		)
		return record?.[0]
	}
	function getSetting(key) {
		return getSettingRecord(key)?.get("value")
	}

	function saveSetting(key, value) {
		const existingRecord = getSettingRecord(key)
		if (existingRecord) {
			existingRecord.set("value", value)
			$app.save(existingRecord)
		} else {
			const collection = $app.findCollectionByNameOrId("settings")
			const newRecord = new Record(collection)
			newRecord.set("key", key)
			newRecord.set("value", value)
			$app.save(newRecord)
		}
	}

	try {
		const refreshToken = getSetting("refresh_token")
		const clientId = getSetting("client_id")
		const clientSecret = getSetting("client_secret")

		if (!refreshToken) {
			console.log("No refresh token found. Skipping token refresh.")
			return
		}

		if (!clientId || !clientSecret) {
			console.log("Missing client_id or client_secret. Skipping token refresh.")
			return
		}

		// Request new access token from Google OAuth
		const response = $http.send({
			url: "https://oauth2.googleapis.com/token",
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: [
				"client_id=" + encodeURIComponent(clientId),
				"client_secret=" + encodeURIComponent(clientSecret),
				"refresh_token=" + encodeURIComponent(refreshToken),
				"grant_type=refresh_token",
			].join("&"),
		})

		if (response.statusCode !== 200) {
			throw new Error(
				`Google OAuth error: ${response.statusCode} - ${response.raw}`,
			)
		}

		const tokenData = JSON.parse(response.raw)

		if (tokenData.error) {
			throw new Error(tokenData.error_description || tokenData.error)
		}

		// Save the new access token
		saveSetting("access_token", tokenData.access_token)

		console.log("Successfully refreshed Google access token")
	} catch (e) {
		console.error("Failed to refresh access token:", e)
	}
})
