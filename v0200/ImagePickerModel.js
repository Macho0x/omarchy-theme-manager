const stringValue = (value) => String(value || "")
const imageValues = (images) => (Array.isArray(images) ? images : [])

const nameForPath = (path) =>
  stringValue(path)
    .split("/")
    .pop()
    .replace(/\.[^/.]+$/, "")

const labelForPath = (path) =>
  nameForPath(path)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())

const normalizeSearchText = (value) =>
  stringValue(value)
    .toLowerCase()
    .replace(/[-_./]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const compactSearchText = (value) => normalizeSearchText(value).replace(/\s+/g, "")

const isSubsequence = (needle, haystack) => {
  const token = stringValue(needle)
  const text = stringValue(haystack)
  if (!token) return true
  if (!text) return false

  let index = 0
  for (const character of text) {
    if (character === token[index]) index += 1
    if (index >= token.length) return true
  }

  return false
}

const levenshteinAtMost = (left, right, maxDistance) => {
  const a = stringValue(left)
  const b = stringValue(right)
  const limit = Math.max(0, Number(maxDistance) || 0)
  if (a === b) return true
  if (Math.abs(a.length - b.length) > limit) return false

  const previous = new Array(b.length + 1)
  const current = new Array(b.length + 1)
  for (let index = 0; index <= b.length; index++) previous[index] = index

  for (let row = 1; row <= a.length; row++) {
    current[0] = row
    let rowMin = current[0]
    const aChar = a[row - 1]

    for (let column = 1; column <= b.length; column++) {
      const cost = aChar === b[column - 1] ? 0 : 1
      current[column] = Math.min(
        previous[column] + 1,
        current[column - 1] + 1,
        previous[column - 1] + cost
      )
      if (current[column] < rowMin) rowMin = current[column]
    }

    if (rowMin > limit) return false
    for (let column = 0; column <= b.length; column++) previous[column] = current[column]
  }

  return previous[b.length] <= limit
}

const tokenMatchesHaystack = (token, hayNormalized, hayCompact) => {
  const needle = stringValue(token)
  if (!needle) return true

  const compactNeedle = needle.replace(/\s+/g, "")
  if (hayNormalized.includes(needle)) return true
  if (compactNeedle && hayCompact.includes(compactNeedle)) return true

  const words = hayNormalized.split(" ").filter(Boolean)
  for (const word of words) {
    if (word.includes(needle)) return true
    // Per-token fuzzy only: subsequence or edit distance 1 on a single word.
    if (isSubsequence(needle, word)) return true
    if (needle.length >= 4 && word.length >= 4 && levenshteinAtMost(needle, word, 1)) return true
  }

  return false
}

const textMatches = (haystack, filterText) => {
  const needle = normalizeSearchText(filterText)
  if (!needle) return true

  const hayNormalized = normalizeSearchText(haystack)
  const hayCompact = compactSearchText(haystack)
  const tokens = needle.split(" ").filter(Boolean)
  return tokens.every((token) => tokenMatchesHaystack(token, hayNormalized, hayCompact))
}

const loadRows = (rows) => {
  const seenFileNames = {}

  return stringValue(rows)
    .split("\n")
    .reduce((images, row) => {
      if (!row) return images

      const [filePath, thumbnailPath = filePath] = row.split("\t")
      if (!filePath) return images

      const fileName = filePath.split("/").pop()
      if (!fileName || seenFileNames[fileName]) return images

      seenFileNames[fileName] = true
      images.push({ filePath, fileName, thumbnailPath })
      return images
    }, [])
}

const itemSearchHaystack = (image) => {
  const item = image || {}
  const filePath = stringValue(item.filePath)
  return [
    nameForPath(filePath),
    labelForPath(filePath),
    item.displayName,
    item.searchText,
    item.installSlug,
    item.owner
  ]
    .map((value) => stringValue(value))
    .join(" ")
}

const itemMatches = (images, index, filterText) => {
  const values = imageValues(images)
  if (index < 0 || index >= values.length) return false
  if (!normalizeSearchText(filterText)) return true
  return textMatches(itemSearchHaystack(values[index]), filterText)
}

const firstMatchingIndex = (images, filterText) =>
  imageValues(images).findIndex((_, index) => itemMatches(images, index, filterText))

const filteredPosition = (images, index, filterText) => {
  if (!filterText) return index

  return imageValues(images)
    .slice(0, Math.max(0, index))
    .filter((_, candidateIndex) => itemMatches(images, candidateIndex, filterText)).length
}

const selectedFilteredPosition = (images, selectedIndex, filterText) => {
  if (!filterText) return selectedIndex
  return itemMatches(images, selectedIndex, filterText)
    ? filteredPosition(images, selectedIndex, filterText)
    : 0
}

const indexForSelectedImage = (images, selectedImage) => {
  const selectedIndex = imageValues(images).findIndex((image) => image.filePath === selectedImage)
  return selectedIndex >= 0 ? selectedIndex : 0
}

const nextSelectedIndexForFilter = (images, selectedIndex, filterText) =>
  itemMatches(images, selectedIndex, filterText)
    ? selectedIndex
    : firstMatchingIndex(images, filterText)

if (typeof module !== "undefined") {
  module.exports = {
    nameForPath,
    labelForPath,
    normalizeSearchText,
    compactSearchText,
    isSubsequence,
    levenshteinAtMost,
    textMatches,
    loadRows,
    itemMatches,
    firstMatchingIndex,
    filteredPosition,
    selectedFilteredPosition,
    indexForSelectedImage,
    nextSelectedIndexForFilter
  }
}
