import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SPEC_DIR = path.join(ROOT, "docs", "specs");
const PROMPT_DIR = path.join(ROOT, "docs", "prompts", "implementation");

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
    if (!keyValue) { currentArrayKey = null; continue; }
    const key = keyValue[1];
    const value = keyValue[2];
    if (value === "") { data[key] = []; currentArrayKey = key; continue; }
    data[key] = value.replace(/^["']|["']$/g, "");
    currentArrayKey = null;
  }
  return { body, data };
}

// Check spec files exist
const specFiles = readMarkdownFiles(SPEC_DIR).filter((fp) =>
  /^SPEC-\d{4}-.+\.md$/.test(path.basename(fp))
);
const promptFiles = readMarkdownFiles(PROMPT_DIR).filter((fp) =>
  /^SPEC-\d{4}-.+\.prompt\.md$/.test(path.basename(fp))
);

const specIds = new Set(specFiles.map((fp) => {
  const parsed = parseFrontmatter(fp);
  return parsed?.data?.id;
}).filter(Boolean));

for (const fp of specFiles) {
  const parsed = parseFrontmatter(fp);
  if (!parsed) {
    add("error", `${relative(fp)} missing frontmatter`);
    continue;
  }
  const id = parsed.data.id;
  const status = parsed.data.status;
  if (!id) add("error", `${relative(fp)} missing id in frontmatter`);
  if (!status) add("warning", `${relative(fp)} missing status`);
}

for (const fp of promptFiles) {
  const specId = path.basename(fp).match(/^(SPEC-\d{4})-/)?.[1];
  if (!specId || !specIds.has(specId)) {
    add("error", `${relative(fp)} does not map to an existing spec`);
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
  console.log(`docs-check: ${findings.filter(f => f.level === "error").length} errors, ${findings.filter(f => f.level === "warning").length} warnings.`);
}
process.exit(exitCode);
