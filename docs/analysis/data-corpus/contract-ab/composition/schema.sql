-- The table the platform team will deploy. This is the input to the contract.
CREATE TABLE orders_export (
  order_id     INTEGER NOT NULL PRIMARY KEY,
  customer_id  TEXT    NOT NULL,
  amount_cents INTEGER NOT NULL,
  placed_on    DATE    NOT NULL,
  channel      TEXT
);
