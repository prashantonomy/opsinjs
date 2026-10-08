# ADR 0026. The documentation site takes the clawscale shape

Four hundred pages become about a hundred and fifteen in six sections, every page names its own headings except a component page, and the sidebar is the whole navigation.

## Status

**Accepted.** 2026-10-08. Supersedes the outline of [ADR 0024](./0024-the-component-page-is-lean.md); the word budget it set stands. The structure is held by `lib/status.ts` (the component outline), `lib/docs-nav.ts` and `components/docs/sidebar.tsx` (the navigation), and `assert-ia` rules LEAN001 and LEAN002 (the budgets).

## Context

On the day this was written the site carried 401 pages and 477,000 words in sixteen folders, which a sidebar transform folded into ten pillars three levels deep, with a breadcrumb and a right-hand table of contents on every page. Every kind of page except a guide had an exact outline: a foundation page owed six fixed sections, a health page seven, a pattern page seven. Each fixed heading read as a demand, so every page filled every heading, and the average page ran to about 1,190 words.

The owner asked for the site to be simplified and reshaped like the clawscale documentation, which mirrors blueprintjs.com: about a hundred pages and 27,000 words, a sidebar of packages that expand one at a time, the current page's headings listed under its row, and pages that are a sentence or two and a few sections of facts.

## Decision

- **Six sections.** opsinjs (the introduction and the guides at the root), Foundations, Components, Health, Patterns and Reference. Each is one folder with no nested folders, apart from the generated reference pages.
- **Merged pages.** Start here, Installation, Recipes, Screens, Accessibility, Content and language, Handbook, Theming, Agents, Registry, Packages and Project were merged into the pages that absorb them. Accessibility and Writing became foundation pages; the guides became single pages at the root; the per-symbol API pages became sections of the generated Types page.
- **One fixed outline.** A component page has Usage, Examples, When to use it, Clinical meaning on a `health-*` category, Accessibility and Props interface, in that order. Every other page names its own headings.
- **Six kinds.** `guide`, `foundation`, `component`, `health`, `pattern` and `reference`, one per section.
- **Budgets on every page.** LEAN001 keeps a component page under 1,000 words (1,250 on a `health-*` category). LEAN002 keeps every other hand-written page under 1,200 words (1,500 on a health page).
- **A blueprintjs.com shell.** The sidebar holds a wordmark, a Theme row, a Search row and the six sections. There is no top navigation, breadcrumb, right-hand table of contents or footer on a documentation page.
- **Decision records leave the site.** They live in `decisions/` at the repository root, beside the code they constrain.
- **No dead links.** Every retired URL and its `.md` twin answer with a permanent redirect to the page that absorbed it, from `lib/redirects.ts` through `proxy.ts`.

## Consequences

- A reader sees six sections and a page they can finish. The long-form argument behind a rule is gone from the page; it is in git history and, where it records a decision, in this folder.
- Every rule, number, token, component contract and citation on a merged page was carried into the page that absorbed it, and the honesty markers came with them. Where two merged pages disagreed, the merged page took the stricter side and says so where it matters.
- `governedBy` and `usedIn` now name the merged Health and Patterns pages, so a component is governed by fewer, broader doctrine pages.
- The llms shards follow the sections: Components, Health, Foundations and Reference.
- Links into the old pages from outside, including copied component source that cites a doctrine page by its old path, still resolve through the redirects, but a rule cited by number may have a different number now.

## Alternatives considered

- **Keep the corpus and reshape only the navigation.** Rejected, because the length was the complaint and a shorter sidebar over the same pages leaves it.
- **Port the site off fumadocs to the plain `@next/mdx` setup clawscale uses.** Rejected, because fumadocs is what serves search, the `.md` twins and the llms shards, and the shape the reader sees does not depend on the engine.
- **Keep the merged pages' old URLs alive as stubs.** Rejected, because a stub is a page a search engine and an agent index as content, and a redirect says plainly where the content went.
