# Page templates as the frozen contract

One skeleton per `kind`. A page's `kind` fully determines its headings; authors
fill a template and never start from a blank file, and never invent a section.
`assert-ia.mts` compares the H2s in every page against the outline for its `kind`
and fails the build on a missing or an unexpected one.

These files live OUTSIDE `content/docs/`, so fumadocs (`dir: "content/docs"`) does
not index them and they never become routes. `handbook/contributing/documentation-templates`
publishes them verbatim.

| `kind` | Template | Used by |
| --- | --- | --- |
| `component` | `component.mdx` | every component page under `content/docs/components/` |
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

1. **Say only what is true, in either direction.** A page may not claim a
   component exists when it does not, and may not claim nothing is built when
   the catalogue says otherwise. `registry/catalogue.ts` is the authority: a row
   at `alpha` has source under `registry/bases/base/` and installs through the
   shadcn CLI, so a working example is the correct thing to show; a row at
   `considered` has no code, and a page about it says so. A measured number is
   never written by hand either way. It is generated or it is `<NoDataYet>`.
   `<NotBuiltYet>`, `<StubNotice>`, `<NoDataYet>` and `<Todo>` are the honest
   ways to say "not yet", and `<Todo>` is counted in the build's coverage report.
   Promotion sheds exactly two of them: `<NotBuiltYet>` and `<Todo>` go in the
   same commit that moves the page to `alpha`; `<StubNotice>` stays and gains a
   real `status`; `<NoDataYet>` stays wherever a generator genuinely has no
   source data.
2. **Links are relative.** Use relative file paths resolved by fumadocs'
   `createRelativeLink`. One such link reads
   `[Two colour axes](../health/two-colour-axes.mdx)`. Absolute `/docs/...`
   links are banned everywhere except the Sections rail in the root `meta.json`.
3. **The MDX vocabulary is closed.** Only the tags in the anatomy contract exist.
   Content authors use them; they never define one.
