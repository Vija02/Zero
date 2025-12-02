// Run every hour
cronAdd("move_tasks_to_new_day", "0 * * * *", () => {
	function getStartOfDay(date = new Date()) {
		const startOfDay = new Date(date)
		startOfDay.setHours(0, 0, 0, 0)
		return startOfDay.toISOString()
	}
	try {
		$app
			.db()
			.newQuery(
				"UPDATE tasks SET allocated_date = {:startOfDay} WHERE completed = false AND allocated_date < {:startOfDay}",
			)
			.bind({
				startOfDay: getStartOfDay(),
			})
			.execute()
	} catch (e) {
		console.error(e)
	}
})
