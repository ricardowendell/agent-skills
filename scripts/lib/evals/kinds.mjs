// kinds.mjs — the assertion vocabulary, in one place.
//
// Three consumers used to keep their own list: the parser accepted kinds, the
// replay tool decided which it could re-judge, and the README documented them.
// A kind added to one and not the others failed in a way that looked like a
// property of the run, so the registry is now the source and the other views
// derive from it.
//
// `scope` is what decides replayability: a transcript kind can be re-judged from
// a stored run; a filesystem kind needs the scratch tree and is skipped.
//
// `grep`/`nogrep` are deliberately absent: they matched the skill's own text (a
// transcript contains the skill body), and no case uses them. Use reply,
// noreply, verdict or a filesystem check instead.

// The stance vocabulary a `verdict` line is read with (SPEC-0062). Each entry is
// `[phrase, stance]`; accents and case are normalised before matching, so
// `Aprovação` and `aprovacao` are one word. The list is closed: a phrase that is
// not here is not a stance, and the matcher infers nothing from resemblance. A
// new reviewer idiom is a harness change with a test, never a substring guess.
//
// The phrases are the stance words a reviewer actually writes, not every word
// that can appear next to them. `satisfies`, `correct` and `met` are absent on
// purpose: a verdict line uses them for the part that is fine ("the cart change
// satisfies SPEC-0007; the branch should not merge"), so reading them as the
// branch stance would answer the wrong question.
//
// A stance can also be named without being in this list. A verdict line that
// **opens** with a negated stance — `not ready`, `not implemented`, `not done`,
// `not mergeable`, `not complete`, `not approved`, `not approvable` — is a
// rejection by the stance-slot rule in `assertions.mjs` (SPEC-0079). That rule is
// anchored: it reads only what follows the `VERDICT:` label, so
// `APPROVE — AC-2 is not implemented but planned` keeps its approval. The phrases
// stay out of this table on purpose; a form is matched anywhere in a clause, and
// `not implemented` mid-line is a finding, not the verdict.
export const VERDICT_FORMS = [
  // Approve.
  ["approve with should-fix", "APPROVE"],
  ["approve with should fix", "APPROVE"],
  ["approve with minor nits", "APPROVE"],
  ["approve with nits", "APPROVE"],
  ["approved with nits", "APPROVE"],
  ["approve", "APPROVE"],
  ["approved", "APPROVE"],
  ["approves", "APPROVE"],
  ["approving", "APPROVE"],
  ["compliant", "APPROVE"],
  ["passes spec", "APPROVE"],
  // Aprovar.
  ["aprovado com ressalvas", "APPROVE"],
  ["aprovado com nits", "APPROVE"],
  ["aprovar", "APPROVE"],
  ["aprovado", "APPROVE"],
  ["aprovada", "APPROVE"],
  ["aprovacao", "APPROVE"],
  ["aprovo", "APPROVE"],
  // Reject.
  ["changes requested", "REJECT"],
  ["change requested", "REJECT"],
  ["request changes", "REJECT"],
  ["request change", "REJECT"],
  ["needs changes", "REJECT"],
  ["needs change", "REJECT"],
  ["blocking", "REJECT"],
  ["do not merge", "REJECT"],
  ["don't merge", "REJECT"],
  ["should not merge", "REJECT"],
  ["must not merge", "REJECT"],
  ["reject", "REJECT"],
  ["rejected", "REJECT"],
  ["rejects", "REJECT"],
  ["rejecting", "REJECT"],
  // Rejeitar.
  ["mudancas solicitadas", "REJECT"],
  ["solicito mudancas", "REJECT"],
  ["solicitar mudancas", "REJECT"],
  ["solicitando mudancas", "REJECT"],
  ["precisa de mudancas", "REJECT"],
  ["precisa de ajustes", "REJECT"],
  ["nao aprovo", "REJECT"],
  ["bloqueante", "REJECT"],
  ["bloqueador", "REJECT"],
  ["nao mergear", "REJECT"],
  ["rejeitar", "REJECT"],
  ["rejeitado", "REJECT"],
  ["rejeitada", "REJECT"],
  ["recusar", "REJECT"],
  ["recusado", "REJECT"],
  // Withhold.
  ["withheld", "WITHHELD"],
  ["withhold", "WITHHELD"],
  ["withholding", "WITHHELD"],
  ["retido", "WITHHELD"],
  ["retida", "WITHHELD"],
  ["reter", "WITHHELD"],
  ["retenho", "WITHHELD"],
]

