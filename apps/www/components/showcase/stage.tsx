"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Monitor, Moon, Smartphone, Sun, Tablet } from "lucide-react"
import { useTheme } from "fumadocs-ui/provider/base"

import { useClientValue, useMediaQuery } from "@/app/_shared/use-client-value"
import { viewPath } from "@/lib/routes"
import { cn } from "@/lib/utils"

/* ==========================================================================
   stage.tsx defines <ShowcaseStage>, the whole of `/showcase/<slug>`: one
   screen, and a floating bar in the top right corner that switches the theme
   and the screen size.

   THE SCREEN IS FRAMED, AND THE FRAME IS WHAT MAKES THE SIZE SWITCH REAL. The
   kit's stylesheet, app/product.css, loads only under app/(view)/layout.tsx,
   so the screen renders at its `/view` route inside an iframe, as every
   preview on a documentation page does. A frame is also the only honest way
   to show a phone. Media queries, the medicines app's sticky tab bar and every
   sheet and dialog measure the viewport, and only a frame gives them a
   narrower one. A narrowed <div> would open a sheet across the whole window
   behind a phone-width app.

   SWITCHING NEVER RELOADS THE SCREEN. The frame's address is fixed when it
   first renders, in the theme the reader arrived in, so the screen paints in
   the right theme from the start. After that a theme change toggles the
   `dark` class on the framed document, which is the class `?mode=dark` sets
   before first paint, and a size change only moves the frame's edges.
   Assigning a new `src` would reload the screen and throw away whatever the
   reader had typed into it.

   THE THEME IS THE SITE'S. The bar reads and writes the preference the Theme
   row in the docs sidebar writes, through the provider app/(chrome)/layout.tsx
   mounts, so the bar, the backdrop and the screen always agree, and a reader
   who chose dark for the docs arrives at a dark screen.
   ========================================================================== */

type Mode = "light" | "dark"
type Size = "phone" | "tablet" | "desktop"

interface ChoiceOption<T extends string> {
  value: T
  label: string
  /** The tooltip, and the radio's accessible description. */
  title: string
  icon: typeof Monitor
}

const MODES: ChoiceOption<Mode>[] = [
  { value: "light", label: "Light", title: "Light theme", icon: Sun },
  { value: "dark", label: "Dark", title: "Dark theme", icon: Moon },
]

/**
 * Phone and Tablet are the widths <IframePreview> uses in
 * components/docs/preview.tsx, 390 and 744, at the heights of the same two
 * devices, so a frame has the proportions of a screen rather than of a strip.
 * Either one shrinks to fit a smaller window. Desktop is the whole window.
 */
const SIZES: Record<Size, { width?: number; height?: number }> = {
  phone: { width: 390, height: 844 },
  tablet: { width: 744, height: 1133 },
  desktop: {},
}

const SIZE_OPTIONS: ChoiceOption<Size>[] = [
  {
    value: "phone",
    label: "Phone",
    title: "Phone, 390 by 844",
    icon: Smartphone,
  },
  {
    value: "tablet",
    label: "Tablet",
    title: "Tablet, 744 by 1133",
    icon: Tablet,
  },
  {
    value: "desktop",
    label: "Desktop",
    title: "Desktop, the whole window",
    icon: Monitor,
  },
]

/**
 * A window narrower than this is already a phone, so the bar drops the size
 * switch and the screen fills the window. In pixels rather than rem on
 * purpose: a reader with large text set in the browser is no less able to
 * fit a phone frame on a wide window.
 */
const ROOM_FOR_SIZES = "(min-width: 640px)"

/** Module-level, so `useClientValue` sees the same function on every render. */
function inBrowser(): boolean {
  return true
}

/**
 * Put the framed document in a theme. The frame is same-origin, because its
 * address is a `/view` path on this site, so its document is reachable. Before
 * it has loaded there is nothing to change, and the frame's `onLoad` applies
 * the theme as soon as there is.
 */
function applyMode(frame: HTMLIFrameElement | null, mode: Mode): void {
  frame?.contentDocument?.documentElement.classList.toggle(
    "dark",
    mode === "dark"
  )
}

interface ChoiceProps<T extends string> {
  legend: string
  name: string
  /** Undefined until the value is known, so no option claims to be chosen. */
  value: T | undefined
  options: ChoiceOption<T>[]
  onChange: (value: T) => void
}

