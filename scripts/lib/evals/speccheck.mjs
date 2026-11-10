// speccheck.mjs — the spec contract, checked without reading for meaning.
//
// A review round on SPEC-0028 was spent on things a machine can see: `files:`
// did not match the diff, `task:` did not resolve, a dependency was declared on
// one side only, a placeholder survived into `status: implemented`. The rules
// here are structural on purpose. They answer "is this spec internally
// consistent and does the diff agree with its declaration", never "is the prose
// right".
//
// The module is pure: the CLI supplies the spec text, the diff list and the
// corpus (spec frontmatter + task filenames). That keeps every rule testable
// without a git checkout.
//
// A declared file the diff did not touch is a warning: a plan may name a file
// the implementation did not need. A touched file the spec did not declare is an
// error: that is the scope violation the rule exists to catch. Prose in Results
// is not proof of intent and is not used to suppress either direction.
//
// One construct keeps a directory move reviewable: an entry ending in `/` names
// a subtree and covers every path under that prefix. An undeclared file inside a
// declared subtree is still an error, and a subtree the diff never touches is a
// warning like any other declared entry (SPEC-0058).

const LIST_KEYS = new Set(["files", "tests", "depends_on", "blocks", "source_docs", "related_decisions"])

const stripQuotes = (value) => String(value ?? "").trim().replace(/^["']|["']$/g, "")

// The specs use a small, regular subset of YAML: scalars, `[]`, inline lists and
// block lists. A dependency on a YAML package would be a new dependency for a
// file whose whole job is to avoid one; an unsupported shape simply reads as an
// empty list and shows up as a finding downstream.
export function parseFrontmatter(text) {
  const m = String(text ?? "").match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/)
  if (!m) return { data: {}, body: String(text ?? ""), error: "missing YAML frontmatter" }

  const data = {}
  let current = null
  for (const raw of m[1].split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, "")
    if (!line.trim() || line.trim().startsWith("#")) continue

    const item = line.match(/^\s+-\s+(.*)$/)
    if (item && current) {
      data[current].push(stripQuotes(item[1]))
      continue
    }

    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!kv) continue
    const key = kv[1]
    const value = kv[2].trim()
    if (!value) {
      data[key] = []
      current = LIST_KEYS.has(key) ? key : null
      continue
    }
    if (value === "[]") {
      data[key] = []
      current = null
      continue
    }
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map(stripQuotes)
        .filter(Boolean)
      current = null
      continue
    }
    data[key] = stripQuotes(value)
    current = null
  }

  return { data, body: String(text ?? "").slice(m[0].length), error: null }
}

