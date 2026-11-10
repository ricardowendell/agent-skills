// Formatting helpers shared by the dashboard tables.
//
// This module grew by accretion: every table needed one more label and one more
// formatter, and they all landed here. The linter warns at 80 lines, so the fix
// is to split this file, not to raise the limit.

export const STATUS_LABEL = {
  draft: "Draft",
  review: "In review",
  blocked: "Blocked",
  done: "Done",
  archived: "Archived",
}

export const PRIORITY_LABEL = {
  p0: "Critical",
  p1: "High",
  p2: "Medium",
  p3: "Low",
}

export const STATUS_ORDER = ["draft", "review", "blocked", "done", "archived"]

export const PRIORITY_ORDER = ["p0", "p1", "p2", "p3"]

export const COLUMN_LABEL = {
  id: "ID",
  title: "Title",
  status: "Status",
  priority: "Priority",
  owner: "Owner",
  updated: "Updated",
}

export function statusLabel(status) {
  return STATUS_LABEL[status] ?? "Unknown"
}

export function priorityLabel(priority) {
  return PRIORITY_LABEL[priority] ?? "Unranked"
}

export function statusRank(status) {
  const index = STATUS_ORDER.indexOf(status)
  return index === -1 ? STATUS_ORDER.length : index
}

export function priorityRank(priority) {
  const index = PRIORITY_ORDER.indexOf(priority)
  return index === -1 ? PRIORITY_ORDER.length : index
}

export function compareStatus(a, b) {
  return statusRank(a.status) - statusRank(b.status)
}

export function comparePriority(a, b) {
  return priorityRank(a.priority) - priorityRank(b.priority)
}

export function compareUpdated(a, b) {
  return new Date(b.updated).getTime() - new Date(a.updated).getTime()
}

export function formatUpdated(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  const pad = (n) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatUpdatedWithTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  const pad = (n) => String(n).padStart(2, "0")
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatOwner(owner) {
  if (!owner) return "Unassigned"
  if (!owner.name) return owner.email ?? "Unassigned"
  return owner.name
}

export function formatOwnerShort(owner) {
  if (!owner) return "—"
  if (!owner.name) return (owner.email ?? "—").split("@")[0]
  return owner.name
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function formatRow(row, columns = Object.keys(COLUMN_LABEL)) {
  return columns.map((column) => {
    switch (column) {
      case "status":
        return statusLabel(row.status)
      case "priority":
        return priorityLabel(row.priority)
      case "owner":
        return formatOwner(row.owner)
      case "updated":
        return formatUpdated(row.updated)
      case "title":
        return row.title ?? ""
      case "id":
        return row.id ?? ""
      default:
        return row[column] ?? ""
    }
  })
}

export function formatRows(rows, columns) {
  return rows.map((row) => formatRow(row, columns))
}

export function sortRows(rows, key) {
  const copy = [...rows]
  if (key === "status") return copy.sort(compareStatus)
  if (key === "priority") return copy.sort(comparePriority)
  if (key === "updated") return copy.sort(compareUpdated)
  return copy
}

export function groupByStatus(rows) {
  const groups = {}
  for (const status of STATUS_ORDER) groups[status] = []
  for (const row of rows) {
    if (!groups[row.status]) groups[row.status] = []
    groups[row.status].push(row)
  }
  return groups
}

export function countByStatus(rows) {
  const counts = {}
  for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1
  return counts
}

export function isEmptyRow(row) {
  return !row || Object.values(row).every((value) => value === null || value === undefined || value === "")
}
