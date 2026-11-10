import { quote } from "../pricing/index.js"

export function getQuote({ order, catalog }, now = new Date()) {
  try {
    return { status: 200, body: quote(order, catalog, now) }
  } catch (err) {
    return { status: 400, body: { error: err.message } }
  }
}
