<!--
Thank you for the change. This template is a checklist, not a form to delete.
Fill in the summary, then tick each box you can honestly tick. If a box does not
apply, say why on the line rather than removing it. If this pull request touches a
clinical safety claim, write "safety" at the top of the summary so a reviewer picks
it up first.

Security note: do not describe an exploitable vulnerability here. Report it privately
through the repository Security tab, using "Report a vulnerability". A clinical safety
concern is not a vulnerability, so open a normal issue for that instead.
-->

## What changed

<!-- One paragraph. What does this pull request do? -->

## Why

<!-- One paragraph. Why is the change worth making? Link the issue or the ADR if there is one. -->

## Checks

- [ ] `pnpm typecheck` passes locally.
- [ ] `pnpm lint` passes locally.
- [ ] `pnpm check` passes locally, so generated files are in sync, the IA assertions hold, and `llms.txt` is current.
- [ ] I introduced no U+2014 (em dash) and no U+2013 (en dash) anywhere, including prose, frontmatter, tables, headings, comments, JSDoc and string literals. Where a connector was reaching for one, I rewrote the sentence.

## Generated files

- [ ] I did not hand edit any generated file. I changed its source and regenerated instead.
- [ ] The regenerated output is committed, so a fresh `pnpm --filter @opsinjs/www run generate` would produce no diff.

<!--
Generated paths, for reference: lib/generated/, lib/opsinjs.ts, registry/generated/,
registry/__index__.ts, app/tokens.generated.css, content/docs/reference/generated/,
content/docs/reference/api/, public/r/, and content/docs/handbook/error-codes.mdx.
The authority for what is generated is the check:generated diff in apps/www/package.json.
-->

## Docs pages, if this pull request touches content

- [ ] Frontmatter is correct: `kind` is present on every page, and `status` is present only on a `kind: component` page.
- [ ] The page carries exactly the headings its `kind` prescribes, with none added and none dropped.
- [ ] Internal MDX links are relative. None points at an absolute `/docs/` path.
- [ ] Every claim is generated, cited, or labelled as opinion. No citation, statistic, DOI, date or study is invented.
- [ ] Nothing on the page implies a component has been built when it has not. Where the truth is a gap, I used one of the four honesty components rather than softening the prose.
- [ ] I used only the closed MDX vocabulary. I defined no new JSX tag.

## Scope

- [ ] I touched only the files this change needs. Anything wrong outside that set is noted below rather than fixed here.

<!-- Notes on anything a reviewer should know, including files that are wrong but out of scope. -->
