import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ProtectedRoute } from "./modules/ProtectedRoute"
import { LoginPage } from "./pages/LoginPage"
import { DashboardPage } from "./pages/DashboardPage"
import { PocketBaseProvider } from "use-pocketbase"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

function App() {
	return (
		<PocketBaseProvider
			baseUrl={
				import.meta.env.DEV ? "http://localhost:8090" : window.location.origin
			}
		>
			<DndProvider backend={HTML5Backend}>
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
			</DndProvider>
		</PocketBaseProvider>
	)
}

export default App
