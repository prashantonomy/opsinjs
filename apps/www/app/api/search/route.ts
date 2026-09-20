/**
 * GET /api/search?query=… serves document search.
 *
 * fumadocs' ZBSearch server, bundled with the app: no account, no external
 * service, no key. Because the generated reference pages are committed as real
 * MDX under `content/docs/reference/generated`, they are ordinary pages here.
 * Being ordinary pages is the only reason the token, contrast and glossary
 * tables are searchable at all, without a second index or a custom backend.
 *
 * THE PARAMETER IS `query`, NOT `q`. fumadocs' endpoint reads
 * `url.searchParams.get("query")` and returns `[]` for anything else, so `?q=`
 * fails silently. A search box wired to the wrong name looks like a corpus with
 * no matches.
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
 * passing. That match ranks behind the catalogue table and the installation
 * pages, which mention every id many times over. A short entry containing
 * little else is the cheapest way to make the component's own page the best
 * answer to its own id.
 *
 * THE RELEASE SENTENCE IS NOT AN IMPLEMENTATION CLAIM, except where it can be
 * one. It used to read `Release status: ${status}. Not implemented.` for
 * everything that was not `stable`, which indexed every built component as
 * unbuilt on the surface an agent queries first. The site was telling a machine
 * to hand-write a clinical status pill rather than install the reviewed one.
 * Implementation is not a phase: it is whether `registry/__index__.ts` has
 * source behind the id, which is what `implementedComponents()` answers and
 * what `/r/index.json` publishes. So the claim is made only on a component
 * page, where it can be checked against the built set. The `planned` wording
 * mirrors `notImplementedNotice()` in `app/_machine/corpus.ts` rather than
 * being a second opinion about which phases have code.
 *
 * AND THE STABILITY HALF IS NO LONGER CONDITIONAL, because there is no phase
 * left for it to be conditional on. `stable` is gone from the vocabulary, and
 * the three that remain say whether there is code and whether it is on its way
 * out. Nothing in the catalogue has had an accessibility review or a clinical
 * review, so the installable branch says that flat rather than hedging it as
 * "the API is not stable yet", which was the smaller of the two warnings and
 * the only one an agent was being given.
 *
 * A page with no phase at all gets no release sentence. That is every page in the
 * pages, and a doctrine page indexed with a phase word was always indexing a
 * claim about prose as though it were a claim about code.
 */

import { createFromSource } from "fumadocs-core/search/server"

import { REVIEW_FLOOR_NOTICE } from "@/lib/status"
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

    /* A component page is the one whose last slug segment is a registry id;
       every other page has no id to be implemented or not. */
    const id = meta.kind === "component" ? page.slugs.at(-1) : undefined

    if (id) {
      contents.push({ heading: undefined, content: `Component id: ${id}.` })
    }
    if (meta.aliases.length > 0) {
      contents.push({
        heading: undefined,
        content: `Also known as: ${meta.aliases.join(", ")}.`,
      })
    }

    /* THE IMPLEMENTATION CHECK STAYS OUTERMOST AND THE PHASE WORD DECIDES THE
       WORDING INSIDE IT. Those are two different questions and swapping them
       breaks one of them either way. `implementedComponents()` is a directory
       listing and is the only thing that can answer "is there code", which is
       why it guards the outside; a phase word is a claim somebody typed.
       But `deprecated` means still installable, so a deprecated component is
       always in the built set, and hardcoding "shipped" in this branch left
       the `deprecated` branch below unreachable and indexed a component on its
       way out as though it were the recommended one. Retiring a component is a
       frontmatter change and nothing else, so the search index has to follow a
       frontmatter change. The `deprecated` branch below still earns its place:
       it catches the id whose source has since been deleted, which is a
       different sentence again. */
    if (id && implementedComponents().includes(id)) {
      contents.push({
        heading: undefined,
        content:
          meta.status === "deprecated"
            ? "Release status: deprecated. Still installable; its page names the replacement."
            : `Release status: shipped. Installable from the registry. ${REVIEW_FLOOR_NOTICE}`,
      })
    } else if (meta.status === "planned") {
      contents.push({
        heading: undefined,
        content: "Release status: planned. Not implemented.",
      })
    } else if (meta.status === "deprecated") {
      contents.push({
        heading: undefined,
        content:
          "Release status: deprecated. Not implemented; its page names the replacement.",
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
