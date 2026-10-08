import { highlight } from "fumadocs-core/highlight"
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock"

import { getEntry } from "@/lib/catalogue"
import { getRegistryEntry } from "@/lib/registry"
import { DEFAULT_BASE, DEFAULT_STYLE } from "@/lib/routes"
import type { Status } from "@/lib/status"
import {
  ComponentPreview as ComponentPreviewSurface,
  IframePreview as IframePreviewSurface,
  type ComponentPreviewProps,
  type IframePreviewProps,
} from "./preview"

/* ==========================================================================
   preview-server.tsx does the registry lookup that <ComponentPreview> and
   <IframePreview> cannot do for themselves.

   THIS FILE EXISTS FOR EXACTLY ONE REASON: A BOOLEAN IS SMALL AND THE REGISTRY
   INDEX IS NOT.

   `preview.tsx` is `"use client"`, and it has to be: the theme, density, text
   and status switches are the mechanism behind a promise two pages make about
   a 200% Dynamic Type demonstration, and a switch that does not switch is
   worse than no switch. But the FULL TEXT of every built component file sits
   in the `source` field that `registry/__index__.ts` puts on every entry, and
   importing `@/lib/registry` from a client module would ship all of it to the
   browser on every one of the ~380 documentation pages, whether or not that
   page has a preview on it.

   So the lookup happens here, in a server component, and the only things that
   cross the boundary are `built: boolean` and `phase`, one release-phase word
   off the catalogue row. The client surface keeps every bit of its
   interactivity and gains nothing it has to download. Anything else a lookup
   turns up belongs on this side of the line.

   These two exports carry the public names. `components/mdx.tsx` registers
   `ComponentPreview` and `IframePreview` FROM THIS FILE; the same names in
   `./preview` are the client surfaces underneath and are not what MDX resolves
   to. If you ever import one of them directly, you get a preview that can
   never resolve a component, because nothing will have told it that one
   exists.
   ========================================================================== */

/**
 * True when this name really does render something at `/view`.
 *
 * `component !== null` rather than `entry !== null` is the whole check. The
 * type admits an entry whose `component` is null, and `getRegistryEntry` can
 * return one. Framing a route for such an entry would put an iframe around
 * the `/view` route's own not-built state, which teaches a reader that
 * previews are broken rather than that a component is unwritten.
 */
function resolvesToARender(
  name: string | undefined,
  base: string,
  style: string,
  kind: "component" | "example" | "screen"
): boolean {
  if (!name) return false
  const entry = getRegistryEntry(name, base, style, kind)
  return entry?.component != null
}

/**
 * The catalogue row's release phase, for the empty state's machine sentence.
 *
 * Resolved here for the same reason `built` is: the phase is a fact about
 * registry/catalogue.ts, and `lib/catalogue` must not cross into a client
 * module. Only the resolved word crosses, and it is what the empty state's
 * chip prints, so a page cannot assert a phase its row does not record. An id
 * that is not a catalogue row (an example, a screen) resolves to nothing and
 * the surface falls back to its own default.
 */
function phaseOf(name: string | undefined): Status | undefined {
  return name ? getEntry(name)?.status : undefined
}

/**
 * `built` is resolved here and never accepted from a caller. An MDX page that
 * could assert a component exists would be able to do the one thing this whole
 * site is built to prevent. `phase` is resolved on the same terms.
 */
export type ComponentPreviewServerProps = Omit<
  ComponentPreviewProps,
  "built" | "phase"
>

/** The preview block on a component page. See `./preview` for the surface. */
/**
 * An example's source as a reader would paste it: the file's opening doc
 * comment removed, a "use client" directive kept, and the registry's own
 * import alias rewritten to the path `shadcn add` writes components to.
 */
export function displaySource(source: string): string {
  const directive = /^\s*(["']use client["'];?)\s*\n/.exec(source)
  const rest = directive ? source.slice(directive[0].length) : source
  const body = rest
    .replace(/^\s*\/\*\*[\s\S]*?\*\/\s*\n/, "")
    .replace(/@\/registry\/base-lyra\/ui\//g, "@/components/ui/")
    .trim()
  return directive ? `${directive[1]}\n\n${body}` : body
}

/**
 * The source under an example, as on blueprintjs.com: the live preview above,
 * the file you would copy below it, highlighted on the server.
 */
async function ExampleSource({ name, source }: { name: string; source: string }) {
  const code = displaySource(source)
  const rendered = await highlight(code, {
    lang: "tsx",
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
    components: {
      pre: (props) => (
        <CodeBlock title={`${name}.tsx`} allowCopy className="mt-0">
          <Pre {...props} />
        </CodeBlock>
      ),
    },
  })
  return <div data-opsinjs-example-source={name}>{rendered}</div>
}

export function ComponentPreview(props: ComponentPreviewServerProps) {
  const {
    name,
    base = DEFAULT_BASE,
    style = DEFAULT_STYLE,
    kind = "component",
  } = props

  /*
   * The lookup uses the base and style the PAGE names, not the ones a reader
   * may have put in `?base=&style=`. A server component cannot see the query
   * string without opting the entire documentation corpus out of static
   * generation (AGENTS.md §3), and the query override is a reader's
   * deliberate act: if they point a preview at a base that has nothing in it,
   * the framed `/view` route answers for itself with its own
   * `data-opsin-view-state="not-built"`, under the product theme, generated by
   * the route that owns that fact rather than guessed at here.
   */
  const built = resolvesToARender(name, base, style, kind)
  const surface = (
    <ComponentPreviewSurface {...props} built={built} phase={phaseOf(name)} />
  )

  const source =
    kind === "example" && built && name
      ? getRegistryEntry(name, base, style, kind)?.source
      : undefined
  if (!name || !source) return surface

  return (
    <div className="my-6 [&>*:first-child]:mb-0">
      {surface}
      <ExampleSource name={name} source={source} />
    </div>
  )
}

/** `built` is resolved, never passed. See `ComponentPreviewServerProps`. */
export type IframePreviewServerProps = Omit<
  IframePreviewProps,
  "built" | "phase"
>

/** A `/view` route framed at a device width. See `./preview` for the surface. */
export function IframePreview(props: IframePreviewServerProps) {
  const {
    name,
    base = DEFAULT_BASE,
    style = DEFAULT_STYLE,
    kind = "component",
  } = props

  return (
    <IframePreviewSurface
      {...props}
      built={resolvesToARender(name, base, style, kind)}
      phase={phaseOf(name)}
    />
  )
}
