// The smallest thing that is code: one pure function and one test.
export function total(items, rate = 0) {
  if (!Number.isFinite(rate) || rate < 0) throw new RangeError("rate must be a finite, non-negative number")
  const sum = items.reduce((n, i) => n + i.price * i.qty, 0)
  return Number((sum * (1 + rate)).toFixed(2))
}
