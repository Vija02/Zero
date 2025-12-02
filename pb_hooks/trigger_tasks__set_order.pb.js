/// <reference path="../pb_data/types.d.ts" />

// Set order to the very top on creation
onRecordCreate((e) => {
	const allocatedDate = e.record.get("allocated_date")

	const highestOrderRecord = $app.findRecordsByFilter(
		"tasks",
		"allocated_date = {:allocatedDate}",
		"-order",
		1,
		0,
		{ allocatedDate: allocatedDate },
	)
	const highestOrder = highestOrderRecord?.[0]?.get("order") ?? 0

	e.record.set("order", highestOrder + 1000)

	e.next()
}, "tasks")
