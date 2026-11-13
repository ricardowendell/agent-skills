-- Oracle for join-duplicate-keys.
--
-- Run from the repository root (pipeline.sql builds the tree, this file asserts
-- the contract):
--   sqlite3 :memory: -bail \
--     -cmd ".parameter set @state staged" \
--     ".read docs/analysis/data-corpus/join-duplicate-keys/pipeline.sql" \
--     ".read docs/analysis/data-corpus/join-duplicate-keys/check.sql"
--
-- Exit 0 = the tree satisfies its contract. Exit 1 = at least one finding; the
-- failing line names the clause. Each assertion is a temp table with a named
-- CHECK constraint, so a violation is a real sqlite error instead of a row that
-- is easy to overlook.

.bail on

CREATE TEMP TABLE state_ok (
  ok INTEGER NOT NULL
     CONSTRAINT "FAIL: join-duplicate-keys: @state must be staged or corrected" CHECK (ok = 1)
);
INSERT INTO state_ok
VALUES (CASE WHEN @state IN ('staged', 'corrected') THEN 1 ELSE 0 END);

-- 1. The order grain survives the join: one enriched row per source order.
CREATE TEMP TABLE grain_ok (
  ok INTEGER NOT NULL
     CONSTRAINT "FAIL: join-duplicate-keys: orders_enriched has more rows than the orders grain; the duplicated dimension key multiplied the join" CHECK (ok = 1)
);
INSERT INTO grain_ok
VALUES (
  CASE
    WHEN (SELECT count(*) FROM orders_enriched) = (SELECT count(*) FROM orders) THEN 1
    ELSE 0
  END
);

-- 2. No duplicate key: order_id is unique in the enriched output.
CREATE TEMP TABLE key_ok (
  ok INTEGER NOT NULL
     CONSTRAINT "FAIL: join-duplicate-keys: order_id is not unique in orders_enriched" CHECK (ok = 1)
);
INSERT INTO key_ok
VALUES (
  CASE
    WHEN (SELECT count(DISTINCT order_id) FROM orders_enriched)
       = (SELECT count(*) FROM orders_enriched) THEN 1
    ELSE 0
  END
);

-- 3. The measure is not multiplied either: revenue is preserved.
CREATE TEMP TABLE measure_ok (
  ok INTEGER NOT NULL
     CONSTRAINT "FAIL: join-duplicate-keys: sum(amount_cents) changed across the join; rows were multiplied, not just relabelled" CHECK (ok = 1)
);
INSERT INTO measure_ok
VALUES (
  CASE
    WHEN (SELECT sum(amount_cents) FROM orders_enriched)
       = (SELECT sum(amount_cents) FROM orders) THEN 1
    ELSE 0
  END
);

SELECT 'PASS join-duplicate-keys: '
    || (SELECT count(*) FROM orders_enriched) || ' enriched rows for '
    || (SELECT count(*) FROM orders) || ' orders';
