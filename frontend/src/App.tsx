import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ProtectedRoute } from "./modules/ProtectedRoute"
import { LoginPage } from "./pages/LoginPage"
import { DashboardPage } from "./pages/DashboardPage"

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route element={<ProtectedRoute />}>
					<Route path="/dashboard" element={<DashboardPage />} />
				</Route>
				<Route path="/" element={<Navigate to="/dashboard" replace />} />
				<Route path="*" element={<Navigate to="/dashboard" replace />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App
