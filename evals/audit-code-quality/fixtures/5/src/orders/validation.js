export function validateOrder(order) {
  if (!order.customerId) throw new Error("customerId is required")
  if (!Array.isArray(order.lines) || order.lines.length === 0) {
    throw new Error("an order needs at least one line")
  }
  if (order.lines.some((line) => line.quantity < 1)) {
    throw new Error("line quantity must be positive")
  }
  return order
}
