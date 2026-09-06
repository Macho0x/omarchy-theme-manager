const test = require("node:test")
const assert = require("node:assert/strict")

const ThemeMemoryModel = require("../v0200/ThemeMemoryModel.js")

test("parses versioned theme memory and rejects unsafe values", () => {
  const state = ThemeMemoryModel.parseState(
    JSON.stringify({
      version: 1,
      themes: {
        solitude: {
          wallpaper: "/walls/a.webp",
          icons: "Yaru-purple-dark",
          iconsDefault: "Yaru-sage-dark"
        },
        bad: {
          wallpaper: "relative.webp",
          icons: "../evil"
        }
      }
    })
  )

  assert.deepEqual(state, {
    version: 1,
    themes: {
      solitude: {
        wallpaper: "/walls/a.webp",
        icons: "Yaru-purple-dark",
        iconsDefault: "Yaru-sage-dark"
      }
    }
  })
  assert.deepEqual(ThemeMemoryModel.parseState("not json"), ThemeMemoryModel.emptyState())
})

test("saves and clears per-theme wallpaper overrides", () => {
  let state = ThemeMemoryModel.emptyState()
  state = ThemeMemoryModel.setWallpaper(state, "solitude", "/walls/a.webp")
  assert.equal(ThemeMemoryModel.rememberedWallpaper(state, "solitude"), "/walls/a.webp")
  assert.equal(ThemeMemoryModel.hasWallpaperOverride(state, "solitude"), true)

  state = ThemeMemoryModel.clearWallpaper(state, "solitude")
  assert.equal(ThemeMemoryModel.rememberedWallpaper(state, "solitude"), "")
  assert.equal(ThemeMemoryModel.hasWallpaperOverride(state, "solitude"), false)
})

test("stores icon overrides and preserves first iconsDefault", () => {
  let state = ThemeMemoryModel.emptyState()
  state = ThemeMemoryModel.setIcons(state, "solitude", "Yaru-purple-dark", "Yaru-sage-dark")
  assert.equal(ThemeMemoryModel.rememberedIcons(state, "solitude"), "Yaru-purple-dark")
  assert.equal(ThemeMemoryModel.rememberedIconsDefault(state, "solitude"), "Yaru-sage-dark")

  state = ThemeMemoryModel.setIcons(state, "solitude", "Yaru-blue-dark", "should-not-replace")
  assert.equal(ThemeMemoryModel.rememberedIcons(state, "solitude"), "Yaru-blue-dark")
  assert.equal(ThemeMemoryModel.rememberedIconsDefault(state, "solitude"), "Yaru-sage-dark")

  state = ThemeMemoryModel.clearIcons(state, "solitude")
  assert.equal(ThemeMemoryModel.rememberedIcons(state, "solitude"), "")
  assert.equal(ThemeMemoryModel.rememberedIconsDefault(state, "solitude"), "Yaru-sage-dark")
})

test("serializes normalized state for FileView persistence", () => {
  const state = ThemeMemoryModel.setWallpaper(
    ThemeMemoryModel.emptyState(),
    "solitude",
    "/walls/a.webp"
  )
  assert.deepEqual(JSON.parse(ThemeMemoryModel.serializeState(state)), {
    version: 1,
    themes: {
      solitude: {
        wallpaper: "/walls/a.webp"
      }
    }
  })
})

test("drops empty theme entries after clearing all overrides", () => {
  let state = ThemeMemoryModel.setWallpaper(
    ThemeMemoryModel.emptyState(),
    "solitude",
    "/walls/a.webp"
  )
  state = ThemeMemoryModel.clearWallpaper(state, "solitude")
  assert.deepEqual(state.themes, {})
})