/**
 * One group of icon buttons that behaves as a radio group, because that is
 * what it is: exactly one option is chosen, and the arrow keys move the
 * choice. The inputs are visually hidden, so the focus ring is drawn on the
 * label of the focused one.
 *
 * The chosen option is marked by its fill alone, and a forced-colours theme
 * replaces every author fill, which would leave all the options alike. So the
 * chosen one repaints to the system `Highlight` pair and opts out of the
 * forcing, the repair `button.tsx` makes on its primary rung, and its focus
 * ring takes `CanvasText`, because opting out also stops the browser
 * recolouring the outline.
 */
function Choice<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: ChoiceProps<T>) {
  return (
    <fieldset className="m-0 flex items-center gap-0.5 border-0 p-0">
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => {
        const id = `${name}-${option.value}`
        const active = option.value === value
        const Icon = option.icon
        return (
          <span key={option.value} className="contents">
            <input
              type="radio"
              className="peer sr-only"
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
                "flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-ring forced-colors:peer-focus-visible:outline-[CanvasText]",
                active
                  ? "bg-foreground text-background forced-colors:[background-color:Highlight] forced-colors:[color:HighlightText] forced-colors:forced-color-adjust-none"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
              <span className="sr-only">{option.label}</span>
            </label>
          </span>
        )
      })}
    </fieldset>
  )
}

interface StageFrameProps {
  name: string
  title: string
  mode: Mode
  size: Size
}

/** The frame itself. Mounted once per screen, and never remounted by a switch. */
function StageFrame({ name, title, mode, size }: StageFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [src] = useState(() => viewPath({ kind: "screen", name, mode }))

  useEffect(() => {
    applyMode(frame.current, mode)
  }, [mode])

  const { width, height } = SIZES[size]

  return (
    <iframe
      ref={frame}
      src={src}
      title={title}
      onLoad={() => applyMode(frame.current, mode)}
      className={cn(
        "block bg-background",
        width ? "border border-border shadow-lg" : "size-full border-0"
      )}
      style={
        width
          ? { width, height, maxWidth: "100%", maxHeight: "100%" }
          : undefined
      }
    />
  )
}

export interface ShowcaseStageProps {
  /** The screen's file under `registry/screens/`, which names its `/view` route. */
  name: string
  /** The screen's title, for the page heading and the frame's accessible name. */
  title: string
}

/**
 * `/showcase/<slug>`: the screen and the bar.
 *
 * At Desktop the frame is the window. Below 1024px the frame starts under the
 * bar instead, because there a screen's own top row reaches as far right as the
 * bar does. The medicines app keeps its Demonstration badge and About button
 * there, and a bar over them would hide the marker that says the screen is a
 * demonstration. At Phone and Tablet the frame sits on a muted backdrop, under
 * the bar, at the device's size. On a window narrower than 640px the bar keeps
 * only the theme, because the window already is a phone.
 *
 * The frame mounts after hydration, because the theme it opens in is the
 * reader's stored preference, which the server cannot know.
 */
export function ShowcaseStage({ name, title }: ShowcaseStageProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const hydrated = useClientValue(inBrowser) === true
  /* The query answers null until the browser has answered, and null counts as
     room. A desktop window is the common case, and its bar then never changes
     shape after hydration. */
  const roomy = useMediaQuery(ROOM_FOR_SIZES) !== false
  const [chosen, setChosen] = useState<Size>("desktop")
  const id = useId()
  const mode: Mode = resolvedTheme === "dark" ? "dark" : "light"
  const size: Size = roomy ? chosen : "desktop"
  const framed = size !== "desktop"

  return (
    <main
      className={cn(
        "fixed inset-0 flex justify-center",
        framed
          ? "items-center bg-muted px-4 pt-16 pb-4"
          : "bg-background max-lg:pt-14"
      )}
    >
      <h1 className="sr-only">{title}</h1>

      <div className="fixed top-3 right-3 z-10 flex items-center gap-1 rounded-lg border border-border bg-background/90 p-1 shadow-lg backdrop-blur-sm">
        <Choice
          legend="Theme"
          name={`${id}-theme`}
          value={hydrated ? mode : undefined}
          options={MODES}
          onChange={setTheme}
        />
        {roomy ? (
          <>
            <span aria-hidden="true" className="h-5 w-px bg-border" />
            <Choice
              legend="Screen size"
              name={`${id}-size`}
              value={chosen}
              options={SIZE_OPTIONS}
              onChange={setChosen}
            />
          </>
        ) : null}
      </div>

      {hydrated ? (
        <StageFrame
          key={name}
          name={name}
          title={title}
          mode={mode}
          size={size}
        />
      ) : null}
    </main>
  )
}
