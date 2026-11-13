-- Enrich orders with the customer dimension.
--
-- `@state` is a sqlite3 parameter set by the caller (see check.sql):
--   staged     ships the defect: the join ignores `is_current`
--   corrected  applies the fix: only the current dimension row enriches an order
--
-- `dim_customers` is a slowly changing dimension: `is_current = 1` marks the row
-- a consumer may use. C-100 has a historical row and a current one, so a join
-- that forgets the predicate emits two rows for every C-100 order.

CREATE TABLE orders (
  order_id     INTEGER PRIMARY KEY,
  customer_id  TEXT    NOT NULL,
  amount_cents INTEGER NOT NULL,
  placed_on    TEXT    NOT NULL
);

INSERT INTO orders (order_id, customer_id, amount_cents, placed_on) VALUES
  (1001, 'C-100', 1200, '2026-11-02'),
  (1002, 'C-200', 3500, '2026-11-02'),
  (1003, 'C-100',  800, '2026-11-03'),
  (1004, 'C-300', 9900, '2026-11-04');

CREATE TABLE dim_customers (
  customer_id   TEXT    NOT NULL,
  customer_name TEXT    NOT NULL,
  valid_from    TEXT    NOT NULL,
  is_current    INTEGER NOT NULL CHECK (is_current IN (0, 1))
);

INSERT INTO dim_customers (customer_id, customer_name, valid_from, is_current) VALUES
  ('C-100', 'Ada Lovelace', '2024-01-01', 0),
  ('C-100', 'Ada Byron',    '2025-06-01', 1),
  ('C-200', 'Grace Hopper', '2024-03-01', 1),
  ('C-300', 'Alan Turing',  '2024-05-01', 1);

CREATE TABLE orders_enriched AS
SELECT
  o.order_id,
  o.customer_id,
  d.customer_name,
  o.amount_cents,
  o.placed_on
FROM orders AS o
JOIN dim_customers AS d
  ON d.customer_id = o.customer_id
 AND (d.is_current = 1 OR @state = 'staged');
