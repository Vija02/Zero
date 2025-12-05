import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ProtectedRoute } from "./modules/ProtectedRoute"
import { LoginPage } from "./pages/LoginPage"
import { DashboardPage } from "./pages/DashboardPage"
import { SettingsPage } from "./pages/SettingsPage"
import { CalendarPage } from "./pages/CalendarPage"
import { PocketBaseProvider } from "use-pocketbase"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { BacklogPanel } from "./components/backlog-panel"
import { useBacklogStore } from "./stores/useBacklogStore"

function App() {
	const { showBacklog } = useBacklogStore()

	return (
		<PocketBaseProvider
			baseUrl={
				import.meta.env.DEV ? "http://localhost:8090" : window.location.origin
			}
		>
			<DndProvider backend={HTML5Backend}>
				<div className="flex h-screen bg-[#131314] text-[#e6e6e6] overflow-hidden">
				<BrowserRouter>
					<Routes>
						<Route path="/login" element={<LoginPage />} />
						<Route element={<ProtectedRoute />}>
							<Route path="/dashboard" element={<DashboardPage />} />
							<Route path="/settings" element={<SettingsPage />} />
							<Route path="/calendar" element={<CalendarPage />} />
						</Route>
						<Route path="/" element={<Navigate to="/dashboard" replace />} />
						<Route path="*" element={<Navigate to="/dashboard" replace />} />
					</Routes>
				</BrowserRouter>
					{showBacklog && <BacklogPanel />}
				</div>
			</DndProvider>
		</PocketBaseProvider>
	)
}

export default App
