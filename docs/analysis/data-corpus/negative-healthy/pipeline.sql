-- A healthy pipeline: a correct aggregate join and a correct incremental load.
--
-- Read by check.sql. There is no state switch here: the tree is the correct
-- state, and the oracle must report zero findings on it.

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

-- Correct aggregate join: filter the versioned dimension before grouping.
CREATE TABLE revenue_by_customer AS
SELECT
  o.customer_id,
  d.customer_name,
  count(*)          AS orders,
  sum(o.amount_cents) AS revenue_cents
FROM orders AS o
JOIN dim_customers AS d
  ON d.customer_id = o.customer_id
 AND d.is_current = 1
GROUP BY o.customer_id, d.customer_name;

-- Correct incremental load: natural key plus upsert, run twice on purpose (an
-- at-least-once retry) to show it is already idempotent.
CREATE TABLE daily_events (
  event_id     TEXT    NOT NULL PRIMARY KEY,
  customer_id  TEXT    NOT NULL,
  amount_cents INTEGER NOT NULL
);

CREATE TABLE staging_events (
  event_id     TEXT    NOT NULL,
  customer_id  TEXT    NOT NULL,
  amount_cents INTEGER NOT NULL
);

INSERT INTO staging_events (event_id, customer_id, amount_cents) VALUES
  ('evt-1001', 'C-100', 1200),
  ('evt-1002', 'C-200', 3500),
  ('evt-1003', 'C-100',  800),
  ('evt-1004', 'C-300', 9900);

INSERT INTO daily_events (event_id, customer_id, amount_cents)
SELECT event_id, customer_id, amount_cents FROM staging_events WHERE true
ON CONFLICT (event_id) DO UPDATE SET
  customer_id  = excluded.customer_id,
  amount_cents = excluded.amount_cents;

-- Retry: the same batch again. This is the safe path.
INSERT INTO daily_events (event_id, customer_id, amount_cents)
SELECT event_id, customer_id, amount_cents FROM staging_events WHERE true
ON CONFLICT (event_id) DO UPDATE SET
  customer_id  = excluded.customer_id,
  amount_cents = excluded.amount_cents;
