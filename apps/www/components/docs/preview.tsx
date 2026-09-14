"use client"

import {
  useId,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react"
import { Monitor, Smartphone, Tablet } from "lucide-react"

import {
  DEFAULT_BASE,
  DEFAULT_STYLE,
  viewPath,
  type ViewKind,
} from "@/lib/routes"
import {
  CLINICAL_STATUSES,
  CLINICAL_STATUS_META,
  type ClinicalStatus,
  type Status,
} from "@/lib/status"
import { cn } from "@/lib/utils"
import { NotBuiltYet } from "./stub"

/* ==========================================================================
   preview.tsx defines <ComponentPreview>, <IframePreview>, <DeviceFrame> and
   <ViewportToolbar>.

   THE SWITCHES ARE NOT DECORATION. A20/B20 make theme, density, status and
   text size mandatory on every preview, because two pages
   (foundations/typography/dynamic-type and accessibility/text-resizing-and-zoom)
   promise a 200% Dynamic Type demonstration and a promise with no mechanism
   behind it is the kind of accessibility claim this site exists to stop making.

   Text size is a real font-size change on the previewed document's root, never
   a `transform: scale()`. Scaling makes a screenshot; changing the font size
   makes the layout reflow, wrap and truncate exactly as it does for somebody
   who has set 200% in their operating system. That is the only version of the
   demonstration that tells you anything. The switches reach the framed document
   as `?text=` and `?density=`, which app/(view)/layout.tsx's inline script
   stamps onto <html> before first paint; product.css turns them into
   `font-size` and `--spacing`. The same values are also applied to the surface
   itself, so a specimen passed as `children` reflows identically.

   Density moves `--spacing` and nothing else. Tailwind v4 derives every spacing
   utility from that one custom property, so a container can re-scale its
   subtree without a single component knowing about density. Type size and touch
   targets deliberately do NOT move: "compact" must never quietly mean "harder
   to hit".

   BOTH PREVIEWS FRAME `/view`. THE DIFFERENCE IS WHAT THEY FRAME IT FOR.

   Both mount a `/view/[base]/[style]/[kind]/[name]` iframe, which is a
   separate root layout with its own <html> and only product.css. That is the
   only way to see the opsinjs PRODUCT theme, because the two stylesheets
   deliberately never meet. The product theme is squircle, platform UI font,
   generous.

   Rendering a component INLINE here instead would be a quiet lie, in two
   different ways. `--secondary`, `--accent`, `--destructive`, `--popover`,
   `--sidebar*` and `--chart-1..5` exist ONLY in globals.css and resolve to
   nothing under product.css, so anything painted with them disappears. The
   quieter failure is the one that still renders: `--background`, `--card`,
   `--radius`, `--spacing` and the `--radius-2xl/3xl/4xl` ladder resolve under
   BOTH sheets and to DIFFERENT values. product.css sets `--radius: 1rem` and
   inherits Tailwind's own radius defaults, where globals.css derives the same
   names from the lyra `--radius`. An inline preview therefore shows a component
   that is materially not the component the consumer installs, and shows it in
   the one place a reviewer would most trust it. ADR 0004 and ADR 0007 exist to
   stop exactly that.

   <ComponentPreview> is the preview block on a component page: one component,
   at the page's width, with the theme / density / text / status switches above
   it. The switches rebuild the iframe's URL through `viewPath`, so flipping to
   Dark or 200% reframes the document rather than restyling a picture of it.
   It renders <NotBuiltYet> instead of a frame when the name resolves to
   nothing. An iframe around an empty route teaches a reader that previews are
   broken rather than that a component is unwritten. It also accepts `children`,
   which foundations pages use to put specimen content under the same switches;
   children win over everything, because a specimen is not a component and has
   no registry entry to resolve.

   <IframePreview> is the screen-scale one: device widths (390 / 744 / 1180),
   a fixed frame height, and light/dark only. It is opt-in via `embed`, because
   a 560px frame is a big thing to mount without the page asking for it. Both
   print the target URL in the caption either way, so a reader can always open
   the document a preview is showing them.

   Neither builds a `/view` URL by hand. `viewPath` in lib/routes.ts owns the
   query-string contract that app/(view)/layout.tsx's inline script reads.

   NEITHER OF THESE IS WHAT MDX RESOLVES TO. `components/mdx.tsx` registers the
   wrappers in `./preview-server`, which do the registry lookup this module
   cannot do. See that file for why the boolean, and not the index, crosses
   the client boundary.
   ========================================================================== */

/** A subscription that never fires. Module-level so its identity is stable. */
function subscribeNever(): () => void {
  return () => {}
}

/**
 * True once the component has hydrated. `useSyncExternalStore` with a
 * never-firing subscription is how a component reads `window` during render
 * without a hydration mismatch and without pushing a boolean through an effect.
 */
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  )
}

