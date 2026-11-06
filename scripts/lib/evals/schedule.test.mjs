import test from "node:test"
import assert from "node:assert/strict"
import { drawKind, parseStop, runScheduled, stopReached } from "./schedule.mjs"

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// The scheduler is deliberately model-free: a draw is an async function that
// returns a result object. That is enough to prove parallelism, determinism and
// the stop rule without spending a token.

test("a single case fills the lanes with its repetitions", async () => {
  let active = 0
  let maxActive = 0
  const states = await runScheduled({
    cases: [{ id: "one", times: 12 }],
    concurrency: 4,
    runDraw: async () => {
      active++
      maxActive = Math.max(maxActive, active)
      await sleep(5)
      active--
      return { status: "passed" }
    },
  })
  assert.equal(maxActive, 4, "one case still uses four lanes")
  assert.equal(states[0].ran, 12)
  assert.deepEqual(states[0].indexes, Array.from({ length: 12 }, (_, i) => i + 1))
})

test("the artifact is ordered by draw index, not by completion order", async () => {
  const run = async (delayFor) => {
    const states = await runScheduled({
      cases: [{ id: "a", times: 4 }],
      concurrency: 4,
      runDraw: async ({ index }) => {
        await sleep(delayFor(index))
        return { status: index % 2 === 0 ? "failed" : "passed" }
      },
    })
    return states[0]
  }

  const slowFirst = await run((index) => (5 - index) * 5)
  const slowLast = await run((index) => index * 5)
  assert.deepEqual(slowFirst.indexes, [1, 2, 3, 4])
  assert.deepEqual(slowLast.indexes, [1, 2, 3, 4])
  assert.deepEqual(slowFirst.sequence, slowLast.sequence)
  assert.deepEqual(
    slowFirst.results.map((r) => r.status),
    slowLast.results.map((r) => r.status),
  )
})

test("concurrency is one pool shared by every case", async () => {
  let active = 0
  let maxActive = 0
  const states = await runScheduled({
    cases: [
      { id: "a", times: 3 },
      { id: "b", times: 3 },
    ],
    concurrency: 2,
    runDraw: async () => {
      active++
      maxActive = Math.max(maxActive, active)
      await sleep(5)
      active--
      return { status: "passed" }
    },
  })
  assert.equal(maxActive, 2)
  assert.deepEqual(states.map((s) => s.ran), [3, 3])
})

test("cases share the lanes round-robin instead of starving each other", async () => {
  const order = []
  await runScheduled({
    cases: [
      { id: "a", times: 2 },
      { id: "b", times: 2 },
    ],
    concurrency: 1,
    runDraw: async ({ id, index }) => {
      order.push(`${id}${index}`)
      return { status: "passed" }
    },
  })
  assert.deepEqual(order, ["a1", "b1", "a2", "b2"])
})

test("without a stop rule every repetition runs", async () => {
  const states = await runScheduled({
    cases: [{ id: "a", times: 6 }],
    concurrency: 2,
    runDraw: async () => ({ status: "passed" }),
  })
  assert.equal(states[0].ran, 6)
  assert.equal(states[0].stoppedEarly, false)
})

test("stop 5/3 stops after five clean passes with no failures", async () => {
  const states = await runScheduled({
    cases: [{ id: "a", times: 12 }],
    concurrency: 1,
    stop: { passes: 5, fails: 3 },
    runDraw: async () => ({ status: "passed" }),
  })
  assert.equal(states[0].ran, 5)
  assert.equal(states[0].passes, 5)
  assert.equal(states[0].stoppedEarly, true)
  assert.deepEqual(states[0].sequence, ["pass", "pass", "pass", "pass", "pass"])
})

test("stop 5/3 stops after three failures", async () => {
  const states = await runScheduled({
    cases: [{ id: "a", times: 12 }],
    concurrency: 1,
    stop: { passes: 5, fails: 3 },
    runDraw: async () => ({ status: "failed", reason: "verdict" }),
  })
  assert.equal(states[0].ran, 3)
  assert.equal(states[0].fails, 3)
  assert.equal(states[0].stoppedEarly, true)
  assert.deepEqual(states[0].sequence, ["fail", "fail", "fail"])
})

