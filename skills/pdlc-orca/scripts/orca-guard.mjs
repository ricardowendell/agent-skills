#!/usr/bin/env node
// orca-guard.mjs — fail closed when Orca does not resolve the current directory
// to the pdlc worktree of <slug>.
//
// Why this exists: with `external-worktree-visibility: hide` (the default),
// `orca worktree current` does not fail — it silently resolves the enclosing
// main worktree. An agent launched on that answer works in `main` and the pdlc
// evidence still looks plausible. This guard turns that ambiguity into an exit
// code, and its message names the setting that fixes it.
//
// Usage: node orca-guard.mjs <slug> [--cwd <dir>]
// Exit:  0 = the cwd is the pdlc worktree for <slug>; 1 = anything else.
// Stdout on success: one JSON line { ok, branch, path, worktree, identity, head }.

import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";

const args = process.argv.slice(2);
/** @type {string | null} */
let cwd = null;
/** @type {string[]} */
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--cwd") {
    cwd = args[i + 1] ?? null;
    i++;
    continue;
  }
  positional.push(args[i]);
}
const slug = positional[0];
const where = cwd ?? process.cwd();

/** @param {string} message */
function fail(message) {
  console.error(`orca-guard: ${message}`);
  process.exit(1);
}

if (!slug) fail("uso: node orca-guard.mjs <slug> [--cwd <dir>]");

/** @type {{ ok?: boolean, result?: { worktree?: { path: string, branch: string, id: string, identity?: { key?: string }, head?: string } } }} */
let resolved;
try {
  resolved = JSON.parse(execFileSync("orca", ["worktree", "current", "--json"], { cwd: where, encoding: "utf8" }));
} catch (error) {
  const err = /** @type {Error & { stderr?: Buffer | string }} */ (error);
  const detail = String(err.stderr ?? "").trim() || err.message;
  fail(
    `não consegui ler 'orca worktree current' em ${where}: ${detail}\n` +
      "  Orca só resolve worktree dentro da raiz do repo registrado: um trees_dir fora dela falha aqui.",
  );
}

const worktree = resolved?.ok ? resolved.result?.worktree : undefined;
if (!worktree) {
  fail(`orca não resolveu um worktree para ${where}: ${JSON.stringify(resolved)}`);
}

let here;
let there;
try {
  here = realpathSync(where);
  there = realpathSync(worktree.path);
} catch {
  fail(`o worktree de ${slug} não existe mais (caminho: ${worktree.path}) — a run terminou?`);
}

if (there !== here) {
  fail(
    `orca resolveu ${there}, não ${here}.\n` +
      "  O mais provável é external-worktree-visibility=hide: o comando resolve o worktree principal.\n" +
      "  Corrija com: orca repo set --repo path:<repo> --external-worktree-visibility show",
  );
}

const expectedBranch = `refs/heads/pdlc/${slug}`;
if (worktree.branch !== expectedBranch) {
  fail(
    `orca resolveu o branch ${worktree.branch}, esperado ${expectedBranch}.\n` +
      "  Ou o slug está errado, ou o worktree não é o desta spec.",
  );
}

console.log(
  JSON.stringify({
    ok: true,
    branch: worktree.branch,
    path: worktree.path,
    worktree: worktree.id,
    identity: worktree.identity?.key ?? null,
    head: worktree.head ?? null,
  }),
);
