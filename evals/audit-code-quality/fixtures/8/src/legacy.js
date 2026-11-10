import { total } from "./app.js"

export function legacyTotal(order) {
  return total(order.lines)
}
