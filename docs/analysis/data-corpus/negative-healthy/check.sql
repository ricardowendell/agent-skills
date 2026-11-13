-- Oracle for negative-healthy. Every assertion must hold; exit 0 proves the
-- checks do not manufacture a finding on a correct pipeline.
--
-- Run from the repository root:
--   sqlite3 :memory: -bail \
--     ".read docs/analysis/data-corpus/negative-healthy/pipeline.sql" \
--     ".read docs/analysis/data-corpus/negative-healthy/check.sql"

.bail on

-- 1. The aggregate join is at the customer grain: one row per paying customer.
CREATE TEMP TABLE revenue_grain_ok (
  ok INTEGER NOT NULL
     CONSTRAINT "FAIL: negative-healthy: revenue_by_customer is not at the customer grain" CHECK (ok = 1)
);
INSERT INTO revenue_grain_ok
VALUES (
  CASE
    WHEN (SELECT count(*) FROM revenue_by_customer)
       = (SELECT count(DISTINCT customer_id) FROM orders) THEN 1
    ELSE 0
  END
);

-- 2. The aggregate measures the source: no row multiplied, none lost.
CREATE TEMP TABLE revenue_total_ok (
  ok INTEGER NOT NULL
     CONSTRAINT "FAIL: negative-healthy: sum(revenue_cents) does not match the orders total" CHECK (ok = 1)
);
INSERT INTO revenue_total_ok
VALUES (
  CASE
    WHEN (SELECT sum(revenue_cents) FROM revenue_by_customer)
       = (SELECT sum(amount_cents) FROM orders) THEN 1
    ELSE 0
  END
);

-- 3. The dimension join resolved: every customer has a current name.
CREATE TEMP TABLE revenue_named_ok (
  ok INTEGER NOT NULL
     CONSTRAINT "FAIL: negative-healthy: a revenue row has no customer_name" CHECK (ok = 1)
);
INSERT INTO revenue_named_ok
VALUES (
  CASE
    WHEN (SELECT count(*) FROM revenue_by_customer WHERE customer_name IS NULL) = 0 THEN 1
    ELSE 0
  END
);

-- 4. The incremental load is idempotent: two runs left one row per event.
CREATE TEMP TABLE events_idempotent_ok (
  ok INTEGER NOT NULL
     CONSTRAINT "FAIL: negative-healthy: daily_events is not one row per event after the retry" CHECK (ok = 1)
);
INSERT INTO events_idempotent_ok
VALUES (
  CASE
    WHEN (SELECT count(*) FROM daily_events)
       = (SELECT count(*) FROM staging_events)
     AND (SELECT count(*) FROM daily_events)
       = (SELECT count(DISTINCT event_id) FROM daily_events) THEN 1
    ELSE 0
  END
);

SELECT 'PASS negative-healthy: '
    || (SELECT count(*) FROM revenue_by_customer) || ' customer rows, '
    || (SELECT count(*) FROM daily_events) || ' event rows after the retry';
