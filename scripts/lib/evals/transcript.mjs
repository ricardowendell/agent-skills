// transcript.mjs — the markdown file one recorded run is stored in.
//
// The header is written by the runner, patched when the judge changes the
// verdict, and read back by replay. Keeping those three in one module is what
// stops a field from existing in two of them and missing from the third. The
// raw JSONL stream sits in a fenced block after `## Transcript`.

// The header contract. Callers pass only what their run has: a smoke run has no
// exit or transcript body, a staging failure has neither.
export function renderHeader({
  skill,
  n,
  prompt,
  scratch,
  status,
  reason = "",
  exit = null,
  skillLine = null,
  skillHash = null,
  meta = null,
  durationMs = null,
}) {
  const lines = [
    `# Eval: ${skill} case ${n}`,
    "",
    `**Prompt:** ${prompt}`,
    "",
    `**Scratch:** ${scratch}`,
  ]
  if (exit !== null) lines.push(`**Exit:** ${exit}`)
  lines.push(`**Status:** ${status}${reason ? ` — ${reason}` : ""}`)
  if (skillLine) lines.push(skillLine)
  if (skillHash !== null) lines.push(`**Skill hash:** ${skillHash}`)
  if (meta) {
    const parts = [`**Repo:** ${meta.repoSha}`, `**Agent:** ${meta.agent}`]
    if (meta.model) parts.push(`**Model:** ${meta.model}`)
    if (meta.level) parts.push(`**Level:** ${meta.level}`)
    if (durationMs !== null) parts.push(`**Duration:** ${durationMs}ms`)
    lines.push(parts.join("  "))
  }
  return lines.join("\n")
}

// The judge can turn a pass into a failure after the file is written, so the
// status line is rewritten in place rather than the whole document re-rendered.
export function patchStatus(md, status, reason = "") {
  return md.replace(/^\*\*Status:\*\*.*$/m, `**Status:** ${status}${reason ? ` — ${reason}` : ""}`)
}

export function parseTranscript(md) {
  const head = md.split("## Transcript")[0]
  const title = /^# Eval: (\S+) case (\d+)/m.exec(md)
  if (!title) return null
  const field = (name) => new RegExp(`^\\*\\*${name}:\\*\\* (.+)$`, "m").exec(head)?.[1].trim() ?? ""
  const exit = field("Exit")

  // Line-based, not split on the fence marker: the agent's own replies contain
  // ``` blocks, which truncate a naive split at the first code it wrote.
  const lines = md.split("\n")
  const start = lines.findIndex((l) => l.trim() === "## Transcript")
  let i = start + 1
  while (i < lines.length && lines[i].trim() !== "```") i++
  const body = []
  for (i = i + 1; i < lines.length && lines[i].trim() !== "```"; i++) body.push(lines[i])

  return {
    skill: title[1],
    n: Number(title[2]),
    scratch: field("Scratch"),
    // classify() compares strictly against 0 and the header stores a string.
    exit: /^-?\d+$/.test(exit) ? Number(exit) : exit || "0",
    recorded: field("Status").split(/\s/)[0] ?? "",
    // The control arm passes when nothing loaded — the opposite of the gate.
    arm: /^\*\*Skill:\*\* .*control arm/m.test(head) ? "without-skill" : "with-skill",
    text: body.join("\n"),
  }
}
