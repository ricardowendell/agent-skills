import { legacyTotal } from "./legacy.js"

export function total(orders) {
  return orders.reduce((sum, order) => sum + legacyTotal(order), 0)
}
