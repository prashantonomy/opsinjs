"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react"

import { cn } from "@/lib/utils"
import { CopyButton } from "@/app/_shared/copy-button"
import {
  checkContrast,
  describeLc,
  type ContrastReading,
} from "@/app/_shared/contrast-client"
import { toSrgbHex } from "@/app/_shared/css-color"
import { useClientValue } from "@/app/_shared/use-client-value"

/**
 * The theme generator.
 *
 * WHAT IT DOES AND DOES NOT DO. Read this before trusting the output.
 *
 * The ramp is derived by the BROWSER, using CSS relative colour syntax:
 * `oklch(from var(--brand) <lightness> calc(c * <factor>) h)`. Each step keeps
 * your hue, scales your chroma, and pins a lightness. That is enough to show
 * the shape of a ramp. Because every step is then measured by the same contrast
 * service CI uses, it is also enough to show you where it stops being readable,
 * which is the question people actually come here with.
 *
 * It is NOT the shipped derivation. The colour engine does three further things
 * this tool cannot: it clamps chroma per hue so that steps stay inside the gamut
 * rather than being silently compressed by the display, it escalates into
 * Display-P3 where the display supports it without moving lightness, and it
 * assigns roles by APCA validation rather than by position in the ramp. Those
 * live in `lib/color/`, ship as `@opsinjs/color`, and are not published yet.
 *
 * The measurements below are real. The ramp is a preview. Both statements are on
 * the page, because a generator that lets you believe its output is the system's
 * output is worse than no generator.
 */

type Step = {
  /** Conventional ramp position. */
  name: string
  /** OKLCH lightness, pinned. */
  lightness: number
  /** Multiplier applied to the brand colour's own chroma. */
  chroma: number
}

/**
 * The preview ladder. These are the geometry of THIS TOOL, not tokens: the
 * shipped scale is derived per hue rather than pinned, which is exactly the
 * difference described above. Lightness falls monotonically; chroma peaks in
 * the middle, where the eye can carry the most saturation without the step
 * reading as a different hue.
 */
const STEPS: Step[] = [
  { name: "50", lightness: 0.985, chroma: 0.18 },
  { name: "100", lightness: 0.96, chroma: 0.3 },
  { name: "200", lightness: 0.92, chroma: 0.48 },
  { name: "300", lightness: 0.86, chroma: 0.66 },
  { name: "400", lightness: 0.78, chroma: 0.84 },
  { name: "500", lightness: 0.68, chroma: 1 },
  { name: "600", lightness: 0.58, chroma: 1 },
  { name: "700", lightness: 0.48, chroma: 0.9 },
  { name: "800", lightness: 0.38, chroma: 0.76 },
  { name: "900", lightness: 0.28, chroma: 0.6 },
  { name: "950", lightness: 0.2, chroma: 0.44 },
]

type Measured = {
  hex: string | null
  onWhite: ContrastReading | null
  onBlack: ContrastReading | null
}

const RELATIVE_COLOR_TEST = "oklch(from red l c h)"

function supportsRelativeColor(): boolean {
  return (
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("color", RELATIVE_COLOR_TEST)
  )
}

