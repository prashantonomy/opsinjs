import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { NotBuiltYet } from "@/components/docs/stub"
import { getCatalogue } from "@/lib/catalogue"
import {
  explainUnresolved,
  getRegistryEntry,
  listBases,
  listByKind,
  listStyles,
} from "@/lib/registry"
import type { ViewKind } from "@/lib/routes"
import type { Status } from "@/lib/status"

/**
 * The isolated render surface.
 *
 * `/view/base/base-lyra/component/range-bar`
 * `/view/base/base-lyra/example/range-bar-status`
 * `/view/base/base-lyra/screen/results-screen`
 *
 * WHAT THIS IS FOR. Three consumers, in order of importance:
 *
 * 1. `<ComponentPreview>` and `<IframePreview>` on documentation pages. They
 *    embed this route in an iframe, which is the only way a preview can render
 *    under the opsinjs PRODUCT theme while the page around it stays in the lyra
 *    docs chrome. That theme is squircle, system-ui, generous, and 44pt
 *    targets. Rendering previews inline would show every component wearing the
 *    documentation site's clothes, which on a system whose thesis is "the docs
 *    chrome is not the product" would be a lie told by omission.
 * 2. The nightly Playwright job, which screenshots these URLs into the registry
 *    and the OG assets. The markers below are its contract.
 * 3. A person debugging one component at one base and style, with nothing else
 *    on the page.
 *
 * WHY THE MATRIX IS IN THE PATH HERE AND NOWHERE ELSE. A documentation page has
 * exactly one canonical URL per component and takes base and style from a query
 * string, because a guessable URL is worth more than an addressable one there.
 * This surface is the opposite: it is consumed by machines that must be able to
 * name a specific combination, so `base` and `style` are real path segments.
 * Adding a second base later is a folder under `registry/bases/`, never a URL
 * migration. See locked decision 6.
 *
 * EVERY SEGMENT IS VALIDATED, and that is the whole safety property of this
 * route. It answers exactly two questions. One is "here is the component" and
 * the other is "this name is on the roster and has no code yet". The route must
 * never answer either one about a URL it did not understand. A path this route
 * cannot place is a 404, because the alternative is telling an agent that the
 * id it invented is a specified opsinjs component awaiting implementation,
 * which is the hallucination this scaffold exists to close rather than confirm.
 *
 * ROBOTS. `/view` is the single disallowed path in robots.txt, and this page
 * additionally declares `noindex`. Every URL here duplicates content that has a
 * canonical home on a documentation page, stripped of the guidance that makes it
 * safe to copy.
 */

/**
 * The three things a `/view` URL can render. The union is declared once, in
 * `lib/routes.ts`, alongside the function that builds these URLs. This route
 * only narrows an arbitrary path segment into it.
 */
const VIEW_KINDS: readonly ViewKind[] = ["component", "example", "screen"]

function isViewKind(value: string): value is ViewKind {
  return (VIEW_KINDS as readonly string[]).includes(value)
}

/** What the reader would have seen, phrased for the empty state. */
const VIEW_KIND_NOUN: Record<ViewKind, string> = {
  component: "This component",
  example: "This example",
  screen: "This screen",
}

/**
 * The honest empty state's contents, or `null` when there is nothing honest to
 * say because nobody has ever specified this name.
 */
interface UnbuiltFrame {
  /** The release phase the roster records, when there is one. */
  status?: Status
}

/**
 * Is this name on the roster for its kind, and if so at what status?
 *
 * The roster is a different file for each kind, which is why this cannot be one
 * lookup:
 *
 * - `component` is answered by `registry/catalogue.ts`, through
 *   `explainUnresolved()`. It already separates a specified-but-unbuilt id from
 *   an id nobody has ever catalogued, which is the distinction this route
 *   needs.
 * - `example` comes from the generated registry index, which is the whole
 *   roster: an example exists because a file exists under `registry/examples/`,
 *   so there is no such thing as a specified-but-unbuilt example and a miss is
 *   a 404. The caller has already tried that lookup, so a miss arrives here as
 *   `null`.
 * - `screen` has no specification page of its own any more: a screen is
 *   documented on the pattern page it illustrates, so an unbuilt screen has
 *   nothing honest to frame here and 404s like any unknown name.
 */
function describeUnbuilt(kind: ViewKind, name: string): UnbuiltFrame | null {
  if (kind === "component") {
    const unresolved = explainUnresolved(name)
    if (unresolved.reason === "unknown" || unresolved.status === null)
      return null
    return { status: unresolved.status }
  }

  return null
}

/**
 * Prerender the whole matrix, so nothing here renders at request time.
 *
 * WHY THIS ROUTE AND NOT THE OTHERS. Every other surface on this site is either
 * already static or is answering a question that only exists per request. This
 * one was neither. Its parameters are closed and knowable at build time, and it
 * was still rendering on demand: once per preview a reader opens, once per URL
 * the nightly capture job visits, and those are the same couple of hundred
 * pages every time.
 *
 * THE SET IS FILTERED BY THE ROUTE'S OWN PREDICATES rather than by a second
 * opinion about what exists. A candidate is kept when `getRegistryEntry`
 * resolves it or `describeUnbuilt` has something honest to say about it, which
 * are exactly the two branches below that do not reach `notFound()`. Deriving
 * the list that way is what makes `dynamicParams = false` safe: the prerendered
 * set and the set of URLs that were ever going to render are the same set by
 * construction, so everything else gets the 404 it already got, without a
 * server waking up to say so.
 *
 * THE STYLE FALLBACK IS COVERED, because the candidates are the full cross
 * product of `listBases()` and `listStyles()`. A name carried only at the
 * default style still resolves at every other style through `getRegistryEntry`,
 * and the filter sees that, so those URLs are prerendered rather than stranded.
 *
 * Three rosters feed it, one per kind, and they are the three `describeUnbuilt`
 * consults: the catalogue for components, and the generated index for examples
 * and screens. The index contributes to components as well, because a built
 * thing renders whether or not a roster still lists it.
 */
