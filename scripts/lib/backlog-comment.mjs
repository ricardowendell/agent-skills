// backlog-comment.mjs — append a task comment without the CLI's block parser.
//
// `backlog task edit --comment` re-serializes the whole COMMENTS block and reads
// a bare `---` line as the end of the current body: everything after it is
// dropped, including later comments (TASK-55, Backlog.md 1.55.3). `--status` and
// `--check-ac` do not touch the block, so only appending needs a workaround.
//
// This module appends by text surgery: the block is located by the marker lines,
// the new record is inserted before the closing marker, and every byte already
// in the file is preserved. It never parses the existing comments, so a body
// containing `---`, a fenced block or anything else survives unchanged.
//
// The markers are matched as whole lines, not substrings: prose is allowed to
// mention `<!-- COMMENTS:END -->` while explaining the format (TASK-55's own
// description does), and a substring search would then splice the file at the
// wrong place.

const BEGIN = "<!-- COMMENTS:BEGIN -->"
const END = "<!-- COMMENTS:END -->"
const HEADING = "## Comments"

const BEGIN_LINE = /^<!-- COMMENTS:BEGIN -->\r?$/m
const END_LINE = /^<!-- COMMENTS:END -->\r?$/m

/**
 * Find the real comment block, ignoring inline mentions of the markers.
 *
 * @param {string} content
 * @returns {{start: number, bodyStart: number, end: number} | null}
 *   `start` is the BEGIN line, `bodyStart` the first byte after it, `end` the
 *   END line. Null when there is no block.
 */
function locate(content) {
  const begin = BEGIN_LINE.exec(content)
  if (!begin) return null
  const bodyStart = begin.index + begin[0].length
  const rest = content.slice(bodyStart)
  const end = END_LINE.exec(rest)
  if (!end) throw new Error("COMMENTS:BEGIN without COMMENTS:END: the file is malformed")
  return { start: begin.index, bodyStart, end: bodyStart + end.index }
}

/**
 * Append one comment record to a task markdown file.
 *
 * The record matches the shape the CLI emits (`created:` line, `---`, body,
 * `---`) so a later human or tool still reads it as one comment.
 *
 * @param {string} content the whole task file
 * @param {string} body the comment text
 * @param {Date|string} [at] timestamp; defaults to now
 * @returns {string} the new file content
 */
export function appendComment(content, body, at = new Date()) {
  if (typeof body !== "string" || body.trim() === "") {
    throw new Error("a comment needs a non-empty body")
  }
  const normalized = body.replace(/\r\n/g, "\n").trimEnd()
  const stamp = at instanceof Date ? at.toISOString() : String(at)
  const record = `created: ${stamp}\n\n---\n\n${normalized}\n\n---\n`

  const block = locate(content)
  if (block) {
    const head = content.slice(0, block.end)
    const tail = content.slice(block.end)
    // Keep one blank line between the previous record's closing `---` and the
    // new `created:` line, which is the shape the CLI itself writes.
    const gap = head.endsWith("\n\n") ? "" : head.endsWith("\n") ? "\n" : "\n\n"
    return `${head}${gap}${record}${tail}`
  }

  if (content.includes(END) && !content.includes(BEGIN)) {
    throw new Error("COMMENTS:END without COMMENTS:BEGIN: the file is malformed")
  }

  // No block yet: add the heading and the markers, keeping one blank line after
  // whatever the file already ends with.
  const base = content.replace(/\s*$/, "\n")
  const gap = base.endsWith("\n\n") ? "" : "\n"
  return `${base}${gap}${HEADING}\n\n${BEGIN}\n${record}${END}\n`
}

/**
 * Count the comment records in a file, for verification after a write.
 *
 * A record starts with a `created:` line; the count does not depend on the
 * bodies, so a body containing `---` cannot inflate it.
 *
 * @param {string} content
 * @returns {number}
 */
export function countComments(content) {
  let block
  try {
    block = locate(content)
  } catch {
    return 0
  }
  if (!block) return 0
  const body = content.slice(block.bodyStart, block.end)
  return (body.match(/^created:/gm) || []).length
}
