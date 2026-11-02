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
