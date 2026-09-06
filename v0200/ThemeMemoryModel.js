const stateVersion = 1

const stringValue = (value) => String(value || "")

const safePath = (value) => {
  const path = stringValue(value).trim()
  if (!path.startsWith("/") || path.length > 4096 || path.includes("\0")) return ""
  return path
}

const safeThemeName = (value) => {
  const name = stringValue(value).trim()
  if (!name || name.length > 255 || /[\/\0]/.test(name) || name === "." || name === "..") return ""
  return name
}

const safeIconName = (value) => {
  const name = stringValue(value).trim()
  if (!name || name.length > 255 || /[\/\0]/.test(name) || name.startsWith(".")) return ""
  if (!/^[A-Za-z0-9][A-Za-z0-9._+-]*$/.test(name)) return ""
  return name
}

const emptyState = () => ({ version: stateVersion, themes: {} })

const normalizeThemeEntry = (entry) => {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null

  const wallpaper = safePath(entry.wallpaper)
  const icons = safeIconName(entry.icons)
  const iconsDefault = safeIconName(entry.iconsDefault)
  if (!wallpaper && !icons && !iconsDefault) return null

  const normalized = {}
  if (wallpaper) normalized.wallpaper = wallpaper
  if (icons) normalized.icons = icons
  if (iconsDefault) normalized.iconsDefault = iconsDefault
  return normalized
}

const normalizeThemes = (themes) => {
  const source = themes && typeof themes === "object" && !Array.isArray(themes) ? themes : {}
  return Object.keys(source).reduce((result, rawName) => {
    const name = safeThemeName(rawName)
    if (!name) return result
    const entry = normalizeThemeEntry(source[rawName])
    if (entry) result[name] = entry
    return result
  }, {})
}

const parseState = (raw) => {
  try {
    const parsed = JSON.parse(stringValue(raw) || "{}")
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return emptyState()
    return {
      version: stateVersion,
      themes: normalizeThemes(parsed.themes)
    }
  } catch (_error) {
    return emptyState()
  }
}

const serializeState = (state) => {
  const themes = normalizeThemes(state && state.themes)
  return JSON.stringify({ version: stateVersion, themes }, null, 2) + "\n"
}

const cloneState = (state) => parseState(serializeState(state || emptyState()))

const themeEntry = (state, themeName) => {
  const name = safeThemeName(themeName)
  if (!name) return null
  const themes = normalizeThemes(state && state.themes)
  return themes[name] || null
}

const withThemeEntry = (state, themeName, updater) => {
  const name = safeThemeName(themeName)
  if (!name || typeof updater !== "function") return cloneState(state)

  const next = cloneState(state)
  const current = next.themes[name] ? { ...next.themes[name] } : {}
  const updated = updater(current)
  const normalized = normalizeThemeEntry(updated)
  if (normalized) next.themes[name] = normalized
  else delete next.themes[name]
  return next
}

const setWallpaper = (state, themeName, path) =>
  withThemeEntry(state, themeName, (entry) => {
    const wallpaper = safePath(path)
    if (!wallpaper) {
      delete entry.wallpaper
      return entry
    }
    entry.wallpaper = wallpaper
    return entry
  })

const clearWallpaper = (state, themeName) =>
  withThemeEntry(state, themeName, (entry) => {
    delete entry.wallpaper
    return entry
  })

const setIcons = (state, themeName, icons, iconsDefault) =>
  withThemeEntry(state, themeName, (entry) => {
    const nextIcons = safeIconName(icons)
    if (!nextIcons) {
      delete entry.icons
      return entry
    }
    entry.icons = nextIcons
    if (!entry.iconsDefault) {
      const fallback = safeIconName(iconsDefault)
      if (fallback && fallback !== nextIcons) entry.iconsDefault = fallback
    }
    return entry
  })

const clearIcons = (state, themeName) =>
  withThemeEntry(state, themeName, (entry) => {
    delete entry.icons
    return entry
  })

const rememberedWallpaper = (state, themeName) => {
  const entry = themeEntry(state, themeName)
  return entry && entry.wallpaper ? entry.wallpaper : ""
}

const rememberedIcons = (state, themeName) => {
  const entry = themeEntry(state, themeName)
  return entry && entry.icons ? entry.icons : ""
}

const rememberedIconsDefault = (state, themeName) => {
  const entry = themeEntry(state, themeName)
  return entry && entry.iconsDefault ? entry.iconsDefault : ""
}

const hasWallpaperOverride = (state, themeName) => !!rememberedWallpaper(state, themeName)
const hasIconsOverride = (state, themeName) => !!rememberedIcons(state, themeName)

if (typeof module !== "undefined") {
  module.exports = {
    stateVersion,
    safePath,
    safeThemeName,
    safeIconName,
    emptyState,
    parseState,
    serializeState,
    themeEntry,
    setWallpaper,
    clearWallpaper,
    setIcons,
    clearIcons,
    rememberedWallpaper,
    rememberedIcons,
    rememberedIconsDefault,
    hasWallpaperOverride,
    hasIconsOverride
  }
}
