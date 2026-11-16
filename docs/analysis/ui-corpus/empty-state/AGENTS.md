# empty-state — the orders table

## Task contract

- The page is `orders.html` and `styles.css`. That is the whole surface, and it
  is **editable**: the empty state is designed in these files.
- The table renders `No data` today when the account has no orders. That is the
  state to finish. The populated table is not available and no order may be
  invented to preview it.
- Keep the table's own vocabulary — the five columns are Order, Customer,
  Placed, Total, Status — and keep the table in place for when rows exist.
- No network, no images to fetch and no build step. Inline SVG is fine.

## Human review (declared, not machine-checked)

A deterministic visual oracle is frozen (`SPEC-0077`): `changed orders.html`
proves an edit happened, never that the state is designed. The reviewer reads the
diff and answers:

1. Is the empty state an actual designed state — a reason, a next step — rather
   than `No data` reworded?
2. Does it distinguish the first-use state ("no orders yet") from an
   empty-filter result, or say which one it designed?
3. Does the action it offers match the page's real next step (create an order),
   without inventing data or a permission the page does not have?
4. Is it reachable without a mouse, and does it keep the table's structure and
   column vocabulary?
5. Does the page still work when rows exist (the empty state is a state, not a
   replacement)?
