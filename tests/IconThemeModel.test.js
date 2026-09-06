const test = require("node:test")
const assert = require("node:assert/strict")

const IconThemeModel = require("../v0200/IconThemeModel.js")

test("loads icon inventory rows and skips unsafe themes", () => {
  const themes = IconThemeModel.loadInventoryRows(
    [
      "Yaru-sage-dark\t/usr/share/icons/Yaru-sage-dark/48x48/places/folder.png\t/a.png\t/m.png",
      "default\t/x.png\t\t",
      "hicolor\t/x.png\t\t",
      "../evil\t/x.png\t\t",
      "Yaru-sage-dark\t/dup.png\t\t"
    ].join("\n")
  )

  assert.deepEqual(themes, [
    {
      name: "Yaru-sage-dark",
      folder: "/usr/share/icons/Yaru-sage-dark/48x48/places/folder.png",
      app: "/a.png",
      mime: "/m.png"
    }
  ])
})

test("builds carousel rows with labels and current marker", () => {
  const rows = IconThemeModel.carouselRows(
    [
      {
        name: "Yaru-sage-dark",
        folder: "/folder.png",
        app: "/app.png",
        mime: "/mime.png"
      }
    ],
    "Yaru-sage-dark"
  )

  assert.equal(rows[0].iconTheme, "Yaru-sage-dark")
  assert.equal(rows[0].displayName, "Yaru Sage Dark")
  assert.equal(rows[0].thumbnailPath, "/folder.png")
  assert.equal(rows[0].current, true)
  assert.equal(IconThemeModel.indexForIconTheme(rows, "Yaru-sage-dark"), 0)
})