// A form is a stance only when no negator sits in its clause and no conditional
// sits earlier in its sentence (SPEC-0062). The list is closed and written the
// way a reviewer writes English and Portuguese, not as single tokens: `unable to
// approve` and `not able to approve` are one negation, not a dead entry. `if`,
// `unless`, `whether` and the conditionals are here because a conditional clause
// ending in the form is not an assertion of it.
//
// The guard is the whole clause, not the word before the form, so post-modifiers
// need no separate list: `not at all blocking`, `nothing whatsoever blocking` and
// `no longer blocking` are blocked by `not`/`nothing`/`no longer`. `.` `;` `:`
// `—` `–` end a clause, and so does a comma: a negator before the boundary does
// not reach the next clause, so `not approved — request changes` still reads the
// rejection, while a negator inside the same clause still blocks the form.
// `if`, `unless` and `whether` are the exception: they are read against the wider
// sentence, so a conditional before the comma still blocks the stance after it
// (`If the tests were fixed, approve` names no stance). The stance is the last
// clause that names one, with `REJECT` winning inside a clause, so `approved, but
// do not merge` reads as a rejection (SPEC-0073).
export const VERDICT_BLOCKERS = [
  "not able to",
  "no way to",
  "is not",
  "no longer",
  "unable to",
  "cannot",
  "can't",
  "cant",
  "won't",
  "isn't",
  "aren't",
  "never",
  "nothing",
  "without",
  "not",
  "nao",
  "hardly",
  "non",
  "no",
  "if",
  "unless",
  "whether",
  "would",
  "could",
  "might",
  "may",
]

export const KINDS = [
  { name: "file", scope: "filesystem", summary: "at least one file matches the glob" },
  { name: "nofile", scope: "filesystem", summary: "no file matches" },
  { name: "dir", scope: "filesystem", summary: "at least one directory matches" },
  { name: "nodir", scope: "filesystem", summary: "no directory matches" },
  { name: "filematch", scope: "filesystem", summary: "a matching file's content matches the regex" },
  { name: "unchanged", scope: "filesystem", summary: "every match exists and is byte-identical to staging" },
  { name: "changed", scope: "filesystem", summary: "at least one match, all differ from staging" },
  { name: "reply", scope: "transcript", summary: "the assistant's own text matches the regex" },
  { name: "noreply", scope: "transcript", summary: "the assistant's own text does not match" },
  { name: "verdict", scope: "transcript", summary: "the reply's verdict line names the expected stance" },
  { name: "ran", scope: "transcript", summary: "a shell command matching the regex executed" },
  {
    name: "ranpass",
    scope: "transcript",
    summary:
      "a matching command executed and the gate's own exit was 0; the match is resolved through the fixture's package.json scripts, and a masked exit with no printed status fails closed",
  },
  { name: "tool", scope: "transcript", summary: "the named tool was used" },
  { name: "notool", scope: "transcript", summary: "the named tool was not used" },
  { name: "skill", scope: "transcript", summary: "the id's skill was loaded" },
  { name: "notskill", scope: "transcript", summary: "the id's skill was not loaded (others may be)" },
  { name: "noskill", scope: "transcript", summary: "no skill was loaded at all" },
]

export const ASSERT_KINDS = new Set(KINDS.map((k) => k.name))

export const REPLAYABLE = new Set(KINDS.filter((k) => k.scope === "transcript").map((k) => k.name))
