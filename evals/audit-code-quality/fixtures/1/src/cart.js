import { formatPrice } from "./pricing.js"

export function cartTotal(items) {
  const cents = items.reduce((sum, item) => sum + item.price, 0)
  return formatPrice(cents)
}
