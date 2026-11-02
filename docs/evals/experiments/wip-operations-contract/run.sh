#!/usr/bin/env bash
# Builds the two run roots for one arm of the `wip-operations-contract`
# experiment and runs a pair: generate the prompt, then implement it.
#
#   ./run.sh pair A 1        # arm A (baseline), one repetition
#   ./run.sh stage1 A 3      # generation only
#   ./run.sh stage2 A        # implementation of whatever is in .work/<arm>
#
# Nothing here is part of the harness: it copies the frozen skill and the
# fixture into a scratch root the existing runner already understands. The
# copies live under .work/ and are never committed.
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
repo=$(cd "$here/../../../.." && pwd)
runner="$repo/scripts/run-evals.mjs"
arm=${2:-A}
rep=${3:-1}

arm_skill() {
  local dir="$here/.work/$arm"
  if [ "$1" = "stage1" ]; then
    mkdir -p "$dir/stage1/write-implementation-prompt/references/evals"
    cp "$here/$arm/SKILL.md" "$dir/stage1/write-implementation-prompt/SKILL.md"
    cp "$here/cases/stage1-write-prompt.md" "$dir/stage1/write-implementation-prompt/references/evals.md"
    rm -rf "$dir/stage1/write-implementation-prompt/references/evals/1"
    cp -R "$here/fixture" "$dir/stage1/write-implementation-prompt/references/evals/1"
  else
    mkdir -p "$dir/stage2/implement-from-prompt/references/evals"
    cp "$here/../../../../skills/implement-from-prompt/SKILL.md" "$dir/stage2/implement-from-prompt/SKILL.md"
    cp "$here/cases/stage2-implement.md" "$dir/stage2/implement-from-prompt/references/evals.md"
    # The fixture for stage 2 is rebuilt every time: it must be the pristine tree
    # plus the prompt this arm generated, and nothing left over from a prior run.
    rm -rf "$dir/stage2/implement-from-prompt/references/evals/1"
    cp -R "$here/fixture" "$dir/stage2/implement-from-prompt/references/evals/1"
  fi
}

run_stage1() {
  arm_skill stage1
  local root="$here/.work/$arm/stage1"
  node "$runner" --root "$root" --skill write-implementation-prompt --case 1 --repeat "${1:-1}" --run
}

# Takes the newest prompt the stage-1 arm produced and puts it where stage 2
# looks for it. The scratch path is in the transcript header, which is the
# runner's own record of where the run happened.
harvest() {
  local out
  out=$(ls -td "$HOME/.local/share/opencode/evals/runs"/*write-implementation-prompt | head -1)
  local scratch
  scratch=$(grep -m1 '^\*\*Scratch:\*\*' "$out"/cases/write-implementation-prompt--01/transcript.md | sed 's/^\*\*Scratch:\*\* //')
  local file
  file=$(ls "$scratch"/docs/prompts/SPEC-0014-*.prompt.md 2>/dev/null | head -1)
  [ -n "$file" ] || { echo "no prompt produced in $scratch" >&2; return 1; }
  mkdir -p "$here/.work/$arm/stage2/implement-from-prompt/references/evals/1/docs/prompts"
  cp "$file" "$here/.work/$arm/stage2/implement-from-prompt/references/evals/1/docs/prompts/"
  echo "harvested $(basename "$file")"
}

run_stage2() {
  local root="$here/.work/$arm/stage2"
  node "$runner" --root "$root" --skill implement-from-prompt --case 1 --repeat 1 --run
}

# Pristine tree first, then the prompt this arm just produced: rebuilding after
# the harvest would put the fixture back and drop the artifact under test.
prepare_stage2() {
  arm_skill stage2
  harvest
}

case "${1:-pair}" in
  setup)
    mkdir -p "$here/.work/$arm"
    arm_skill stage1
    mkdir -p "$here/.work/$arm/stage2/implement-from-prompt/references/evals/1"
    echo "built $here/.work/$arm"
    ;;
  stage1)
    run_stage1 "$rep"
    ;;
  stage2)
    arm_skill stage2
    run_stage2
    ;;
  pair)
    for i in $(seq 1 "$rep"); do
      echo "=== arm $arm, pair $i/$rep ==="
      run_stage1 1 | tail -2
      prepare_stage2
      run_stage2 | tail -3
    done
    ;;
  *)
    echo "usage: $0 [setup|stage1|stage2|pair] [A|B] [repetitions]" >&2
    exit 2
    ;;
esac