export function ThemeTool() {
  const [brand, setBrand] = useState("#2f6fd0")
  const [measured, setMeasured] = useState<Record<string, Measured>>({})
  const [measuring, setMeasuring] = useState(false)
  const [serviceDown, setServiceDown] = useState(false)
  const rampRef = useRef<HTMLOListElement>(null)

  /**
   * Feature detection, read through the browser rather than assumed. A browser
   * without relative colour syntax cannot derive the ramp, and the honest
   * response is to say so. It is not to fall back to an approximation the
   * reader would have no way of recognising as one.
   */
  const supported = useClientValue(supportsRelativeColor)

  /**
   * Read what the browser actually resolved each step to, then measure it.
   *
   * The read has to happen from the DOM rather than from arithmetic here: the
   * whole point of using relative colour syntax is that the engine does the
   * conversion, so the engine is the only thing that knows the answer.
   */
  const measure = useCallback(async () => {
    const container = rampRef.current
    if (!container) return

    const swatches = Array.from(
      container.querySelectorAll<HTMLElement>("[data-ramp-step]")
    )

    const hexes = swatches.map((swatch) => {
      const name = swatch.dataset.rampStep ?? ""
      const resolved = window.getComputedStyle(swatch).backgroundColor
      return { name, hex: toSrgbHex(resolved) }
    })

    setMeasuring(true)
    const results = await Promise.all(
      hexes.map(async ({ name, hex }) => {
        if (!hex) return [name, { hex, onWhite: null, onBlack: null }] as const
        const [onWhite, onBlack] = await Promise.all([
          checkContrast("#ffffff", hex, "body"),
          checkContrast("#111111", hex, "body"),
        ])
        return [name, { hex, onWhite, onBlack }] as const
      })
    )

    const next: Record<string, Measured> = {}
    let anyResult = false
    for (const [name, value] of results) {
      next[name] = value
      if (value.onWhite || value.onBlack) anyResult = true
    }
    setMeasured(next)
    setServiceDown(!anyResult)
    setMeasuring(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void measure()
    }, 450)
    return () => clearTimeout(timer)
  }, [brand, measure])

  const cssBlock = useMemo(() => {
    const lines = STEPS.map((step) => {
      const hex = measured[step.name]?.hex
      return `  --brand-${step.name}: ${hex ?? `oklch(from ${brand} ${step.lightness} calc(c * ${step.chroma}) h)`};`
    })
    return `:root {\n${lines.join("\n")}\n}`
  }, [measured, brand])

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <div className="space-y-5">
          <div>
            <label htmlFor="brand-colour" className="text-sm font-medium">
              Your brand colour
            </label>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              The one from the brand guidelines. That includes the one somebody
              has already told you is non-negotiable.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                aria-label="Brand colour picker"
                value={toSrgbHex(brand) ?? "#000000"}
                onChange={(event) => setBrand(event.target.value)}
                className="size-10 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
              />
              <input
                id="brand-colour"
                type="text"
                spellCheck={false}
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3 font-mono text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </div>
          </div>

          <div className="rounded-md border border-dashed border-border bg-muted/40 p-3">
            <p className="text-xs leading-relaxed">
              <strong className="font-medium">This is a preview ramp.</strong>{" "}
              Your browser derives it with relative colour syntax: same hue,
              scaled chroma, pinned lightness. The shipped engine additionally
              clamps chroma per hue, escalates into Display-P3 where the screen
              allows, and assigns roles by measurement rather than by position.
              That engine is not published yet.
            </p>
          </div>

          <div className="rounded-md border border-border p-3">
            <p className="text-xs leading-relaxed">
              <strong className="font-medium">
                The measurements are real.
              </strong>{" "}
              Every Lc figure beside a step comes from the contrast service.
              That service is the same implementation the build runs. Where it
              cannot answer, the cell stays empty.
            </p>
          </div>
        </div>

        <div>
          {supported === false ? (
            <p className="rounded-md border border-status-attention bg-status-attention-surface p-4 text-sm leading-relaxed text-status-attention-ink">
              This browser does not support CSS relative colour syntax, which is
              what derives the ramp. Nothing here will approximate it: the ramp
              would be wrong in a way you could not see. Chrome 119, Safari 16.4
              and Firefox 128 or newer all support it.
            </p>
          ) : (
            <ol
              ref={rampRef}
              className="divide-y divide-border overflow-hidden rounded-lg border border-border"
              style={{ "--brand": brand } as CSSProperties}
            >
              {STEPS.map((step) => {
                const result = measured[step.name]
                const white = result?.onWhite?.apcaLc ?? null
                const black = result?.onBlack?.apcaLc ?? null
                const preferWhite =
                  white !== null &&
                  black !== null &&
                  Math.abs(white) > Math.abs(black)

                return (
                  <li key={step.name} className="flex items-stretch">
                    <span
                      data-ramp-step={step.name}
                      className="flex w-40 shrink-0 items-center justify-center px-3 py-4 font-mono text-xs"
                      style={{
                        backgroundColor: `oklch(from var(--brand) ${step.lightness} calc(c * ${step.chroma}) h)`,
                        color: preferWhite ? "#ffffff" : "#111111",
                      }}
                    >
                      {step.name}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-1 bg-card px-4 py-3">
                      <code className="font-mono text-xs text-muted-foreground">
                        {result?.hex ?? "not resolved"}
                      </code>
                      <span
                        className={cn(
                          "font-mono text-xs",
                          preferWhite ? "font-medium" : "text-muted-foreground"
                        )}
                      >
                        white text {describeLc(white)}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-xs",
                          !preferWhite && black !== null
                            ? "font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        dark text {describeLc(black)}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ol>
          )}

          <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
            {measuring
              ? "Measuring every step…"
              : serviceDown
                ? "The contrast service did not answer. The ramp is still shown; no figure is estimated."
                : "Higher |Lc| is more readable. The emboldened column is the better text colour on that step."}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-border">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
          <h2 className="text-sm font-medium">Copyable CSS</h2>
          <CopyButton value={cssBlock} label="the ramp as CSS" />
        </div>
        <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
          {cssBlock}
        </pre>
      </div>
    </div>
  )
}