test("a contaminated draw in the middle is not counted as a pass", async () => {
  const outcomes = ["pass", "pass", "contaminated", "pass", "pass", "pass"]
  const states = await runScheduled({
    cases: [{ id: "a", times: 12 }],
    concurrency: 1,
    stop: { passes: 5, fails: 3 },
    runDraw: async ({ index }) => {
      const kind = outcomes[index - 1]
      if (kind === "contaminated") return { status: "unscored", contaminated: true, leak: [] }
      return { status: kind === "pass" ? "passed" : "failed" }
    },
  })
  assert.equal(states[0].ran, 6, "five passes plus the contaminated draw")
  assert.equal(states[0].passes, 5)
  assert.equal(states[0].contaminated, 1)
  assert.deepEqual(states[0].sequence, ["pass", "pass", "contaminated", "pass", "pass", "pass"])
  assert.equal(states[0].stoppedEarly, true)
})

test("an infrastructure draw is not a pass and does not feed the stop rule", async () => {
  const states = await runScheduled({
    cases: [{ id: "a", times: 12 }],
    concurrency: 1,
    stop: { passes: 5, fails: 3 },
    runDraw: async ({ index }) => {
      if (index === 2) return { status: "unscored", infrastructure: true, reason: "infrastructure: timeout" }
      return { status: "passed" }
    },
  })
  assert.equal(states[0].infrastructure, 1)
  assert.equal(states[0].passes, 5)
  assert.equal(states[0].ran, 6)
  assert.deepEqual(states[0].sequence, ["pass", "pass", "pass", "pass", "pass"])
})

test("a zero failure ceiling disables the failure arm", async () => {
  const states = await runScheduled({
    cases: [{ id: "a", times: 6 }],
    concurrency: 1,
    stop: { passes: 5, fails: 0 },
    runDraw: async ({ index }) => ({ status: index === 1 ? "failed" : "passed" }),
  })
  assert.equal(states[0].ran, 6)
  assert.equal(states[0].stoppedEarly, false)
})

test("stopping early with lanes in flight finishes the draws it started", async () => {
  const states = await runScheduled({
    cases: [{ id: "a", times: 12 }],
    concurrency: 4,
    stop: { passes: 5, fails: 3 },
    runDraw: async () => ({ status: "passed" }),
  })
  assert.ok(states[0].ran >= 5, "the target is reached")
  assert.ok(states[0].ran < 12, "but not every draw was scheduled")
  assert.equal(states[0].stoppedEarly, true)
})

test("parseStop accepts the documented forms and rejects the rest", () => {
  assert.deepEqual(parseStop("5/3"), { passes: 5, fails: 3 })
  assert.deepEqual(parseStop("5/0"), { passes: 5, fails: 0 })
  assert.equal(parseStop("5-3"), null)
  assert.equal(parseStop("0/3"), null)
  assert.equal(parseStop("5"), null)
  assert.equal(parseStop(undefined), null)
})

test("stopReached reads passes and failures, never contamination", () => {
  assert.equal(stopReached({ passes: 5, fails: 0 }, { passes: 5, fails: 3 }), true)
  assert.equal(stopReached({ passes: 4, fails: 0 }, { passes: 5, fails: 3 }), false)
  assert.equal(stopReached({ passes: 5, fails: 1 }, { passes: 5, fails: 3 }), false)
  assert.equal(stopReached({ passes: 1, fails: 3 }, { passes: 5, fails: 3 }), true)
  assert.equal(stopReached({ passes: 1, fails: 3 }, { passes: 5, fails: 0 }), false)
  assert.equal(stopReached({ passes: 5, fails: 0 }, null), false)
})

test("drawKind names infrastructure before contamination or status", () => {
  assert.equal(drawKind({ status: "unscored", infrastructure: true, contaminated: true }), "infrastructure")
  assert.equal(drawKind({ status: "unscored", contaminated: true }), "contaminated")
  assert.equal(drawKind({ status: "passed" }), "pass")
  assert.equal(drawKind({ status: "failed" }), "fail")
  assert.equal(drawKind({ status: "unscored" }), "unscored")
})
