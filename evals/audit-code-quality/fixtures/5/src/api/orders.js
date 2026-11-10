import { OrderService } from "../orders/service.js"
import { validateOrder } from "../orders/validation.js"

const RETRIES = 3

export async function createOrder(db, body) {
  const order = validateOrder({
    customerId: body.customer_id,
    lines: body.lines,
  })

  for (let attempt = 0; attempt < RETRIES; attempt++) {
    const tx = await db.begin()
    try {
      const saved = await new OrderService(tx).create(order)
      await tx.commit()
      return { status: 201, body: saved }
    } catch (err) {
      await tx.rollback()
      if (err.code !== "WRITE_CONFLICT") throw err
    }
  }

  throw new Error("could not create the order after retries")
}
