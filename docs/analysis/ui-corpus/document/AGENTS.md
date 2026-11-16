# document — the CSS token system

## Task contract

- The surface is `index.html` and `styles.css`. The token system lives in the
  `:root` block of `styles.css`; the page is the only consumer of it.
- There is **no `DESIGN.md`** in this tree. Writing one is the task:
  `DESIGN.md` at the tree root, documenting the system that already exists.
- **Read-only elsewhere.** Do not edit `index.html` or `styles.css`; the
  deliverable is the document. A token the CSS does not have is not documented as
  if it did.
- No network, no build step, no external design source. The CSS is the whole
  evidence.

## Human review (declared, not machine-checked)

A deterministic visual oracle is frozen (`SPEC-0077`). The assertions prove the
file exists, carries two of the real token names, and that the CSS is untouched;
the reviewer reads `DESIGN.md` and answers:

1. Are the documented tokens the ones the CSS actually defines, with their
   values, rather than a wishlist?
2. Can a component author use it — colour roles, type ramp, spacing scale — or is
   it a copy of the `:root` block in prose?
3. Does it record how the tokens are meant to be combined (surface vs ink, what
   carries emphasis), not just the list?
4. Does it name what is missing (motion, dark theme, breakpoints) instead of
   inventing it?
5. Does the document stay true to the two files it claims to describe?
