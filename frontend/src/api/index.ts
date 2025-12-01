import { TypedPocketBase } from "../pocketbase-types"
import PocketBase, { ClientResponseError } from "pocketbase"
import { useAuthStore } from "../store/authStore"

export const pb = new PocketBase(
	import.meta.env.DEV ? "http://localhost:8090" : window.location.origin,
) as TypedPocketBase

// Handle authentication errors - call this when API requests fail
export function handleAuthError(error: unknown): boolean {
	if (error instanceof ClientResponseError) {
		// 401 Unauthorized or 403 Forbidden typically indicate auth issues
		if (error.status === 401 || error.status === 403) {
			// Use zustand store's logout method
			useAuthStore.getState().logout()
			// Force redirect to login
			window.location.href = "/login"
			return true
		}
	}
	return false
}

// Wrapper for API calls that handles auth errors automatically
export async function withAuthErrorHandling<T>(
	apiCall: () => Promise<T>
): Promise<T> {
	try {
		return await apiCall()
	} catch (error) {
		if (handleAuthError(error)) {
			// Re-throw to stop further execution
			throw error
		}
		throw error
	}
}

// Example usage:
// const data = await withAuthErrorHandling(() => pb.collection('items').getList())