export const dynamicParams = false

export function generateStaticParams(): {
  base: string
  style: string
  kind: string
  name: string
}[] {
  const roster: Record<ViewKind, Set<string>> = {
    component: new Set([
      ...getCatalogue().map((entry) => entry.name),
      ...listByKind("component").map((entry) => entry.name),
    ]),
    example: new Set(listByKind("example").map((entry) => entry.name)),
    screen: new Set(listByKind("screen").map((entry) => entry.name)),
  }

  const params: { base: string; style: string; kind: string; name: string }[] =
    []

  for (const base of listBases()) {
    for (const style of listStyles()) {
      for (const kind of VIEW_KINDS) {
        for (const name of roster[kind]) {
          const renders =
            getRegistryEntry(name, base, style, kind) !== null ||
            describeUnbuilt(kind, name) !== null
          if (renders) params.push({ base, style, kind, name })
        }
      }
    }
  }

  return params
}

/**
 * A title, because these URLs are navigable rather than private: every
 * `<ComponentPreview>` caption links here with `target="_blank"`, so a reader
 * arrives at a real document in a real tab. With no `<title>` the tab and the
 * screen reader announce the URL instead. Announcing a URL is a failure of
 * WCAG 2.2 SC 2.4.2, and a Level A failure on a site that publishes a
 * conformance report. The base and the style are in it because the whole reason
 * this surface exists is that the same component renders differently across the
 * matrix, and a row of identically-titled tabs would lose exactly that
 * distinction.
 *
 * `robots` is carried here verbatim rather than left on a static `metadata`
 * export: a route may declare one or the other, never both.
 */
export async function generateMetadata(
  props: PageProps<"/view/[base]/[style]/[kind]/[name]">
): Promise<Metadata> {
  const { base, style, kind, name } = await props.params
  return {
    title: `${kind} ${name} at ${base}/${style} · opsinjs product theme`,
    robots: { index: false, follow: false, nocache: true },
  }
}

export default async function ViewPage(
  props: PageProps<"/view/[base]/[style]/[kind]/[name]">
) {
  const { base, style, kind, name } = await props.params

  // An unknown kind is a genuine 404 rather than an empty frame. A preview that
  // silently renders nothing is indistinguishable from a component that renders
  // nothing, and that ambiguity is exactly what this scaffold exists to remove.
  if (!isViewKind(kind)) notFound()

  /* A base or a style outside the matrix is the same class of mistake, and it
     reaches this route in practice: `?base=&style=` on a documentation page is
     linkable state, and the preview toolbar rebuilds every iframe src from
     whatever it finds there. Without this guard a mistyped base answered "this
     component does not exist in any released version of opsinjs". That answer
     made a definitive claim about the component, in reply to a question about
     the base. */
  if (!listBases().includes(base) || !listStyles().includes(style)) notFound()

  const entry = getRegistryEntry(name, base, style, kind)

  /**
   * `entry.component` is a dynamic import, not a component: the generated index
   * keeps every renderable behind `() => import(...)` so that the preview
   * surface code-splits per component and the index itself stays free of
   * top-level imports of files that do not exist yet. This route is an async
   * server component, so it can simply await the module. There is no
   * `next/dynamic` and no client boundary, and the iframe renders the component
   * in the first paint rather than after a loading state.
   */
  const Preview = entry?.component ? (await entry.component()).default : null

  /* Null here means one of two very different things, and the roster is what
     tells them apart: a name that is specified and unbuilt, or a name nobody
     has ever specified. The second one is a 404. That is the same answer `/r`
     already gives it, and it is the only answer that does not hand an agent its
     own invention back as a roadmap entry. */
  const unbuilt = Preview ? null : describeUnbuilt(kind, name)
  if (!Preview && !unbuilt) notFound()

  return (
    <main
      id="opsin-view-root"
      data-opsin-view={kind}
      data-opsin-view-name={name}
      data-opsin-view-base={base}
      data-opsin-view-style={style}
      /*
       * The screenshot contract. `capture-registry.mts` waits for
       * `[data-opsin-view-state="ready"]` and clips to `#opsin-view-root`, so a
       * capture can never race the render and can never accidentally photograph
       * a not-built placeholder as though it were a component. Both states are
       * declared here rather than inferred from the DOM, and there are still
       * exactly two: everything this route cannot place is a 404 above, so a
       * capture never waits on a state that will not arrive.
       */
      data-opsin-view-state={Preview ? "ready" : "not-built"}
      className="flex min-h-dvh w-full items-center justify-center p-6"
    >
      {Preview ? (
        <Preview />
      ) : (
        /*
         * The honest empty state, and the reason this route was worth shipping
         * before a single component existed. It names the component and states
         * the status the roster actually records for it, which is never a
         * default. It also points at the
         * specification, and emits the machine-readable not-implemented marker,
         * so an agent that follows a preview URL is told plainly that there is
         * nothing to render, instead of getting a blank iframe it will read as
         * a broken renderer and work around by inventing an API.
         */
        <NotBuiltYet
          name={name}
          what={VIEW_KIND_NOUN[kind]}
          status={unbuilt?.status}
        />
      )}
    </main>
  )
}
