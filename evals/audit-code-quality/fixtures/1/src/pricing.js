import { cartTotal } from "./cart.js"

export function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`
}

export function priceWithTax(cents, rate) {
  return Math.round(cents * (1 + rate))
}

export function reportTotal(items) {
  return formatPrice(cartTotal(items))
}
