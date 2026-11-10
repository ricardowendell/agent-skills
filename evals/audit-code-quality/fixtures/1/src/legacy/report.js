// TODO(2022-03-14): delete once the old dashboard is gone
export function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`
}

export function legacyReport(items) {
  return items.map((item) => formatPrice(item.price)).join(", ")
}
