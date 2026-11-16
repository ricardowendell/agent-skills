# audit — the payout form

## Task contract

- The form is `form.html`; the styles are `styles.css`. That is the whole
  surface.
- **Read-only.** Do not edit, create or delete a file in this tree. The
  deliverable is the audit in the reply, not a diff.
- Audit the markup and the CSS as written. There is no browser session, no
  screenshot, no computed-style dump and no network: every finding has to be
  readable in the two files, cited by selector or line.
- Do not invent users, ticket numbers or WCAG conformance claims the files do
  not support.

## Human review (declared, not machine-checked)

A deterministic visual oracle is frozen (`SPEC-0077`), so the visual half is
read by a person. The reviewer reads the transcript and answers:

1. Does the audit name the unlabelled fields, one by one, instead of "add
   labels" in general?
2. Does it treat the helper text as a contrast finding with a number or a named
   threshold, rather than calling it "a bit light"?
3. Are accessibility facts separated from cosmetic preferences?
4. Is each fix concrete (a `<label for>`, an `aria-describedby`, a darker
   token) and scoped to the file that carries the defect?
5. Does it leave the files untouched — and say so?
