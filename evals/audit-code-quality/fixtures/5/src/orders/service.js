import { insertOrder } from "./repository.js"

export class OrderService {
  constructor(db) {
    this.db = db
  }

  create(order) {
    return insertOrder(this.db, order)
  }
}
