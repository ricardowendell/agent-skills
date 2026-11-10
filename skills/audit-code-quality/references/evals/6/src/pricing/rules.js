const TAX_RATE = 0.2
const LOYALTY_DISCOUNT = 0.1
const YEAR_MS = 365 * 24 * 60 * 60 * 1000

export function discountFor(order, subtotal, now) {
  if (!order.customerSince) return 0
  const loyal = now.getTime() - order.customerSince.getTime() > YEAR_MS
  return loyal ? Math.round(subtotal * LOYALTY_DISCOUNT) : 0
}

export function taxFor(base) {
  return Math.round(base * TAX_RATE)
}
