// verdict.mjs — the stance a verdict line states.
//
// Split out of assertions.mjs (SPEC-0081) with no semantic change: the form and
// blocker tables, the clause boundaries, the stance walk and the anchored
// negated-stance rule (SPEC-0079) live here.

import { VERDICT_BLOCKERS, VERDICT_FORMS } from "./kinds.mjs"

// Accents and case are decoration too: `Aprovação` and `aprovacao` are one word.
// Markdown emphasis is stripped before matching so a bolded stance is the same
// stance; the line itself is never trimmed to a prefix, because a verdict line
// is often prose ("compliant — approve", "changes requested — one defect").
function normaliseVerdict(line) {
  return line
    .replace(/[*_`]/g, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

// Longest first, so a phrase that prefixes another is tried before it. Compiled
// once: the table is closed at module load, so a typo in it is a startup failure,
// not a silently dead branch of the matcher.
const FORM_MATCHERS = VERDICT_FORMS.slice()
  .sort((a, b) => b[0].length - a[0].length)
  .map(([phrase, name]) => ({
    phrase,
    name,
    re: new RegExp(`(?:^|[^a-z])${escapeRe(phrase)}(?![a-z])`, "g"),
  }))

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// The guard applies to the whole clause the form sits in, so a negator does not
// have to be the word immediately before it: `unable to approve`, `not able to
// approve` and `not at all blocking` are all blocked. A negator cannot reach
// across a comma, so `AC-2 is not implemented, changes requested` names a
// rejection, while a negator inside the same clause still blocks its form. The
// comma is a clause for the stance walk too (see `stance`).
//
// A conditional is not a negator: `if`, `unless` and `whether` introduce a
// clause whose consequent follows the comma, so the comma does not end their
// government — `If the tests were fixed, approve` stays a promise, not a stance.
// Those three read across the comma; every other blocker resets at it.
const CLAUSE_BOUNDARIES = [".", ";", ":", "—", "–", ","]
const CONDITION_BOUNDARIES = [".", ";", ":", "—", "–"]
const SENTENCE_BLOCKERS = new Set(["if", "unless", "whether"])

function boundaryCut(text, start, boundaries = CLAUSE_BOUNDARIES) {
  const before = text.slice(0, start)
  let cut = -1
  for (const boundary of boundaries) cut = Math.max(cut, before.lastIndexOf(boundary))
  return cut
}

function clauseBefore(text, start, boundaries = CLAUSE_BOUNDARIES) {
  const cut = boundaryCut(text, start, boundaries)
  return cut === -1 ? text.slice(0, start) : text.slice(cut + 1, start)
}

function blockerRe(list) {
  return new RegExp(
    `(?:^|[^a-z])(?:${list
      .map((b) => escapeRe(normaliseVerdict(b)))
      .sort((a, b) => b.length - a.length)
      .join("|")})(?![a-z])`,
  )
}

const NEGATOR_RE = blockerRe(VERDICT_BLOCKERS.filter((b) => !SENTENCE_BLOCKERS.has(b)))
const CONDITION_RE = blockerRe(VERDICT_BLOCKERS.filter((b) => SENTENCE_BLOCKERS.has(b)))

function blockedBefore(text, start) {
  return (
    NEGATOR_RE.test(clauseBefore(text, start, CLAUSE_BOUNDARIES)) ||
    CONDITION_RE.test(clauseBefore(text, start, CONDITION_BOUNDARIES))
  )
}

// The stance a verdict line states. A verdict line ends with its conclusion, so
// the stance is taken from the **last clause that states one**: the alternative
// a line rejects in an early clause is not the verdict
// (`reject the alternative; approve the change` is an approval). Within that
// clause a rejection still wins over a withheld and an approval
// (`Approve the tests; reject the change`, `approved, but do not merge`), because
// a clause that names a blocking finding is not an approval whatever its first
// form says. Clauses are cut at the boundaries above, comma included; a clause
// with no unblocked form does not erase the one before it, so
// `The verdict is APPROVE. Notes: AC-2 is not implemented.` stays an approval.
// No unnegated form anywhere means no stance: the line is reported by its first
// word, so a near-miss reads as what it literally says instead of as its surface
// reading.
const STANCE_PRECEDENCE = ["APPROVE", "WITHHELD", "REJECT"]

// A verdict line that **opens** with the negation of a stance names a rejection
// (SPEC-0079). The phrase is ambiguous mid-line (`AC-2 is not implemented` is a
// finding, not the verdict), but it is unambiguous as the first thing after the
// label, so this rule is anchored and runs before the form scan: the stance slot
// answers the question the closed vocabulary cannot. Because the scan is skipped,
// it also wins over SPEC-0073's last-clause rule for this shape: `not ready, but
// approve after the fix` reads REJECT, not APPROVE (no stored line has that
// shape; the stance slot is the rejection). `not applicable` is not in the set
// and still names no stance; `no blockers` is untouched.
const NEGATED_STANCES = /^not\s+(?:ready|implemented|done|mergeable|complete|approved|approvable)\b/i

function stance(line) {
  const text = normaliseVerdict(line)
  if (NEGATED_STANCES.test(text)) return "REJECT"
  let lastCut = -1
  let lastStance = ""
  for (const { phrase, name, re } of FORM_MATCHERS) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text))) {
      const at = m.index + m[0].length - phrase.length
      if (!blockedBefore(text, at)) {
        const cut = boundaryCut(text, at)
        if (cut > lastCut) {
          lastCut = cut
          lastStance = name
        } else if (cut === lastCut && STANCE_PRECEDENCE.indexOf(name) > STANCE_PRECEDENCE.indexOf(lastStance)) {
          lastStance = name
        }
      }
      if (re.lastIndex === m.index) re.lastIndex++
    }
  }
  if (lastStance) return lastStance
  const first = /^[a-z]+/.exec(text)
  return first ? first[0].toUpperCase() : ""
}
export { normaliseVerdict, stance }
