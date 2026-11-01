// transcript.mjs — read one recorded run back out of its markdown file.
//
// The runner writes `<OUT_ROOT>/<skill>/<n>.md`: a header (prompt, scratch, exit,
// verdict) and the raw JSONL stream in a fenced block. Reading it back is what
// makes an assertion change cheap to evaluate — replay over stored runs instead
// of paying one agent run per case.

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