type PreviewMode = "light" | "dark"
type Density = "compact" | "default" | "comfortable"
type TextSize = "100" | "125" | "150" | "200"
const DENSITY_SPACING: Record<Density, string | undefined> = {
  compact: "0.2rem",
  default: undefined,
  comfortable: "0.32rem",
}

/**
 * The `(view)` query-string contract lives in lib/routes.ts (`viewPath`), and
 * the names it emits are read before first paint by the inline script in
 * app/(view)/layout.tsx. Nothing in this file constructs that URL by hand.
 *
 * `status` is deliberately NOT part of it. The view shell reads mode, density,
 * text and theme; a clinical status is a property of the DATA a preview is
 * given, not of the shell it renders in, and smuggling it through the query
 * string would make the preview surface look as though it could assign one.
 */
export type PreviewKind = ViewKind

/* --------------------------------------------------------------------------
   Toolbar
   -------------------------------------------------------------------------- */

interface SwitchGroupProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string; title?: string }[]
  onChange: (value: T) => void
  name: string
}

function SwitchGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  name,
}: SwitchGroupProps<T>) {
  return (
    // `flex-wrap` is load-bearing, not tidiness. The Status group has five
    // options and measures 332px; the docs shell clips at `overflow-x: clip`,
    // so at a 320px viewport the last option was sliced by the edge with no
    // scroll to reach it and no page-level overflow for a checker to catch.
    // The last option is Urgent, of all of them. Wrapping to a second row is
    // the fix; the labels carry their own borders, so a wrapped row still
    // reads as a row.
    <fieldset className="m-0 flex flex-wrap items-center gap-1 border-0 p-0">
      <legend className="sr-only">{label}</legend>
      <span
        aria-hidden="true"
        className="pr-0.5 text-[0.6875rem] text-muted-foreground"
      >
        {label}
      </span>
      {options.map((option) => {
        const id = `${name}-${option.value}`
        const active = option.value === value
        return (
          <span key={option.value} className="contents">
            <input
              type="radio"
              className="sr-only"
              id={id}
              name={name}
              checked={active}
              title={option.title}
              onChange={() => onChange(option.value)}
            />
            <label
              htmlFor={id}
              title={option.title}
              className={cn(
                "cursor-pointer border border-border px-1.5 py-0.5 text-[0.6875rem] leading-4",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </label>
          </span>
        )
      })}
    </fieldset>
  )
}

export interface ViewportToolbarProps {
  device: Device
  onDeviceChange: (device: Device) => void
  className?: string
}

/** Device width switcher, used above an <IframePreview> or a <DeviceFrame>. */
export function ViewportToolbar({
  device,
  onDeviceChange,
  className,
}: ViewportToolbarProps) {
  const name = useId()
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <fieldset className="m-0 flex items-center gap-1 border-0 p-0">
        <legend className="sr-only">Viewport width</legend>
        {(Object.keys(DEVICES) as Device[]).map((key) => {
          const Icon = DEVICES[key].icon
          const id = `${name}-${key}`
          const active = key === device
          return (
            <span key={key} className="contents">
              <input
                type="radio"
                className="sr-only"
                id={id}
                name={name}
                checked={active}
                onChange={() => onDeviceChange(key)}
              />
              <label
                htmlFor={id}
                title={`${DEVICES[key].label} at ${DEVICES[key].width}px`}
                className={cn(
                  "cursor-pointer border border-border p-1",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon aria-hidden="true" className="size-3.5" />
                <span className="sr-only">{DEVICES[key].label}</span>
              </label>
            </span>
          )
        })}
      </fieldset>
    </div>
  )
}

/* --------------------------------------------------------------------------
   Device frame
   -------------------------------------------------------------------------- */

export type Device = "phone" | "tablet" | "desktop"

const DEVICES: Record<
  Device,
  { label: string; width: number; icon: typeof Monitor }
> = {
  // 390 is the iPhone 14/15 logical width and the narrowest surface a
  // patient-facing health screen is realistically read on. 744 is the small
  // iPad. Neither is a marketing choice: they are the widths at which a
  // reference-range bar and a two-line clinical sentence stop fitting.
  phone: { label: "Phone", width: 390, icon: Smartphone },
  tablet: { label: "Tablet", width: 744, icon: Tablet },
  desktop: { label: "Desktop", width: 1180, icon: Monitor },
}

export interface DeviceFrameProps {
  device?: Device
  children: ReactNode
  /** Height of the frame's viewport in pixels. */
  height?: number
  className?: string
}

/**
 * A fixed-width frame that constrains its content to a real device width.
 *
 * It is a plain bordered box, not a drawing of a phone. A bezel illustration
 * would add nothing except the suggestion that what is inside has been tested
 * on that device.
 */
export function DeviceFrame({
  device = "phone",
  children,
  height = 560,
  className,
}: DeviceFrameProps) {
  const meta = DEVICES[device]
  return (
    <div
      data-device={device}
      className={cn("flex justify-center overflow-x-auto", className)}
    >
      <div
        className="shrink-0 border border-border bg-background"
        style={{ width: meta.width, maxWidth: "100%", height }}
      >
        {children}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <ComponentPreview>
   -------------------------------------------------------------------------- */

export interface ComponentPreviewProps {
  /** Catalogue id, or the example id when `kind` is `example`. */
  name?: string
  /** The behaviour axis. One base today; the folder exists so a second is additive. */
  base?: string
  /** The CSS axis. `base-lyra` is the docs chrome default. */
  style?: string
  kind?: PreviewKind
  /**
   * What to render inside the preview surface. Foundations pages pass specimen
   * content here so the density and text-size switches operate on something
   * real without pretending the specimen is a component. Children win over
   * `name`: a specimen has no registry entry, and resolving one would be
   * answering a question nobody asked.
   */
  children?: ReactNode
  /** Centre the content, or let it fill. Health tiles want `start`. */
  align?: "center" | "start"
  /** Minimum height of the surface, and the height of the frame inside it. */
  minHeight?: number
  /**
   * An optional line rendered INSIDE the frame, in a band below the surface and
   * above the meta caption. It exists for the one case a sentence in the page
   * prose cannot cover: naming a framed specimen as an anti-pattern a reader
   * must not copy. Prose above the frame is read before the surface and gone by
   * the time the reader is scanning it, so the warning has to travel with the
   * frame or it is not there when it is needed.
   *
   * It is chrome, never a status surface. It carries no `data-status`, no
   * `data-category` and no clinical status colour, so a caption on a preview
   * whose surface holds a Watch reading keeps the two colour axes apart: the
   * band is neutral and the word in it, not a hue, is what marks the anti-pattern.
   */
  caption?: ReactNode
  className?: string
  /**
   * Whether `name` resolves to something that really renders at `/view`.
   *
   * Set by <ComponentPreview> in ./preview-server, which is what MDX resolves
   * to; a page never passes it and the wrapper's props type does not admit it.
   * The lookup has to happen on the server because `registry/__index__.ts`
   * carries every built component's full source text, and importing it here
   * would ship all of it to the browser on every documentation page.
   */
  built?: boolean
  /**
   * The catalogue row's release phase, resolved on the server alongside
   * `built` and never passed by a page.
   *
   * It reaches <NotBuiltYet>, whose visually-hidden sentence differs between
   * `considered` and `planned`: a `planned` id has a written specification and
   * the sentence warns that it may change, a `considered` id has none and the
   * sentence must not imply one. Without this the empty state on all 36
   * `considered` component pages announced a specification the page itself
   * denies two paragraphs above.
   */
  phase?: Status
}

/**
 * The preview block on a component page.
 *
 * The switches are present and working whether or not anything is built. That
 * is deliberate: the page keeps communicating its intended shape, the controls
 * are exercised from day one rather than bolted on later, and a reader can see
 * that the mechanism exists before the component does.
 */
export function ComponentPreview({
  name,
  base = DEFAULT_BASE,
  style = DEFAULT_STYLE,
  kind = "component",
  children,
  align = "center",
  minHeight = 220,
  caption,
  className,
  built = false,
  phase,
}: ComponentPreviewProps) {
  const id = useId()
  const [mode, setMode] = useState<PreviewMode>("light")
  const [density, setDensity] = useState<Density>("default")
  const [text, setText] = useState<TextSize>("100")
  const [status, setStatus] = useState<ClinicalStatus | "none">("none")
  /**
   * `?base=&style=` is linkable page state (decision 6). It is read from
   * `window.location.search` after hydration rather than with
   * `useSearchParams()` during render, on purpose: reading search params in the
   * docs route would opt the ENTIRE documentation corpus out of static
   * generation (addendum A6), and wrapping every preview in its own Suspense
   * boundary to avoid that is a lot of machinery for a query string almost
   * nobody sets.
   */
  const isClient = useIsClient()
  const query = isClient ? new URLSearchParams(window.location.search) : null
  const resolved = {
    base: query?.get("base") ?? base,
    style: query?.get("style") ?? style,
  }

  /*
   * ONE URL, BUILT ONCE, FROM LIVE TOOLBAR STATE.
   *
   * The frame below and the "Open under the product theme" link in the caption
   * must always address the same document; two constructions would drift the
   * first time somebody added a parameter to one of them. It is built here
   * rather than in the server wrapper because `mode`, `density` and `text` are
   * client state: app/(view)/layout.tsx reads them off the query string before
   * first paint, so a URL frozen at the server's values would leave every
   * switch changing the surround and nothing inside it.
   *
   * `viewPath` owns the shape. Never write a "/view..." string here. That is
   * both the decision-6 contract and an assert-ia failure.
   */
  const viewSrc = name
    ? viewPath({
        base: resolved.base,
        style: resolved.style,
        kind,
        name,
        mode,
        density: density === "default" ? undefined : density,
        text: Number(text) as 100 | 125 | 150 | 200,
      })
    : null

  const surfaceStyle: CSSProperties &
    Record<string, string | number | undefined> = {
    minHeight,
    fontSize: text === "100" ? undefined : `${text}%`,
    "--spacing": DENSITY_SPACING[density],
  }

  return (
    <figure
      data-opsinjs-preview={name ?? "unnamed"}
      // The same marker <IframePreview> emits, and for the same reason: the
      // nightly accessibility job and anything else auditing this page needs
      // to know which document a preview is actually showing, without parsing
      // an iframe out of the markup first.
      data-opsinjs-view-src={children ? undefined : (viewSrc ?? undefined)}
      className={cn("not-prose my-6 border border-border", className)}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/60 px-3 py-2">
        <SwitchGroup
          label="Theme"
          name={`${id}-mode`}
          value={mode}
          onChange={setMode}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
        <SwitchGroup
          label="Density"
          name={`${id}-density`}
          value={density}
          onChange={setDensity}
          options={[
            { value: "compact", label: "Compact" },
            { value: "default", label: "Default" },
            { value: "comfortable", label: "Roomy" },
          ]}
        />
        <SwitchGroup
          label="Text"
          name={`${id}-text`}
          value={text}
          onChange={setText}
          options={[
            { value: "100", label: "100%" },
            { value: "125", label: "125%" },
            { value: "150", label: "150%" },
            {
              value: "200",
              label: "200%",
              title:
                "WCAG 2.2 SC 1.4.4 requires content to remain usable at 200%.",
            },
          ]}
        />
        <SwitchGroup
          label="Status"
          name={`${id}-status`}
          value={status}
          onChange={setStatus}
          options={[
            { value: "none", label: "None" },
            ...CLINICAL_STATUSES.map((level) => ({
              value: level,
              label: CLINICAL_STATUS_META[level].word,
              title: CLINICAL_STATUS_META[level].sentence,
            })),
          ]}
        />
      </div>

      <div
        // `dark` is applied to the surface rather than to the document so that
        // one preview can be inspected in the other theme without flipping the
        // whole page. That is how you compare a contrast pair honestly.
        className={cn(
          "flex bg-background p-6",
          mode === "dark" && "dark",
          align === "center" ? "items-center justify-center" : "flex-col"
        )}
        data-density={density === "default" ? undefined : density}
        data-text-size={text === "100" ? undefined : text}
        data-status={status === "none" ? undefined : status}
        style={surfaceStyle}
      >
        {children ??
          (built && viewSrc ? (
            <iframe
              // Remounting on every URL change is what keeps the switches
              // instantaneous: assigning a new `src` to a live iframe pushes an
              // entry onto the reader's back history, so four switches would
              // turn one page into a dozen back-button presses.
              key={viewSrc}
              src={viewSrc}
              title={`${name} rendered under the opsinjs product theme`}
              loading="lazy"
              className="w-full border-0"
              // The frame is a viewport, not a canvas. It does not grow with the
              // text-size switch, because a real reader at 200% does not get a
              // taller screen either. They scroll, and seeing that happen is
              // the point of the demonstration.
              style={{ height: minHeight }}
            />
          ) : (
            <NotBuiltYet name={name} status={phase} className="w-full border-0" />
          ))}
      </div>

      {caption ? (
        // Inside the frame, on purpose. The band separates from the surface
        // with a hairline and sits on the neutral `muted` chrome fill, never on
        // a status tint, so it can name a Watch-carrying specimen as an
        // anti-pattern without a second status colour meeting the first on one
        // object. It is not the figure's `figcaption`: that element carries the
        // machine meta below, and a figure takes one.
        <div className="border-t border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {caption}
        </div>
      ) : null}

      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-3 py-1.5 text-[0.6875rem] text-muted-foreground">
        <span>
          {name ? <code className="text-[0.6875rem]">{name}</code> : "specimen"}{" "}
          · base <code className="text-[0.6875rem]">{resolved.base}</code> ·
          style <code className="text-[0.6875rem]">{resolved.style}</code>
        </span>
        {viewSrc ? (
          <a href={viewSrc} rel="noreferrer noopener" target="_blank">
            Open under the product theme
          </a>
        ) : null}
      </figcaption>
    </figure>
  )
}

/* --------------------------------------------------------------------------
   <IframePreview>
   -------------------------------------------------------------------------- */

export interface IframePreviewProps {
  name: string
  kind?: PreviewKind
  base?: string
  style?: string
  device?: Device
  height?: number
  /**
   * Mount the iframe. Off by default: framing a route with nothing in it
   * teaches a reader that previews are broken rather than that components are
   * unwritten, and a screen-scale frame is the one place on a page where that
   * mistake is largest. The target URL is shown either way.
   *
   * The default stays `false` even for a name that resolves. A screen page
   * decides for itself whether a 560px frame earns its place, and taking that
   * decision away from the page to save one attribute would be the wrong
   * trade. The page decides; it does not overrule `built`, so setting this on
   * a name that does not render yet still falls through to <NotBuiltYet>.
   */
  embed?: boolean
  /** Caption under the frame. */
  children?: ReactNode
  className?: string
  /**
   * Whether `name` resolves to something that really renders at `/view`. Set
   * by <IframePreview> in ./preview-server; a page never passes it.
   *
   * It does two things. It decides what the UNMOUNTED frame says, so a page
   * that has not opted in to `embed` does not go on claiming a built screen
   * does not exist. And it gates `embed`: asking for a frame around a route
   * that renders its own not-built state would nest one dashed box inside
   * another and move `data-opsinjs-not-implemented` inside an iframe, where
   * the page-level scrapers cannot see it. A page opts in to the frame; the
   * resolver decides whether there is anything to put in it.
   */
  built?: boolean
  /**
   * The catalogue row's release phase, resolved on the server alongside
   * `built` and never passed by a page.
   *
   * It reaches <NotBuiltYet>, whose visually-hidden sentence differs between
   * `considered` and `planned`: a `planned` id has a written specification and
   * the sentence warns that it may change, a `considered` id has none and the
   * sentence must not imply one. Without this the empty state on all 36
   * `considered` component pages announced a specification the page itself
   * denies two paragraphs above.
   */
  phase?: Status
}

/**
 * A chrome-less `/view/...` route embedded at a device width is the only place
 * on this site where the opsinjs product theme is visible, because product.css
 * and globals.css are loaded by two different root layouts and never meet.
 */
export function IframePreview({
  name,
  kind = "component",
  base = DEFAULT_BASE,
  style = DEFAULT_STYLE,
  device: initialDevice = "phone",
  height = 560,
  embed = false,
  children,
  className,
  built = false,
  phase,
}: IframePreviewProps) {
  const [device, setDevice] = useState<Device>(initialDevice)
  const [mode, setMode] = useState<PreviewMode>("light")
  const id = useId()
  const src = viewPath({ base, style, kind, name, mode })

  return (
    <figure
      data-opsinjs-preview={name}
      data-opsinjs-view-src={src}
      className={cn("not-prose my-6 border border-border", className)}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/60 px-3 py-2">
        <ViewportToolbar device={device} onDeviceChange={setDevice} />
        <SwitchGroup
          label="Theme"
          name={`${id}-mode`}
          value={mode}
          onChange={setMode}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
      </div>

      <div className="bg-muted/40 p-4">
        {embed && built ? (
          <DeviceFrame device={device} height={height}>
            <iframe
              key={src}
              src={src}
              title={`${name} rendered under the opsinjs product theme`}
              loading="lazy"
              className="h-full w-full border-0"
            />
          </DeviceFrame>
        ) : built ? (
          /* A deliberate no-marker branch. <NotBuiltYet> would carry
             `data-opsinjs-not-implemented` and the sr-only "does not exist in
             any released version" sentence, and both would be false: this page
             simply has not asked for the frame. Saying "not implemented" about
             something implemented is the same defect as the reverse, and it is
             the one an agent reading the markup would act on. */
          <DeviceFrame device={device} height={height}>
            <div
              role="note"
              className="flex h-full items-center justify-center border border-dashed border-border p-4 text-xs text-muted-foreground"
            >
              <p className="m-0">
                This page does not mount the frame. Open{" "}
                <code className="text-xs">{src}</code> to see{" "}
                <code className="text-xs">{name}</code> under the product theme
                rather than the documentation chrome.
              </p>
            </div>
          </DeviceFrame>
        ) : (
          <DeviceFrame device={device} height={height}>
            <NotBuiltYet name={name} status={phase} className="h-full border-0">
              This frame will embed <code className="text-xs">{src}</code>,
              which renders under the product theme rather than the
              documentation chrome. There is nothing at that address yet.
            </NotBuiltYet>
          </DeviceFrame>
        )}
      </div>

      <figcaption className="border-t border-border/60 px-3 py-1.5 text-[0.6875rem] text-muted-foreground">
        {children ?? (
          <>
            {DEVICES[device].label} · {DEVICES[device].width}px ·{" "}
            <code className="text-[0.6875rem]">{src}</code>
          </>
        )}
      </figcaption>
    </figure>
  )
}