export function section(body, name) {
  const re = new RegExp(`^##\\s+${name}\\b.*$`, "m")
  const m = re.exec(String(body ?? ""))
  if (!m) return null
  const rest = String(body ?? "").slice(m.index + m[0].length)
  const next = rest.search(/^##\s+/m)
  return (next < 0 ? rest : rest.slice(0, next)).trim()
}

export function acceptanceCount(body) {
  const ac = section(body, "Acceptance Criteria")
  if (!ac) return 0
  return (ac.match(/^\s*(?:\d+\.\s|[-*]\s+\[[ xX]\])/gm) ?? []).length
}

// `TASK-49` and `task-49` are the same id; the filename is the authority.
export function taskNumber(value) {
  const m = String(value ?? "").match(/(\d+)/)
  return m ? String(Number(m[1])) : null
}

// `docs/specs/active/SPEC-0017-eval-leak.md` and `SPEC-0017-eval-leak` and
// `SPEC-0017` all name the same spec. The id prefix is the stable part.
export function specRef(value) {
  const text = String(value ?? "").trim().replace(/^.*\//, "").replace(/\.md$/i, "")
  const m = text.match(/^(SPEC-\d+)/i)
  return m ? m[1].toUpperCase() : text.toLowerCase()
}

export function findSpec(specs, ref) {
  const id = specRef(ref)
  return (
    specs.find((s) => String(s.id ?? "").toUpperCase() === id) ??
    specs.find((s) => specRef(s.slug ?? s.path ?? "") === id) ??
    null
  )
}

export function asListForCorpus(value) {
  if (Array.isArray(value)) return value.map(stripQuotes).filter(Boolean)
  if (typeof value === "string" && value.trim() && value.trim() !== "[]") return [stripQuotes(value)]
  return []
}

const normalizePath = (p) => String(p ?? "").trim().replace(/^\.\//, "").replace(/^\/+/, "")

// `diff` is the list of paths from `git diff --name-only`; null means the
// caller has no diff (contract-only mode). `specs` is the corpus as
// `{ id, slug, status, depends_on, blocks }`; `tasks` is the backlog filename
// list. Every finding is one line for the CLI.
export function checkSpec({ text, path = "spec", diff = null, specs = [], tasks = [] } = {}) {
  const findings = []
  const add = (rule, message, level = "error") => findings.push({ level, rule, file: path, message })

  const { data, body, error } = parseFrontmatter(text)
  if (error) {
    add("frontmatter", error)
    return findings
  }

  const status = String(data.status ?? "").toLowerCase()
  const results = section(body, "Results") ?? ""

  // --- files: non-empty and equal to the diff, both directions -------------
  const files = asListForCorpus(data.files).map(normalizePath)
  if ((status === "ready" || status === "implemented") && files.length === 0) {
    add("files-empty", "files: is empty; the spec must declare what it changes")
  }

  if (diff) {
    // `files:` is the implementation scope. The backlog queue is process
    // metadata: `backlog task archive` moves every Done task, and a commit that
    // touches the queue would otherwise report one scope violation per moved
    // file against every spec (66 on 2026-11-08). No spec declares backlog/ in
    // `files:`, so dropping it from the diff changes nothing else.
    const touched = diff.map(normalizePath).filter((path) => path && !path.startsWith("backlog/"))
    const touchedSet = new Set(touched)
    const declaredSet = new Set(files)
    const subtrees = files.filter((file) => file.endsWith("/"))
    const inSubtree = (file, prefix) => file.startsWith(prefix) && file !== prefix
    // A declared file (or subtree) the diff did not touch is a warning: the spec
    // may have planned a file the implementation did not need. Prose in Results
    // is not proof of intent, so it is never used to suppress a finding.
    for (const file of files) {
      const touchedIt = file.endsWith("/")
        ? touched.some((path) => inSubtree(path, file))
        : touchedSet.has(file)
      if (!touchedIt) {
        add("files-declared-untouched", `files: declares ${file}, but the diff does not touch it`, "warning")
      }
    }
    // A touched file the spec did not declare is a scope violation, not a
    // warning. A declared subtree covers every path under its prefix.
    for (const file of touched) {
      if (!declaredSet.has(file) && !subtrees.some((prefix) => inSubtree(file, prefix))) {
        add("files-touched-undeclared", `the diff touches ${file}, but files: does not declare it`)
      }
    }
  }

  // --- task: resolves in backlog/tasks ------------------------------------
  const task = data.task ? taskNumber(data.task) : null
  const taskFiles = tasks.map(String)
  if (task) {
    const hit = taskFiles.find((name) => new RegExp(`^task-${task}\\s*-\\s*.*\\.md$`, "i").test(name))
    if (!hit) add("task-dangling", `task: ${data.task} has no backlog/tasks/task-${task} - *.md`)
  } else if (status === "ready") {
    add("task-missing", "status: ready requires a task: that resolves in backlog/tasks")
  }

  // --- depends_on / blocks: resolve, and the blocker knows it blocks ------
  const currentId = String(data.id ?? specRef(path)).toUpperCase()
  const deps = asListForCorpus(data.depends_on)
  const blocks = asListForCorpus(data.blocks)

  for (const ref of deps) {
    const target = findSpec(specs, ref)
    if (!target) {
      add("depends_on-dangling", `depends_on ${ref} does not resolve to a spec`)
      continue
    }
    const reverse = asListForCorpus(target.blocks).map(specRef)
    if (!reverse.includes(currentId)) {
      add("depends_on-asymmetric", `depends_on ${ref}, but that spec does not list ${currentId} in blocks:`, "warning")
    }
  }

  for (const ref of blocks) {
    const target = findSpec(specs, ref)
    if (!target) {
      add("blocks-dangling", `blocks ${ref} does not resolve to a spec`)
      continue
    }
    const reverse = asListForCorpus(target.depends_on).map(specRef)
    if (!reverse.includes(currentId)) {
      add("blocks-asymmetric", `blocks ${ref}, but that spec does not list ${currentId} in depends_on:`, "warning")
    }
  }

  // --- status-specific body requirements ----------------------------------
  if (status === "implemented") {
    if (/_Filled during implementation\._/.test(body)) {
      add("implemented-placeholder", "status: implemented still carries the Results placeholder")
    }
    if (!results) {
      add("implemented-results-empty", "status: implemented requires a non-empty Results section", "warning")
    }
  }

  if (status === "ready") {
    if (acceptanceCount(body) === 0) {
      add("ready-no-ac", "status: ready requires at least one acceptance criterion")
    }
  }

  return findings
}
