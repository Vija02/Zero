// Run every hour
cronAdd("move_tasks_to_new_day", "0 * * * *", () => {
	function getStartOfDay(date = new Date()) {
		const startOfDay = new Date(date)
		startOfDay.setHours(0, 0, 0, 0)
		return startOfDay.toISOString()
	}

	try {
		const startOfDay = getStartOfDay()

		// Get existing tasks on today, ordered by their current order
		const existingTasks = $app.findRecordsByFilter(
			"tasks",
			"allocated_date = @todayStart",
			"order",
			0,
			0,
		)

		// Get tasks that need to be moved (incomplete tasks from previous days), ordered by current order
		const tasksToMove = $app.findRecordsByFilter(
			"tasks",
			"completed = false && allocated_date < @todayStart",
			"order",
			0,
			0,
		)

		// Re-assign orders: existing tasks first (1000, 2000, 3000...)
		let orderValue = 1000
		for (const task of existingTasks) {
			task.set("order", orderValue)
			$app.save(task)
			orderValue += 1000
		}

		// Then moved tasks get the next order values and increment carry_over
		for (const task of tasksToMove) {
			const currentCarryOver = task.get("carry_over") || 0
			task.set("allocated_date", startOfDay)
			task.set("order", orderValue)
			task.set("carry_over", currentCarryOver + 1)
			$app.save(task)
			orderValue += 1000
		}
	} catch (e) {
		console.error(e)
	}
})
