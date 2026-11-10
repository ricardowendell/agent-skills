function toCents(amount) {
  return Math.round(amount * 100)
}

export function charge(amount) {
  return { cents: toCents(amount), status: "pending" }
}
