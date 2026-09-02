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
 */

import { createFromSource } from "fumadocs-core/search/server"

import { source } from "@/lib/source"
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
