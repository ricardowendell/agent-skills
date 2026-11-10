// Money is integer cents; rounding happens here and nowhere else.
export function multiplyCents(cents, quantity) {
  return cents * quantity
}

export function roundCents(value) {
  return Math.round(value)
}
