import { formatDate } from "./format/date.js"
import { formatCurrency } from "./format/currency.js"
import { formatPercent } from "./format/percent.js"

export function exportCsv(rows) {
  const header = "date,label,amount,rate"
  const lines = rows.map((row) =>
    [
      formatDate(row.date),
      row.label,
      `"${formatCurrency(row.cents)}"`,
      formatPercent(row.rate),
    ].join(","),
  )
  return [header, ...lines].join("\n")
}
