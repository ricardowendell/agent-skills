export function insertOrder(db, order) {
  return db.insert("orders", order)
}
