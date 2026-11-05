function toCents(amount) {
  return Math.round(amount * 100)
}

export function refund(amount) {
  return { cents: toCents(amount), status: "refunded" }
}
