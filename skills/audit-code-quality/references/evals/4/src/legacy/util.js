// TODO(2021-11-02): remove after the migration
export function formatMoney(cents) {
  return `$${(cents / 100).toFixed(2)}`
}

export function unusedLegacyHelper(value) {
  return value
}
