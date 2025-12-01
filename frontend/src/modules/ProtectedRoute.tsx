import { Navigate, Outlet } from "react-router-dom"
import { usePbAuthStore } from "use-pocketbase"

export function ProtectedRoute() {
	const { isValid } = usePbAuthStore()

	if (!isValid) {
		return <Navigate to="/login" replace />
	}

	return <Outlet />
}
