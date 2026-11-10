import { discountFor, taxFor } from "./rules.js"
import { multiplyCents, roundCents } from "./money.js"

export function quote(order, catalog, now) {
  if (!Array.isArray(order.lines) || order.lines.length === 0) {
    throw new Error("an order needs at least one line")
  }

  const subtotal = order.lines.reduce((sum, line) => {
    const item = catalog[line.sku]
    if (!item) throw new Error(`unknown sku: ${line.sku}`)
    return sum + multiplyCents(item.price, line.quantity)
  }, 0)

  const discount = discountFor(order, subtotal, now)
  const tax = taxFor(subtotal - discount)

  return {
    total: roundCents(subtotal - discount + tax),
    currency: order.currency ?? "USD",
  }
}
