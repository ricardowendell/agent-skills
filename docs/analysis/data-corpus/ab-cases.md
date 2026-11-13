# Contract A/B cases

The durable definitions of the four contract cells measured by `SPEC-0085`. The
mirror `.lane/pinned/datacontract/` copies each case verbatim into
`evals/breaking-change-check/cases.md` (cases 1–3) and
`evals/create-data-contract/cases.md` (case 1), with the fixtures from
[`contract-ab/`](contract-ab/). The prompt and the fixture hash are identical in
both arms; only the staged skill changes.

**B arm:** `datacontract/datacontract-skills` at `dc06664` (MIT), copied verbatim
into the gitignored mirror, with `datacontract-cli` 1.2.9 pre-installed on the
host. **A arm:** the same prompt and fixture with no skill staged. The mirror is
not committed; the decisions and the run directories are in
[`decision.md`](decision.md).

Each case declares `stage: datacontract-cli` so the official skill can follow its
own Step 0 (`datacontract --version`) and reach the CLI it builds on.

## breaking-change-check

1. **Incompatible: a required column is renamed.**
   - prompt: The producer shipped a new version of the `orders_export` contract. `contract-v1.odcs.yaml` is the version consumers use today, `contract-v2.odcs.yaml` is the one in review, and `pipeline.py` already builds the staged export. Is the change breaking for consumers? Give the verdict, the column that forces it, the version bump, and one concrete step the consumer must take before upgrading.
   - why: the change is schema-detectable (a removed required column), so both arms can find it; the cell tests whether the official skill's CLI workflow and report contract are reproduced.
   - expect: Runs `datacontract breaking`; names `customer_id` removed and `customer_ref` added; proposes a major bump; states the consumer impact.
   - assert: skill breaking-change-check
   - assert: ran datacontract
   - assert: reply Verdict
   - assert: reply Breaking
   - assert: reply customer_id
   - assert: reply customer_ref
   - assert: reply (2\.0\.0|major)
   - assert: reply consumer
   - stage: datacontract-cli

2. **Documented drift: an additive column must not be called breaking.**
   - prompt: The producer added a `channel` column to `orders_export`. `contract-v1.odcs.yaml` is the contract before the addition, `contract-v2.odcs.yaml` is the one that documents it, and `pipeline.py` builds the new export. Is the change breaking or safe for consumers? Give the verdict, say what happened to `channel`, and propose the version bump.
   - why: an additive, nullable, documented column is safe; flagging it as breaking is the false positive this cell exists to catch.
   - expect: Verdict safe; `channel` is the additive optional column; minor bump; no ERROR.
   - assert: skill breaking-change-check
   - assert: ran datacontract
   - assert: reply Verdict
   - assert: reply \bSafe\b
   - assert: reply channel
   - assert: reply (1\.6\.0|minor)
   - stage: datacontract-cli

3. **Semantic: the schema is identical and only the unit moved.**
   - prompt: `contract-v1.odcs.yaml` is the `orders_export` contract consumers use today; `contract-v2.odcs.yaml` is the version in review. `pipeline.py` builds the new export, and the schema check passes, yet I am not sure the change is safe. Is it breaking for consumers? Give the verdict, what changed, the version bump, and what the consumer must do before upgrading.
   - why: the schema is identical and `datacontract breaking` exits 0; the only evidence is the property description, so the cell tests whether the official skill's Step 3 (semantic changes no tool detects) is reproduced instead of blessing it as safe. **Instrument limit, declared:** the prompt itself says "the schema check passes, yet I am not sure the change is safe", which hands the agent the direction; the cell measures reading the description, not discovering the break without a hint. A neutral-prompt version is a follow-up, not this case.
   - expect: Verdict breaking; names the `amount_cents` unit change from cents to dollars; warns the consumer not to keep dividing by 100; proposes a major bump.
   - assert: skill breaking-change-check
   - assert: ran datacontract
   - assert: reply Verdict
   - assert: reply Breaking
   - assert: reply amount_cents
   - assert: reply cents
   - assert: reply dollars
   - assert: reply (2\.0\.0|major)
   - assert: reply consumer
   - stage: datacontract-cli

## create-data-contract

1. **Composition: create the ODCS from a DDL and the requirements.**
   - prompt: We are putting the new `orders_export` table under contract before the reporting consumer starts. `schema.sql` is the DDL the platform team will deploy and `requirements.md` is everything the owner gave us. Create the ODCS v3 contract at `contracts/orders_export.odcs.yaml` and make sure it lints clean. Tell me the file path, the lint result, and anything only the owner can answer.
   - why: creation from requirements; the contract must be valid ODCS and must not invent the unknown freshness SLA.
   - expect: Creates `contracts/orders_export.odcs.yaml`; passes `datacontract lint`; states the `amount_cents` unit; marks the freshness SLA as a TODO for the owner; leaves `status: draft`.
   - assert: skill create-data-contract
   - assert: file contracts/orders_export.odcs.yaml
   - assert: filematch contracts/orders_export.odcs.yaml apiVersion: v3
   - assert: filematch contracts/orders_export.odcs.yaml amount_cents
   - assert: filematch contracts/orders_export.odcs.yaml (cents|Cents)
   - assert: filematch contracts/orders_export.odcs.yaml customer_id
   - assert: filematch contracts/orders_export.odcs.yaml status: draft
   - assert: ranpass datacontract lint
   - assert: reply lint
   - assert: reply (TODO|freshness|owner)
   - stage: datacontract-cli
