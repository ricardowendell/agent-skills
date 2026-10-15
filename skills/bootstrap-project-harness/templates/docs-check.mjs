import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SPEC_DIR = path.join(ROOT, "docs", "specs");
const PROMPT_DIR = path.join(ROOT, "docs", "prompts", "implementation");

const KNOWN_STATUSES = new Set([
  "draft",
  "ready",
  "in_progress",
  "implemented",
  "paused",
  "rejected",
]);

const findings = [];
let exitCode = 0;

function add(level, message) {
  findings.push({ level, message });
}

function relative(filePath) {
  return path.relative(ROOT, filePath);
}

function readMarkdownFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return readMarkdownFiles(fullPath);
      if (entry.isFile() && entry.name.endsWith(".md")) return [fullPath];
      return [];
    })
    .sort();
}

function parseFrontmatter(filePath) {
  const content = readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (!content.startsWith("---\n")) return null;

  const endIndex = content.indexOf("\n---", 4);
  if (endIndex === -1) return null;

  const raw = content.slice(4, endIndex).trimEnd();
  const body = content.slice(endIndex + 4);
  const data = {};
  let currentArrayKey = null;

  for (const line of raw.split("\n")) {
    const arrayItem = line.match(/^\s+-\s+(.+)$/);
    if (arrayItem && currentArrayKey) {
      const cv = data[currentArrayKey];
      if (Array.isArray(cv)) {
        cv.push(arrayItem[1].replace(/^["']|["']$/g, ""));
      }
      continue;
    }
    const keyValue = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!keyValue) {
      currentArrayKey = null;
      continue;
    }
    const key = keyValue[1];
    const value = keyValue[2];
    if (value === "") {
      data[key] = [];
      currentArrayKey = key;
      continue;
    }
    data[key] = value.replace(/^["']|["']$/g, "");
    currentArrayKey = null;
  }
  return { body, data };
}

// Normalize a frontmatter value to a list. `key: []` parses to the string "[]",
// a populated `key:` list parses to an array, and a scalar parses to a string.
function asList(value) {
  if (Array.isArray(value)) return value;
  if (!value || value === "[]") return [];
  return [value];
}

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function sectionBody(body, heading) {
  const start = body.indexOf(heading);
  if (start === -1) return null;
  const rest = body.slice(start + heading.length);
  const next = rest.search(/\n## /);
  return next === -1 ? rest : rest.slice(0, next);
}

// Check spec files exist
const specFiles = readMarkdownFiles(SPEC_DIR).filter((fp) =>
  /^SPEC-\d{4}-.+\.md$/.test(path.basename(fp)),
);
const promptFiles = readMarkdownFiles(PROMPT_DIR).filter((fp) =>
  /^SPEC-\d{4}-.+\.prompt\.md$/.test(path.basename(fp)),
);

const specById = new Map();
for (const fp of specFiles) {
  const parsed = parseFrontmatter(fp);
  if (parsed?.data?.id) specById.set(parsed.data.id, fp);
}

for (const fp of specFiles) {
  const parsed = parseFrontmatter(fp);
  if (!parsed) {
    add("error", `${relative(fp)} missing frontmatter`);
    continue;
  }
  const { id, status } = parsed.data;
  if (!id) add("error", `${relative(fp)} missing id in frontmatter`);
  if (!status) {
    add("warning", `${relative(fp)} missing status`);
  } else if (!KNOWN_STATUSES.has(status)) {
    add("warning", `${relative(fp)} has unknown status "${status}"`);
  }

  // A ready spec must not carry open questions.
  if (status === "ready") {
    const body = sectionBody(parsed.body, "## Open Questions");
    const hasQuestions =
      body !== null &&
      body.split("\n").some((line) => /^\s*[-*]\s+\S/.test(line));
    if (hasQuestions) {
      add("warning", `${relative(fp)} is "ready" but still has open questions`);
    }
  }

  // An implemented spec must name the tests that verify it.
  if (status === "implemented") {
    const tests = asList(parsed.data.tests);
    if (tests.length === 0) {
      add("warning", `${relative(fp)} is "implemented" but lists no tests`);
    } else {
      for (const testPath of tests) {
        if (!existsSync(path.join(ROOT, testPath))) {
          add("warning", `${relative(fp)} names a missing test: ${testPath}`);
        }
      }
    }
  }
}

for (const fp of promptFiles) {
  const specId = path.basename(fp).match(/^(SPEC-\d{4})-/)?.[1];
  const specFile = specId ? specById.get(specId) : undefined;
  if (!specId || !specFile) {
    add("error", `${relative(fp)} does not map to an existing spec`);
  } else {
    const recorded = parseFrontmatter(fp)?.data?.spec_sha;
    if (recorded && recorded !== sha256(specFile)) {
      add(
        "warning",
        `${relative(fp)} is stale — its spec changed since the prompt was written`,
      );
    }
  }
  const content = readFileSync(fp, "utf8");
  if (!content.includes("## Verification")) {
    add("warning", `${relative(fp)} has no Verification section`);
  }
}

if (findings.length === 0) {
  console.log("docs-check passed.");
} else {
  for (const f of findings) {
    console.error(`${f.level}: ${f.message}`);
    if (f.level === "error") exitCode = 1;
  }
  console.log(
    `docs-check: ${findings.filter((f) => f.level === "error").length} errors, ${findings.filter((f) => f.level === "warning").length} warnings.`,
  );
}
process.exit(exitCode);
