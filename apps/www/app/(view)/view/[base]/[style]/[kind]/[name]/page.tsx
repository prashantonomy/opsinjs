import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { NotBuiltYet } from "@/components/docs/stub"
import {
  explainUnresolved,
  getRegistryEntry,
  listBases,
  listStyles,
} from "@/lib/registry"
import type { ViewKind } from "@/lib/routes"
import { getPage } from "@/lib/source"
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
 *    under the opsinjs PRODUCT theme — squircle, system-ui, generous, 44pt
 *    targets — while the page around it stays in the lyra docs chrome. Rendering
 *    previews inline would show every component wearing the documentation site's
 *    clothes, which on a system whose thesis is "the docs chrome is not the
 *    product" would be a lie told by omission.
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
 * ROBOTS. `/view` is the single disallowed path in robots.txt, and this page
 * additionally declares `noindex`. Every URL here duplicates content that has a
 * canonical home on a documentation page, stripped of the guidance that makes it
 * safe to copy.
 */

/**
 * The three things a `/view` URL can render. The union is declared once, in
 * `lib/routes.ts`, alongside the function that builds these URLs — this route
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

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default async function ViewPage(
  props: PageProps<"/view/[base]/[style]/[kind]/[name]">
) {
  const { base, style, kind, name } = await props.params

  // An unknown kind is a genuine 404 rather than an empty frame. A preview that
  // silently renders nothing is indistinguishable from a component that renders
  // nothing, and that ambiguity is exactly what this scaffold exists to remove.
  if (!isViewKind(kind)) notFound()

  const entry = getRegistryEntry(name, base, style, kind)

  /**
   * `entry.component` is a dynamic import, not a component: the generated index
   * keeps every renderable behind `() => import(...)` so that the preview
   * surface code-splits per component and the index itself stays free of
   * top-level imports of files that do not exist yet. This route is an async
   * server component, so it can simply await the module — no `next/dynamic`, no
   * client boundary, and the iframe renders the component in the first paint
   * rather than after a loading state.
   *
   * Today this is always null, and that is the interesting case.
   */
  const Preview = entry?.component ? (await entry.component()).default : null

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
       * declared here rather than inferred from the DOM.
       */
      data-opsin-view-state={Preview ? "ready" : "not-built"}
      className="flex min-h-[100dvh] w-full items-center justify-center p-6"
    >
      {Preview ? (
        <Preview />
      ) : (
        /*
         * The honest empty state, and the reason this route is worth shipping
         * before a single component exists. It names the component, states its
         * status, points at the specification, and emits the machine-readable
         * not-implemented marker — so an agent that follows a preview URL gets a
         * definitive negative answer instead of a blank iframe it will interpret
         * as a rendering failure and work around by inventing an API.
         */
        <NotBuiltYet name={name} what={VIEW_KIND_NOUN[kind]} />
      )}
    </main>
  )
}
