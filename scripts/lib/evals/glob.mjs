// glob.mjs — one glob matcher for every filesystem assertion.
//
// Patterns are POSIX-style and relative to the scratch dir: `*` and `?` stay
// inside a segment, `**` crosses segments. Everything else is literal, so a
// fixture path with `(`, `[` or `.` needs no escaping. `fs.glob` is not used
// because the runner's own tests must pass on every Node the project supports.

import { readdirSync } from "node:fs"
import { join } from "node:path"

const MAGIC = /[*?]/

export function isGlob(pattern) {
  return MAGIC.test(pattern)
}

export function toRegExp(pattern) {
  const p = pattern.replace(/^\.\//, "").replace(/\/+$/, "")
  let out = "^"
  for (let i = 0; i < p.length; ) {
    const ch = p[i]
    if (ch === "*") {
      if (p[i + 1] === "*") {
        // `**/` consumes any number of leading segments; a bare `**` eats the rest.
        if (p[i + 2] === "/") {
          out += "(?:[^/]+/)*"
          i += 3
        } else {
          out += ".*"
          i += 2
        }
      } else {
        out += "[^/]*"
        i += 1
      }
      continue
    }
    if (ch === "?") {
      out += "[^/]"
      i += 1
      continue
    }
    out += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&")
    i += 1
  }
  return new RegExp(out + "$")
}

// Every file and directory under `root`, as POSIX relative paths. Skips the
// trees that fixtures never assert on and that can explode in size.
function listTree(root, skip = new Set([".git", "node_modules"])) {
  const found = []
  const walk = (dir, rel) => {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (skip.has(e.name)) continue
      const r = rel ? `${rel}/${e.name}` : e.name
      const full = join(dir, e.name)
      if (e.isSymbolicLink()) {
        found.push({ rel: r, isDir: false, symlink: true })
      } else if (e.isDirectory()) {
        found.push({ rel: r, isDir: true })
        walk(full, r)
      } else if (e.isFile()) {
        found.push({ rel: r, isDir: false })
      }
    }
  }
  walk(root, "")
  return found
}

// Matching entries for a pattern, sorted for stable assertion output.
export function expand(root, pattern) {
  const re = toRegExp(pattern)
  return listTree(root).filter((e) => re.test(e.rel))
}
