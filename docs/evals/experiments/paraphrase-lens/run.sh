#!/usr/bin/env bash
# Run one arm of the paraphrase-lens pilot.
#
#   ./run.sh baseline 1
#   ./run.sh candidate 4
#
# The reviewer is an agent, not a skill, so this does not use run-evals.mjs. Each
# run gets a throwaway HOME with the arm's agent file and none of the real
# agents, plus a scratch tree containing only the case's repo.
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
arm=${1:?usage: run.sh <baseline|candidate> <case>}
case_n=${2:?usage: run.sh <baseline|candidate> <case>}
out=${3:-$here/out}

agent="$here/$arm/spec-reviewer.md"
case_dir="$here/corpus/$case_n"
[ -f "$agent" ] || { echo "no agent for arm '$arm' at $agent" >&2; exit 2; }
[ -d "$case_dir/repo" ] || { echo "no corpus case '$case_n'" >&2; exit 2; }

scratch=$(mktemp -d "${TMPDIR:-/tmp}/paraphrase-$arm-$case_n-XXXXXX")
home=$(mktemp -d "${TMPDIR:-/tmp}/paraphrase-home-$arm-$case_n-XXXXXX")
cleanup() { rm -rf "$scratch" "$home"; }
trap cleanup EXIT

cp -R "$case_dir/repo/." "$scratch/"

real_home=${HOME}
mkdir -p "$home/.config/opencode/agents"
for entry in .local .secrets .bun .gitconfig .npm; do
  [ -e "$real_home/$entry" ] && ln -s "$real_home/$entry" "$home/$entry"
done
if [ -d "$real_home/.config/opencode" ]; then
  for entry in "$real_home/.config/opencode"/*; do
    name=$(basename "$entry")
    [ "$name" = "agents" ] && continue
    ln -s "$entry" "$home/.config/opencode/$name"
  done
fi
cp "$agent" "$home/.config/opencode/agents/spec-reviewer.md"

spec=$(ls "$scratch/docs/specs" | head -1)
mkdir -p "$out"
(
  cd "$scratch"
  HOME="$home" XDG_CONFIG_HOME="$home/.config" PWD="$scratch" OLDPWD="$scratch" \
    opencode run --format json --auto --agent spec-reviewer --standalone \
    "Review docs/specs/$spec. Report your findings."
) > "$out/$arm-$case_n.jsonl" 2> "$out/$arm-$case_n.err"

echo "wrote $out/$arm-$case_n.jsonl"
