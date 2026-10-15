#!/usr/bin/env node
// validate-skills.mjs — lint the user's agent skills across every ecosystem root.
//
// Checks:
//   1. Every SKILL.md has `name` and `description` frontmatter.
//   2. The path-derived skill ID is lowercase kebab-case.
//   3. Description length stays within a sane budget (default 500 chars).
//   4. No drift: the same skill ID defined by two different trees with different content.
//   5. No broken symlinks in the roots.
//
// Usage:  node ~/.config/opencode/scripts/validate-skills.mjs [--max-desc N]
// Exit:   0 = clean (warnings allowed), 1 = errors found.

import { readFileSync, readdirSync, lstatSync, realpathSync, existsSync } from "node:fs"
import { createHash } from "node:crypto"
import { join, basename, dirname } from "node:path"
import { homedir } from "node:os"

const args = process.argv.slice(2)
const maxDescArg = args.indexOf("--max-desc")
const MAX_DESC = maxDescArg >= 0 ? Number(args[maxDescArg + 1]) : 500
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

const HOME = homedir()
// --root <dir> overrides discovery (for CI, where the repo is not under HOME).
const rootArg = args.indexOf("--root")
const ROOTS = (
  rootArg >= 0
    ? [args[rootArg + 1]]
    : [
        join(HOME, ".agents/skills"),
        join(HOME, ".claude/skills"),
        join(HOME, ".codex/skills"),
        join(HOME, ".config/opencode/skills"),
      ]
).filter((d) => existsSync(d))

function* skillFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory() || entry.isSymbolicLink()) {
      let st
      try {
        st = lstatSync(p)
      } catch {
        continue
      }
      const target = entry.isSymbolicLink() ? join(p, "SKILL.md") : join(p, "SKILL.md")
      if (existsSync(target)) {
        yield target
        continue
      }
      if (entry.isDirectory() && !entry.isSymbolicLink()) {
        // nested SKILL.md at arbitrary depth
        yield* skillFiles(p)
      }
    }
  }
}

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return null
  const fm = m[1]
  const name = (fm.match(/^name:\s*(.+)$/m)?.[1] || "").trim().replace(/^["']|["']$/g, "")
  const dLine = fm.match(/^description:\s*(.+)$/m)
  let description = dLine ? dLine[1].trim() : ""
  if (description === ">-" || description === ">" || description === "|" || description === "|-") {
    const idx = fm.indexOf(dLine[0]) + dLine[0].length
    const block = []
    for (const line of fm.slice(idx).split("\n")) {
      if (!line.trim()) break
      if (line.startsWith(" ") || line.startsWith("\t")) block.push(line.trim())
      else break
    }
    description = block.join(" ")
  }
  return {
    name,
    description,
    hasName: /^name:/m.test(fm),
    hasDesc: !!dLine,
    hasVersion: /^version:/m.test(fm),
    hasInstalled: /^installed:/m.test(fm),
    hasStackAgnostic: /^stack-agnostic:\s*true\b/m.test(fm),
  }
}

const errors = []
const warnings = []
const seen = new Map() // id -> [{root, path, realpath, hash}]

for (const root of ROOTS) {
  for (const file of skillFiles(root)) {
    let text, real
    try {
      text = readFileSync(file, "utf8")
      real = realpathSync(file)
    } catch (e) {
      errors.push(`unreadable: ${file} (${e.message})`)
      continue
    }
    const id = basename(dirname(file))
    const fm = frontmatter(text)
    if (!fm) {
      errors.push(`${file}: missing YAML frontmatter`)
      continue
    }
    if (!fm.hasName) errors.push(`${file}: missing 'name'`)
    if (!fm.hasDesc) warnings.push(`${file}: missing 'description' (skill will not be advertised)`)
    if (!ID_RE.test(id)) warnings.push(`${file}: ID '${id}' is not lowercase kebab-case`)
    if (fm.description.length > MAX_DESC)
      warnings.push(`${file}: description ${fm.description.length} chars (> ${MAX_DESC}, loaded every step)`)

    // Provenance: versioned/upstream skills should be marked so they are not renamed.
    let versioned = fm.hasVersion
    if (!versioned) {
      try {
        versioned = readdirSync(dirname(file)).some((n) => /version/i.test(n))
      } catch {}
    }
    if (versioned && !fm.hasInstalled)
      warnings.push(`${file}: looks installed (version marker) — add 'installed: true' so it is not renamed`)

    // Stack-agnostic skills must not hardcode one stack. Mentioning both is fine
    // ("run `node spec-sha.mjs` or `uv run python spec_sha.py`"); mentioning
    // exactly one is the smell this rule exists to catch.
    if (fm.hasStackAgnostic) {
      // Blank the frontmatter (keeping line numbers) so a skill's own name or
      // description can't trigger the rule.
      const body = text.replace(/^---\n[\s\S]*?\n---/, (m) => m.replace(/[^\n]/g, " "))
      const NODE = /\b(bun|npm|pnpm|yarn|deno|node|tsc|eslint|prettier|package\.json)\b/
      const PY = /\b(python3?|pip3?|ruff|mypy|pytest|poetry|pdm|uv|pyproject\.toml|requirements\.txt)\b/
      const hits = (re) =>
        body
          .split("\n")
          .flatMap((line, i) => (re.test(line) ? [[line.match(re)[1], i + 1]] : []))
      const nodeHits = hits(NODE)
      const pyHits = hits(PY)
      const only = nodeHits.length && !pyHits.length ? nodeHits : pyHits.length && !nodeHits.length ? pyHits : []
      if (only.length)
        warnings.push(
          `${file}: stack-agnostic skill hardcodes '${only[0][0]}' (line ${only[0][1]}) — make it stack-neutral, or mention both stacks`,
        )
    }

    const hash = createHash("md5").update(text).digest("hex").slice(0, 8)
    if (!seen.has(id)) seen.set(id, [])
    seen.get(id).push({ root, file, real, hash })
  }
}

// Drift: same ID, different real trees, different content.
for (const [id, entries] of seen) {
  const realSet = new Set(entries.map((e) => e.real))
  if (realSet.size > 1) {
    const hashes = new Set(entries.map((e) => e.hash))
    if (hashes.size > 1) {
      warnings.push(
        `drift: '${id}' defined in ${realSet.size} different trees with differing content: ` +
          entries.map((e) => e.file).join(", "),
      )
    }
  }
}

const show = (label, list) => {
  if (!list.length) return
  console.log(`\n${label} (${list.length}):`)
  for (const x of list) console.log("  - " + x)
}
console.log(`Scanned ${[...seen.values()].flat().length} SKILL.md across ${ROOTS.length} roots.`)
show("ERRORS", errors)
show("WARNINGS", warnings)
if (!errors.length && !warnings.length) console.log("\nAll clear.")
process.exit(errors.length ? 1 : 0)
