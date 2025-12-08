/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1598076546")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_UWolL3pxbS` ON `tasks` (`allocated_date`)",
      "CREATE INDEX `idx_UgOE0d0hrA` ON `tasks` (`completed`)",
      "CREATE INDEX `idx_M8C7L6r8J4` ON `tasks` (`google_calendar_date`)"
    ]
  }, collection)

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "date3262951020",
    "max": "",
    "min": "",
    "name": "google_calendar_date",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1598076546")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_UWolL3pxbS` ON `tasks` (`allocated_date`)",
      "CREATE INDEX `idx_UgOE0d0hrA` ON `tasks` (`completed`)"
    ]
  }, collection)

  // remove field
  collection.fields.removeById("date3262951020")

  return app.save(collection)
})
