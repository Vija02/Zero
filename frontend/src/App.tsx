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
import { TaskDetailModal } from "./components/modal/task-detail-modal"
import { AddTaskModal } from "./components/modal/add-task-modal"
import { ActiveTaskBar } from "./components/modal/active-task-bar"
import { useBacklogStore } from "./stores/useBacklogStore"
import { useTaskDetailStore } from "./stores/useTaskDetailStore"
import { useAddTaskStore } from "./stores/useAddTaskStore"
import { useActiveTaskStore } from "./stores/useActiveTaskStore"
import { useErrorHandler } from "./api/useErrorHandler"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

function ErrorHandler() {
	useErrorHandler()

	return null
}

function App() {
	const { showBacklog } = useBacklogStore()
	const { selectedTaskId, closeTaskDetail } = useTaskDetailStore()
	const { addTaskDay, closeAddTask } = useAddTaskStore()
	const { activeTask } = useActiveTaskStore()

	return (
		<PocketBaseProvider
			baseUrl={
				import.meta.env.DEV ? "http://localhost:8090" : window.location.origin
			}
		>
			<ErrorHandler />
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

					{selectedTaskId && (
						<TaskDetailModal
							taskId={selectedTaskId}
							onClose={closeTaskDetail}
						/>
					)}
					{addTaskDay && (
						<AddTaskModal day={addTaskDay} onClose={closeAddTask} />
					)}
					{activeTask && <ActiveTaskBar />}
				</div>
				<ToastContainer
					position="top-right"
					autoClose={5000}
					hideProgressBar={false}
					newestOnTop={false}
					closeOnClick
					rtl={false}
					pauseOnFocusLoss
					draggable
					pauseOnHover
					theme="dark"
					toastStyle={{
						backgroundColor: "#1f2937",
						border: "1px solid #374151",
						color: "#e5e7eb",
					}}
				/>
			</DndProvider>
		</PocketBaseProvider>
	)
}

export default App
