import { formatDate } from "./format/date.js"
import { formatCurrency } from "./format/currency.js"
import { formatPercent } from "./format/percent.js"

export function reportLine(row) {
  return [
    formatDate(row.date),
    row.label,
    formatCurrency(row.cents),
    formatPercent(row.rate),
  ].join(" | ")
}

export function renderReport(rows) {
  return rows.map(reportLine).join("\n")
}
