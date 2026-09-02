# Page templates — the frozen contract

One skeleton per `kind`. A page's `kind` fully determines its headings; authors
fill a template and never start from a blank file, and never invent a section.
`assert-ia.mts` compares the H2s in every page against the outline for its `kind`
and fails the build on a missing or an unexpected one.

These files live OUTSIDE `content/docs/`, so fumadocs (`dir: "content/docs"`) does
not index them and they never become routes. `handbook/contributing/documentation-templates`
publishes them verbatim.

| `kind` | Template | Used by |
| --- | --- | --- |
| `component` | `component.mdx` | the 24 component specifications |
| `foundation` | `foundation.mdx` | Foundations, every page and sub-page |
| `health` | `health.mdx` | the Health doctrine layer |
| `accessibility` | `accessibility.mdx` | the Accessibility pillar |
| `content` | `content.mdx` | Content & language |
| `pattern` | `pattern.mdx` | Patterns, including forms and "Ask users for…" |
| `recipe` | `recipe.mdx` | Recipes |
| `screen` | `screen.mdx` | Screens |
| `handbook` | `handbook.mdx` | Handbook, including tooling and contributing |
| `reference` | `reference.mdx` | Reference, including generated pages |
| `project` | `project.mdx` | Project: roadmap, changelog, decisions, community |
| `guide` | `guide.mdx` | Start here, Installation, Registry, Theming, Agents |

`frontmatter.schema.json` is the machine-readable form of the frontmatter contract
declared in `source.config.ts`. The two must agree; `source.config.ts` is the one
the build enforces.

## Three rules that apply to every template

1. **Nothing is built.** No page may claim a component exists, show a working
   example, or state a measured number that is not generated. `<NotBuiltYet>`,
   `<StubNotice>`, `<NoDataYet>` and `<Todo>` are the only honest ways to say
   "not yet", and `<Todo>` is counted in the build's coverage report.
2. **Links are relative.** Use relative file paths resolved by fumadocs'
   `createRelativeLink` — `[Two colour axes](../health/two-colour-axes.mdx)`.
   Absolute `/docs/...` links are banned everywhere except the Sections rail in
   the root `meta.json`.
3. **The MDX vocabulary is closed.** Only the tags in the anatomy contract exist.
   Content authors use them; they never define one.
