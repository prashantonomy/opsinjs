# Page templates

Two skeletons. `component.mdx` is the fixed outline every component page
follows, and `assert-ia.mts` checks it against `lib/status.ts` (OUT012), so the
two cannot drift. `page.mdx` is the shape of every other page: guides,
foundations, health pages, patterns and reference pages name their own
headings, the way a clawscale or Blueprint page does. ADR 0026 is the record.

These files live outside `content/docs/`, so fumadocs never indexes them.

| `kind` | Template | Section |
| --- | --- | --- |
| `component` | `component.mdx` | Components |
| `guide` | `page.mdx` | the top-level pages, and the Components overview |
| `foundation` | `page.mdx` | Foundations |
| `health` | `page.mdx` | Health |
| `pattern` | `page.mdx` | Patterns |
| `reference` | `page.mdx` | Reference |

`frontmatter.schema.json` is the machine-readable form of the frontmatter
contract in `source.config.ts`. The two must agree; `source.config.ts` is the
one the build enforces.

## Rules for every page

1. **Say only what is true.** A shipped component installs and renders, and
   that is all `shipped` means: no component has had an independent
   accessibility review or a clinical review. A number is generated or it is
   `<NoDataYet>`, never typed by hand.
2. **Links are relative file links**, such as
   `[Two colour axes](../health/two-colour-axes.mdx)`. An absolute link is for
   a route outside the documentation, such as `/playground`.
3. **The MDX vocabulary is closed.** Only the tags registered in
   `components/mdx.tsx` exist.
4. **Lean.** LEAN001 caps a component page at 1,000 words (1,250 on a health-
   category) and LEAN002 caps every other hand-written page at 1,200 (1,500 on
   a health page).
