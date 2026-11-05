# pdlc run records

One file per verified cycle, written by `pdlc audit` after `verify`/`merge`.
Each record names the spec, the gates run, the review verdict and the merge
commit. It is the durable proof of the cycle; `.pdlc/` is transient.

Behavioural eval artefacts are not here: they live under
`~/.local/share/opencode/evals/runs/` and are cited by the published documents
in `docs/evals/`.
