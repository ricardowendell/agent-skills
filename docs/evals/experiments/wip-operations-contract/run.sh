#!/usr/bin/env bash
# Builds the two run roots for one arm of the `wip-operations-contract`
# experiment and runs a pair: generate the prompt, then implement it.
#
#   ./run.sh pair A 1 s1     # arm A, one repetition, scenario s1 (easy oracle)
#   ./run.sh pair A 3 s2     # arm A, three repetitions, scenario s2 (partial)
#   ./run.sh stage1 A 1 s1   # generation only
#   ./run.sh probe B          # AC-2 probe on the last stage-2 run of arm B
#
# Nothing here is part of the harness: it copies the frozen skill and the
# fixture into a scratch root the existing runner already understands. The
# copies live under .work/ and are never committed.
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
repo=$(cd "$here/../../../.." && pwd)
runner="$repo/scripts/run-evals.mjs"

cmd=${1:-pair}
arm=${2:-A}
rep=${3:-1}
scenario=${4:-s1}

case "$scenario" in
  s1) fixture="$here/fixture";    spec=SPEC-0014; case_n=1 ;;
  s2) fixture="$here/fixture-s2"; spec=SPEC-0015; case_n=2 ;;
  *) echo "unknown scenario: $scenario" >&2; exit 2 ;;
esac

work="$here/.work/$arm/$scenario"

build_stage1() {
  mkdir -p "$work/stage1/write-implementation-prompt/references/evals"
  cp "$here/$arm/SKILL.md" "$work/stage1/write-implementation-prompt/SKILL.md"
  cp "$here/cases/stage1-write-prompt.md" "$work/stage1/write-implementation-prompt/references/evals.md"
  rm -rf "$work/stage1/write-implementation-prompt/references/evals/$case_n"
  cp -R "$fixture" "$work/stage1/write-implementation-prompt/references/evals/$case_n"
}

build_stage2() {
  mkdir -p "$work/stage2/implement-from-prompt/references/evals"
  cp "$repo/skills/implement-from-prompt/SKILL.md" "$work/stage2/implement-from-prompt/SKILL.md"
  cp "$here/cases/stage2-implement.md" "$work/stage2/implement-from-prompt/references/evals.md"
  # Rebuilt from the pristine tree every time: nothing from a prior run survives.
  rm -rf "$work/stage2/implement-from-prompt/references/evals/$case_n"
  cp -R "$fixture" "$work/stage2/implement-from-prompt/references/evals/$case_n"
}

run_stage1() {
  node "$runner" --root "$work/stage1" --skill write-implementation-prompt \
    --case "$case_n" --repeat "${1:-1}" --run
}

run_stage2() {
  node "$runner" --root "$work/stage2" --skill implement-from-prompt \
    --case "$case_n" --repeat 1 --run
}

# Newest run of a skill, as a directory.
newest_run() {
  ls -td "$HOME/.local/share/opencode/evals/runs"/*"$1" | head -1
}

# Scratch path the runner recorded in the transcript header.
scratch_of() {
  grep -m1 '^\*\*Scratch:\*\*' "$1/cases/$(basename "$2")/transcript.md" | sed 's/^\*\*Scratch:\*\* //'
}

# Moves the prompt this arm produced into the stage-2 case directory.
harvest() {
  local out scratch file
  out=$(newest_run write-implementation-prompt)
  scratch=$(scratch_of "$out" "write-implementation-prompt--$(printf '%02d' "$case_n")")
  file=$(ls "$scratch"/docs/prompts/"$spec"-*.prompt.md 2>/dev/null | head -1)
  [ -n "$file" ] || { echo "harvest: no $spec prompt in $scratch" >&2; return 1; }
  cp "$file" "$work/stage2/implement-from-prompt/references/evals/$case_n/docs/prompts/"
  echo "harvested $(basename "$file")"
}

# AC-2 for situation s2 is not in the oracle: the rejection must name the
# physical line, so two blank lines push the bad row to line 4. A naive counter
# over data rows answers 2, and an off-by-one over non-blank lines answers 3.
# The wording is not the contract: `line 4` and `Row 4` both name it, so only
# the number and a location word are required.
probe() {
  local out dir code
  out=$(newest_run implement-from-prompt)
  dir=$(scratch_of "$out" "implement-from-prompt--$(printf '%02d' "$case_n")")
  [ -f "$dir/src/import.js" ] || { echo "probe: no src/import.js in $dir"; return 1; }
  code=$(cd "$dir" && node --input-type=module -e '
    const m = await import("./src/import.js")
    try {
      m.importRows("a,b,c\n\n\n1,2\n")
      console.log("AC2-NOTHROW")
    } catch (e) {
      console.log(/(?:line|row)\s*#?4\b/i.test(e.message) ? "AC2-PASS" : `AC2-FAIL: ${e.message}`)
    }
  ' 2>&1 | tail -1)
  echo "$code"
}

case "$cmd" in
  pair)
    build_stage1
    for i in $(seq 1 "$rep"); do
      echo "=== arm $arm / $scenario, pair $i/$rep ==="
      run_stage1 1 | tail -2
      build_stage2
      harvest
      run_stage2 | tail -2
      probe
    done
    ;;
  stage1)
    build_stage1
    run_stage1 "$rep"
    ;;
  stage2)
    build_stage2
    run_stage2
    ;;
  probe)
    probe
    ;;
  *)
    echo "usage: $0 [pair|stage1|stage2|probe] [A|B] [repetitions] [s1|s2]" >&2
    exit 2
    ;;
esac
