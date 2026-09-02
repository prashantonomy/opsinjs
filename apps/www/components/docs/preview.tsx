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
} from "@/lib/status"
import { cn } from "@/lib/utils"
import { NotBuiltYet } from "./stub"

/* ==========================================================================
   preview.tsx — <ComponentPreview>, <IframePreview>, <DeviceFrame>,
   <ViewportToolbar>.

   THE SWITCHES ARE NOT DECORATION. A20/B20 make theme, density, status and
   text size mandatory on every preview, because two pages
   (foundations/typography/dynamic-type and accessibility/text-resizing-and-zoom)
   promise a 200% Dynamic Type demonstration and a promise with no mechanism
   behind it is the kind of accessibility claim this site exists to stop making.

   Text size is a real font-size change on the preview surface, never a
   `transform: scale()`. Scaling makes a screenshot; changing the font size
   makes the layout reflow, wrap and truncate exactly as it does for somebody
   who has set 200% in their operating system — which is the only version of the
   demonstration that tells you anything.

   Density moves `--spacing` and nothing else. Tailwind v4 derives every spacing
   utility from that one custom property, so a container can re-scale its
   subtree without a single component knowing about density. Type size and touch
   targets deliberately do NOT move: "compact" must never quietly mean "harder
   to hit".

   TWO KINDS OF PREVIEW, AND THE DIFFERENCE MATTERS

   <ComponentPreview> renders in the page, under the DOCS chrome (lyra: square,
   dense, Inter). Cheap, indexable, printable, and honest about being an
   approximation.

   <IframePreview> embeds a `/view/...` route, which is a separate root layout
   with its own <html> and only product.css. That is the only way to see the
   opsinjs PRODUCT theme — squircle, platform UI font, generous — because the
   two stylesheets deliberately never meet. It is opt-in via `embed` while
   nothing is built, so a page never silently frames a route that has nothing
   in it; the target URL is printed either way so the reader can open it.
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
    <fieldset className="m-0 flex items-center gap-1 border-0 p-0">
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
                title={`${DEVICES[key].label} — ${DEVICES[key].width}px`}
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
   * real while no component exists. Omit it and the surface renders
   * <NotBuiltYet>, which is the honest state for all 24 component pages.
   */
  children?: ReactNode
  /** Centre the content, or let it fill. Health tiles want `start`. */
  align?: "center" | "start"
  /** Minimum height of the surface. */
  minHeight?: number
  className?: string
}

/**
 * The preview block on a component page.
 *
 * While nothing is built this renders <NotBuiltYet> inside the frame WITH the
 * switches still present and still working. That is deliberate: the page keeps
 * communicating its intended shape, the controls are exercised from day one
 * rather than bolted on later, and a reader can see that the mechanism exists
 * before the component does.
 */
export function ComponentPreview({
  name,
  base = DEFAULT_BASE,
  style = DEFAULT_STYLE,
  kind = "component",
  children,
  align = "center",
  minHeight = 220,
  className,
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
   * WIRING NOTE. When registry/__index__.ts stops being empty, the resolved
   * entry is looked up here — `getRegistryEntry(name, resolved.base,
   * resolved.style)` from lib/registry.ts — and its rendered `component`
   * replaces the <NotBuiltYet> below. That is the only change this file needs.
   * It is not imported today because the lookup returns null for every one of
   * the 24 ids, and the import would pull the whole generated index into the
   * client bundle of every documentation page for nothing.
   */

  const surfaceStyle: CSSProperties &
    Record<string, string | number | undefined> = {
    minHeight,
    fontSize: text === "100" ? undefined : `${text}%`,
    "--spacing": DENSITY_SPACING[density],
  }

  return (
    <figure
      data-opsinjs-preview={name ?? "unnamed"}
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
        // whole page — which is how you compare a contrast pair honestly.
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
        {children ?? <NotBuiltYet name={name} className="w-full border-0" />}
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-3 py-1.5 text-[0.6875rem] text-muted-foreground">
        <span>
          {name ? <code className="text-[0.6875rem]">{name}</code> : "specimen"}{" "}
          · base <code className="text-[0.6875rem]">{resolved.base}</code> ·
          style <code className="text-[0.6875rem]">{resolved.style}</code>
        </span>
        {name ? (
          <a
            href={viewPath({
              base: resolved.base,
              style: resolved.style,
              kind,
              name,
              mode,
              density: density === "default" ? undefined : density,
              text: Number(text) as 100 | 125 | 150 | 200,
            })}
            rel="noreferrer noopener"
            target="_blank"
          >
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
   * Mount the iframe. Off while nothing is built: framing a route with nothing
   * in it teaches a reader that previews are broken rather than that components
   * are unwritten. The target URL is shown either way.
   */
  embed?: boolean
  /** Caption under the frame. */
  children?: ReactNode
  className?: string
}

/**
 * A chrome-less `/view/...` route embedded at a device width — the only place
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
        {embed ? (
          <DeviceFrame device={device} height={height}>
            <iframe
              key={src}
              src={src}
              title={`${name} rendered under the opsinjs product theme`}
              loading="lazy"
              className="h-full w-full border-0"
            />
          </DeviceFrame>
        ) : (
          <DeviceFrame device={device} height={height}>
            <NotBuiltYet name={name} className="h-full border-0">
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
