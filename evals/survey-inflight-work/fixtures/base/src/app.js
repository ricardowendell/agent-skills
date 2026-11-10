import { total } from "./cart.js"

export function checkout(items) {
  return { total: total(items), currency: "USD" }
}
