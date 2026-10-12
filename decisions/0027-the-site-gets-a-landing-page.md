# ADR 0027. The site gets a landing page, and the documentation moves under `/docs`

A blueprintjs.com banner takes `/`, with links to the documentation and to GitHub, and every documentation URL gains a `/docs` prefix that its old root address redirects to.

## Status

**Accepted.** 2026-10-12. Reverses the "no landing page" half of the change that rooted the corpus on 2026-09-20 (commit 7d58a76); the shape [ADR 0026](./0026-the-site-takes-the-clawscale-shape.md) gave the documentation itself stands. The structure is held by `DOCS_BASE` in `apps/www/lib/routes.ts`, the route folder `app/(chrome)/(docs)/docs/`, `LEGACY_ROOT_SEGMENTS` in `apps/www/lib/redirects.ts` with `proxy.ts`, and `assert-ia` rule IA007.

## Context

On 2026-09-20 the landing page was deleted and the documentation took the root, because that landing page had become a second definition of things the corpus already defined, in tables whose cells were mostly links.

The owner asked for a front page shaped like blueprintjs.com. Both sites this one is modelled on have one: blueprintjs.com and the clawscale documentation each put a banner at `/` carrying the mark, the name, a one-line claim and two links, Documentation and GitHub, over a quiet backdrop, with the publisher in a footer below. The documentation sits under `/docs`. The owner also asked for the publisher's lockup in that footer: the Pensieve mark with the wordmark below it, and the address www.pensievelabs.org.

A static page at `/` cannot coexist with an optional catch-all at `/`, so the landing page and a rooted corpus are mutually exclusive.

## Decision

- **`DOCS_BASE` is `/docs`.** The introduction renders at `/docs`, a component at `/docs/components/button`, and the index twin is `/docs.md`.
- **The landing page defines nothing.** It carries the opsinjs mark, the name, the tagline from `site.tagline` and two links. Every fact stays on a documentation page, which is the failure the deleted page was removed for.
- **It is dark in both colour schemes,** as the blueprintjs.com banner is, and has no theme switch. The backdrop is two quiet layers: a sheet of measurement paper that fades towards the edges, and a horizon drawn from the opsinjs mark, a track with its expected band and one reading, across the width of the page.
- **The footer is the publisher, stacked.** The Pensieve mark sits above the wordmark, in the geometry, face, weight and tracking of the pensievelabs navbar lockup, with the address below it. Nothing else is in the footer.
- **Every old address still lands.** `proxy.ts` sends a path whose first segment was a documentation segment while the corpus was rooted to the same path under `/docs`, in one hop, and `/index.md` to `/docs.md`. The segment list is frozen, because it records URLs that were public.
- **IA007 changes job.** It used to stop a docs folder colliding with a tool route at the root. It now stops an app route taking a frozen legacy segment, which the proxy would redirect before it rendered.

## Consequences

- Every documentation URL changed for the second time in a month. Bookmarks, search results and agent caches follow a permanent redirect; anything that hardcoded a root path and does not follow redirects breaks.
- The error links in `lib/opsinjs.ts` now name `/docs`. A consumer project holding an older copy of that file prints root URLs, which still resolve through the redirect.
- The frozen segment list is a permanent constraint on route names. `/components`, `/health` or `/reference` can never be a tool page.
- The landing page is one more surface to keep honest. It makes no claim beyond the tagline, so nothing on it can drift from the documentation, and the review position stays on the component pages where it is authored.
- The landing page loads Geist for one word, the Pensieve wordmark. `next/font` serves it from this origin, so the font policy did not widen.

## Alternatives considered

- **Keep the corpus at the root and move the introduction to `/introduction`.** Rejected, because it keeps most URLs stable at the cost of an address shape neither model site uses, and it turns `/` into a page the sidebar does not list while the introduction loses the address a reader guesses.
- **A landing page that summarises the system.** Rejected for the reason the last one was deleted: a summary is a second definition, and the two drift.
- **A light banner that follows the theme.** Rejected for now, because the model sites hold the banner dark and a theme switch on a page with two links is a control with nothing to act on. The documentation stays light first.
