// Line and column splitting, shared by every importer in this service.
// Both helpers are load-bearing: `splitLines` keeps the 1-based line number so
// a rejection can name the offending row, and it drops blank lines so callers
// never have to.

export function splitLines(text) {
  return String(text)
    .split(/\r?\n/)
    .map((raw, i) => ({ line: i + 1, text: raw }))
    .filter(({ text: t }) => t.trim() !== "")
}

export function splitColumns(text) {
  return String(text).split(",").map((cell) => cell.trim())
}
