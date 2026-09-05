/**
 * GET /api/search?query=… — document search.
 *
 * fumadocs' ZBSearch server, bundled with the app: no account, no external
 * service, no key. Because the generated reference pages are committed as real
 * MDX under `content/docs/reference/generated`, they are ordinary pages here —
 * which is the only reason the token, contrast and glossary tables are
 * searchable at all, without a second index or a custom backend.
 *
 * THE PARAMETER IS `query`, NOT `q`. fumadocs' endpoint reads
 * `url.searchParams.get("query")` and returns `[]` for anything else, so `?q=`
 * fails silently — a search box wired to the wrong name looks like a corpus
 * with no matches.
 *
 * Two things are added to the default index:
 *
 * `tag` is the page's section, so `?query=range&tag=health` searches the
 * doctrine layer without dragging in every component page that mentions a
 * range. An agent narrowing to one pillar is the common case here.
 *
 * `aliases` are folded into the indexed content. The catalogue declares that
 * RangeBar answers to "reference range", "normal range" and "gauge"; without
 * this, a reader searching the phrase a clinician would use finds nothing,
 * because the page never has to contain the synonym for the synonym to be the
 * right answer.
 *
 * The registry id is folded in too, as its own short entry. An agent given
 * `status-pill` searches that string, and without an entry it matches only in
 * passing — behind the catalogue table and the installation pages, which
 * mention every id many times over. A short entry containing little else is the
 * cheapest way to make the component's own page the best answer to its own id.
 *
 * THE RELEASE SENTENCE IS NOT AN IMPLEMENTATION CLAIM, except where it can be
 * one. It used to read `Release status: ${status}. Not implemented.` for
 * everything that was not `stable`, which indexed every built component as
 * unbuilt on the surface an agent queries first — the site telling a machine
 * to hand-write a clinical status pill rather than install the reviewed one.
 * Implementation is not a phase: it is whether
 * `registry/__index__.ts` has source behind the id, which is what
 * `implementedComponents()` answers and what `/r/index.json` publishes. So the
 * claim is made only where it can be checked — on a component page, against the
 * built set — and the `planned`/`considered` wording mirrors
 * `notImplementedNotice()` in `app/_machine/corpus.ts` rather than being a
 * second opinion about which phases have code. Doctrine pages get their phase
 * and no implementation claim in either direction, because a prose page is not
 * a thing that ships.
 */

import { createFromSource } from "fumadocs-core/search/server"

import { source } from "@/lib/source"
import { implementedComponents } from "@/app/_machine/contracts"
import { metaOf, sectionOf } from "@/app/_machine/corpus"

export const { GET } = createFromSource(source, {
  language: "english",
  buildIndex(page) {
    const meta = metaOf(page)
    const section = sectionOf(page)
    const structured = page.data.structuredData

    const contents = [...structured.contents]
    if (meta.aliases.length > 0) {
      contents.push({
        heading: undefined,
        content: `Also known as: ${meta.aliases.join(", ")}.`,
      })
    }
    if (meta.status !== "stable") {
      contents.push({
        heading: undefined,
        content: `Release status: ${meta.status}. Not implemented.`,
      })
    }

    return {
      id: page.url,
      url: page.url,
      title: meta.title,
      description: meta.description,
      tag: section.id === "" ? "index" : section.id,
      structuredData: { headings: structured.headings, contents },
    }
  },
})
