import { LeftSidebar } from "./left-sidebar"
import { WeeklyView } from "./weekly-view"

export function TaskManager() {
	return (
		<>
			<LeftSidebar />
			<main className="flex flex-1 overflow-hidden">
				<WeeklyView />
			</main>
		</>
	)
}
