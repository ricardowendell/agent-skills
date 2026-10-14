#!/usr/bin/env python3
import argparse
from datetime import datetime
from pathlib import Path
import re
import unicodedata


def find_inbox(workspace: Path) -> Path:
    docs_inbox = workspace / "docs" / "inbox"
    if docs_inbox.exists() or (workspace / "docs").exists():
        return docs_inbox
    return workspace / "inbox"


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    words = re.findall(r"[a-zA-Z0-9]+", ascii_value.lower())
    return "-".join(words[:8]) or "raw-idea"


def mark_unprocessed(content: str) -> str:
    body = content.lstrip()
    if not body.startswith("---"):
        return "---\nstatus: unprocessed\nprocessed_at:\n---\n\n" + content.lstrip()

    parts = body.split("---", 2)
    if len(parts) < 3:
        return "---\nstatus: unprocessed\nprocessed_at:\n---\n\n" + content.lstrip()

    _, frontmatter, rest = parts
    lines = frontmatter.strip("\n").splitlines()
    seen_status = False
    seen_processed_at = False
    updated = []
    for line in lines:
        if line.startswith("status:"):
            updated.append("status: unprocessed")
            seen_status = True
        elif line.startswith("processed_at:"):
            updated.append("processed_at:")
            seen_processed_at = True
        else:
            updated.append(line)
    if not seen_status:
        updated.insert(0, "status: unprocessed")
    if not seen_processed_at:
        updated.append("processed_at:")
    return "---\n" + "\n".join(updated) + "\n---" + rest


def main() -> int:
    parser = argparse.ArgumentParser(description="Append a raw idea to a dated inbox note.")
    parser.add_argument("--workspace", required=True, help="Workspace root.")
    parser.add_argument("--text", required=True, help="Raw idea text to append.")
    parser.add_argument("--title", help="Short descriptive title for the filename.")
    parser.add_argument("--datetime", help="Optional ISO-like datetime for testing.")
    args = parser.parse_args()

    workspace = Path(args.workspace).expanduser().resolve()
    now = datetime.fromisoformat(args.datetime) if args.datetime else datetime.now().astimezone()
    inbox = find_inbox(workspace)
    inbox.mkdir(parents=True, exist_ok=True)

    text = args.text.strip()
    if not text:
        raise SystemExit("No idea text provided.")
    title = args.title.strip() if args.title else text
    note_path = inbox / f"{now:%Y-%m-%d}-{slugify(title)}.md"

    entry = f"## {now:%H:%M}\n\n{text}\n\n"
    existing = note_path.read_text(encoding="utf-8") if note_path.exists() else ""
    existing = mark_unprocessed(existing)
    if existing.strip() and not existing.endswith("\n\n"):
        entry = "\n" + entry

    note_path.write_text(existing + entry, encoding="utf-8")

    print(note_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
