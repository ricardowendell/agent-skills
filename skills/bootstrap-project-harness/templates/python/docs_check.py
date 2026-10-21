#!/usr/bin/env python3
"""Spec and prompt consistency check.

Python port of `docs-check.mjs`. Behavior is specified in the skill's
`references/docs-check.md`; a parity check enforces that both implementations
agree. Standard library only — no project dependencies.
"""

from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path

ROOT = Path.cwd()
SPEC_DIR = ROOT / "docs" / "specs"
PROMPT_DIR = ROOT / "docs" / "prompts"

KNOWN_STATUSES = {"draft", "ready", "in_progress", "implemented", "paused", "rejected"}

SPEC_NAME = re.compile(r"^SPEC-\d{4}-.+\.md$")
PROMPT_NAME = re.compile(r"^SPEC-\d{4}-.+\.prompt\.md$")
PROMPT_SPEC_ID = re.compile(r"^(SPEC-\d{4})-")

findings: list[tuple[str, str]] = []


def add(level: str, message: str) -> None:
    findings.append((level, message))


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def read_markdown_files(directory: Path) -> list[Path]:
    if not directory.exists():
        return []
    return sorted(
        entry
        for entry in directory.rglob("*")
        if entry.is_file() and entry.name.endswith(".md")
    )


def parse_frontmatter(path: Path):
    content = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    if not content.startswith("---\n"):
        return None

    end = content.find("\n---", 4)
    if end == -1:
        return None

    raw = content[4:end].rstrip()
    body = content[end + 4 :]
    data: dict[str, object] = {}
    current_key: str | None = None

    for line in raw.split("\n"):
        item = re.match(r"^\s+-\s+(.+)$", line)
        if item and current_key:
            if isinstance(data.get(current_key), list):
                data[current_key].append(item.group(1).strip("\"'"))  # type: ignore[union-attr]
            continue
        kv = re.match(r"^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$", line)
        if not kv:
            current_key = None
            continue
        key, value = kv.group(1), kv.group(2)
        if value == "":
            data[key] = []
            current_key = key
            continue
        data[key] = value.strip("\"'")
        current_key = None

    return body, data


def as_list(value: object) -> list[str]:
    if isinstance(value, list):
        return list(value)
    if not value or value == "[]":
        return []
    return [str(value)]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def section_body(body: str, heading: str) -> str | None:
    start = body.find(heading)
    if start == -1:
        return None
    rest = body[start + len(heading) :]
    nxt = re.search(r"\n## ", rest)
    return rest if nxt is None else rest[: nxt.start()]


spec_files = [p for p in read_markdown_files(SPEC_DIR) if SPEC_NAME.match(p.name)]
prompt_files = [p for p in read_markdown_files(PROMPT_DIR) if PROMPT_NAME.match(p.name)]

spec_by_id: dict[str, Path] = {}
for path in spec_files:
    parsed = parse_frontmatter(path)
    if parsed and parsed[1].get("id"):
        spec_by_id[str(parsed[1]["id"])] = path

for path in spec_files:
    parsed = parse_frontmatter(path)
    if not parsed:
        add("error", f"{rel(path)} missing frontmatter")
        continue
    body, data = parsed
    spec_id = data.get("id")
    status = data.get("status")

    if not spec_id:
        add("error", f"{rel(path)} missing id in frontmatter")
    if not status:
        add("warning", f"{rel(path)} missing status")
    elif status not in KNOWN_STATUSES:
        add("warning", f'{rel(path)} has unknown status "{status}"')

    if status == "ready":
        questions = section_body(body, "## Open Questions")
        has_questions = questions is not None and any(
            re.match(r"^\s*[-*]\s+\S", line) for line in questions.split("\n")
        )
        if has_questions:
            add("warning", f'{rel(path)} is "ready" but still has open questions')

    if status == "implemented":
        tests = as_list(data.get("tests"))
        if not tests:
            add("warning", f'{rel(path)} is "implemented" but lists no tests')
        else:
            for test_path in tests:
                if not (ROOT / test_path).exists():
                    add("warning", f"{rel(path)} names a missing test: {test_path}")

for path in prompt_files:
    match = PROMPT_SPEC_ID.match(path.name)
    spec_file = spec_by_id.get(match.group(1)) if match else None
    if not spec_file:
        add("error", f"{rel(path)} does not map to an existing spec")
    else:
        parsed = parse_frontmatter(path)
        recorded = parsed[1].get("spec_sha") if parsed else None
        if recorded and recorded != sha256(spec_file):
            add(
                "warning",
                f"{rel(path)} is stale — its spec changed since the prompt was written",
            )

    if "## Verification" not in path.read_text(encoding="utf-8"):
        add("warning", f"{rel(path)} has no Verification section")

if not findings:
    print("docs-check passed.")
    sys.exit(0)

for level, message in findings:
    print(f"{level}: {message}", file=sys.stderr)
errors = sum(1 for level, _ in findings if level == "error")
warnings = sum(1 for level, _ in findings if level == "warning")
print(f"docs-check: {errors} errors, {warnings} warnings.")
sys.exit(1 if errors else 0)
