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
  ["not merge", "REJECT"],
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

// A form is a stance only when the word directly before it does not negate or
// condition it (SPEC-0062). Closed, and short on purpose: `not approved` and
// `cannot approve` are not approvals, and `non-blocking` is not a `blocking`
// finding. The guard is adjacent — one word — so `not approved — request
// changes` still reads as the rejection it ends with.
export const VERDICT_BLOCKERS = [
  "not",
  "no",
  "nao",
  "never",
  "cannot",
  "can't",
  "cant",
  "unable",
  "without",
  "non",
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
  { name: "ranpass", scope: "transcript", summary: "a matching command executed and at least one exited 0" },
  { name: "tool", scope: "transcript", summary: "the named tool was used" },
  { name: "notool", scope: "transcript", summary: "the named tool was not used" },
  { name: "skill", scope: "transcript", summary: "the id's skill was loaded" },
  { name: "notskill", scope: "transcript", summary: "the id's skill was not loaded (others may be)" },
  { name: "noskill", scope: "transcript", summary: "no skill was loaded at all" },
]

export const ASSERT_KINDS = new Set(KINDS.map((k) => k.name))

export const REPLAYABLE = new Set(KINDS.filter((k) => k.scope === "transcript").map((k) => k.name))
