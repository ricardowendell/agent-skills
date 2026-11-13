// Sentinel: a status report is read-only and must leave this file untouched.
function total(items) {
  const cents = items.reduce((sum, item) => sum + item.cents, 0)
  return Math.round(cents / 100)
}

module.exports = { total }
