import { useCallback, useEffect } from "react"
import { toast } from "react-toastify"
import { usePocketBase } from "./usePocketBase"

export function useErrorHandler() {
	const pb = usePocketBase()

	const handleLogout = useCallback(() => {
		pb.authStore.clear()
	}, [pb.authStore])

	useEffect(() => {
		if (!pb) return

		const originalSend = pb.send.bind(pb)

		pb.send = async function (path: string, reqConfig: unknown) {
			try {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return await originalSend(path, reqConfig as any)
			} catch (error: unknown) {
				// Check if this is a 500 error
				const err = error as {
					status?: number
					response?: { status?: number; message?: string }
					message?: string
				}
				console.log(err.status)
				if (err?.status === 500 || err?.response?.status === 500) {
					const errorMessage =
						err?.message ||
						err?.response?.message ||
						"Internal server error occurred"
					handleServerError(errorMessage)
				} else if (err.status === 0) {
					handleServerError(`${err.message} Request not sent`)
				} else if (err.status === 403 || err?.response?.status === 403) {
					handleLogout()
					return
				} else if (err.status === 400 || err?.response?.status === 400) {
					handleServerError(`Error 400. ${err.message}`)
				}

				// Re-throw the error so normal error handling continues
				throw error
			}
		}

		// Cleanup function to restore original send method
		return () => {
			if (pb && originalSend) {
				pb.send = originalSend
			}
		}
	}, [handleLogout, pb])

	const handleServerError = (message: string) => {
		toast.error(message, {
			toastId: `server-error-${message}`,
			autoClose: 8000,
			closeOnClick: true,
			hideProgressBar: false,
		})
	}
}
