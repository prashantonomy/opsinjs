"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { CopyButton } from "@/app/_shared/copy-button"
import {
  checkContrast,
  describeLc,
  describeRatio,
  type ContrastReading,
  type ContrastSize,
} from "@/app/_shared/contrast-client"
import { readCustomProperty, toSrgbHex } from "@/app/_shared/css-color"
import { statusLevels } from "@/app/_shared/axes"

/**
 * The contrast oracle.
 *
 * Both numbers, always. APCA Lc and the WCAG 2.2 ratio measure different things
 * and disagree in predictable places — most visibly on light text over a
 * mid-tone, where WCAG is generous and APCA is not. Showing one number would
 * mean choosing which audience to serve: the procurement questionnaire that asks
 * for 4.5:1, or the reader who has to make out a blood-pressure figure on a
 * phone in a corridor. This shows both and lets the disagreement be visible.
 *
 * The measurement is not computed here. It is a round trip to `/api/contrast`,
 * which is the same implementation `pnpm contrast` runs in CI. When that service
 * does not answer, the readout stays empty and says why.
 */

const SIZES: Array<{ id: ContrastSize; label: string; hint: string }> = [
  {
    id: "body",
    label: "Body text",
    hint: "The default. Anything a person reads a sentence of.",
  },
  {
    id: "large",
    label: "Large text",
    hint: "Headings and display numbers — a lower bar, deliberately.",
  },
  {
    id: "non-text",
    label: "Non-text",
    hint: "Borders, icons, chart marks, focus rings.",
  },
]

type TokenPair = {
  label: string
  foreground: string
  background: string
}

export function ContrastTool() {
  const [foreground, setForeground] = useState("#1f2933")
  const [background, setBackground] = useState("#ffffff")
  const [size, setSize] = useState<ContrastSize>("body")
  const [reading, setReading] = useState<ContrastReading | null>(null)
  const [state, setState] = useState<
    "idle" | "checking" | "ok" | "unavailable"
  >("idle")
  const [tokenPairs, setTokenPairs] = useState<TokenPair[]>([])

  /**
   * Quick picks built from the live token layer. This is the pairing that
   * actually matters in this system — status ink on its own status surface —
   * and having it one click away is what turns the tool from a generic colour
   * checker into something that answers questions about opsinjs.
   */
  useEffect(() => {
    const readTokenPairs = () => {
      const pairs: TokenPair[] = []
      for (const level of statusLevels) {
        const ink = toSrgbHex(
          readCustomProperty(`--opsin-status-${level.id}-ink`)
        )
        const surface = toSrgbHex(
          readCustomProperty(`--opsin-status-${level.id}-surface`)
        )
        if (ink && surface) {
          pairs.push({
            label: `${level.label} ink on ${level.label.toLowerCase()} surface`,
            foreground: ink,
            background: surface,
          })
        }
      }

      const bodyInk = toSrgbHex(readCustomProperty("--foreground"))
      const page = toSrgbHex(readCustomProperty("--background"))
      if (bodyInk && page) {
        pairs.push({
          label: "This page: body text on background",
          foreground: bodyInk,
          background: page,
        })
      }
      const muted = toSrgbHex(readCustomProperty("--muted-foreground"))
      if (muted && page) {
        pairs.push({
          label: "This page: secondary text on background",
          foreground: muted,
          background: page,
        })
      }

      setTokenPairs(pairs)
    }

    readTokenPairs()
  }, [])

  useEffect(() => {
    let cancelled = false

    const timer = setTimeout(async () => {
      setState("checking")
      const result = await checkContrast(foreground, background, size)
      if (cancelled) return
      if (result === null) {
        setReading(null)
        setState("unavailable")
        return
      }
      setReading(result)
      setState("ok")
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [foreground, background, size])

  const swap = useCallback(() => {
    setForeground(background)
    setBackground(foreground)
  }, [foreground, background])

  const cssSnippet = useMemo(
    () => `color: ${foreground};\nbackground-color: ${background};`,
    [foreground, background]
  )

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
      {/* ------------------------------------------------------------- */}
      <div className="space-y-6">
        <ColorField
          id="contrast-fg"
          label="Foreground"
          hint="The text, icon or mark."
          value={foreground}
          onChange={setForeground}
        />

        <div className="flex justify-center">
          <button
            type="button"
            onClick={swap}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowUpDown aria-hidden className="size-3.5" />
            Swap
          </button>
        </div>

        <ColorField
          id="contrast-bg"
          label="Background"
          hint="What it sits on."
          value={background}
          onChange={setBackground}
        />

        <fieldset>
          <legend className="text-sm font-medium">What is being drawn</legend>
          <div className="mt-2 space-y-2">
            {SIZES.map((option) => (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-md border border-border p-3 text-sm",
                  size === option.id && "border-foreground"
                )}
              >
                <input
                  type="radio"
                  name="contrast-size"
                  className="mt-1"
                  checked={size === option.id}
                  onChange={() => setSize(option.id)}
                />
                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">
                    {option.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {tokenPairs.length > 0 ? (
          <div>
            <h2 className="text-sm font-medium">Pairs from this system</h2>
            <ul className="mt-2 space-y-1">
              {tokenPairs.map((pair) => (
                <li key={pair.label}>
                  <button
                    type="button"
                    onClick={() => {
                      setForeground(pair.foreground)
                      setBackground(pair.background)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span
                      aria-hidden
                      className="flex size-5 shrink-0 items-center justify-center rounded border border-border text-[9px]"
                      style={{
                        background: pair.background,
                        color: pair.foreground,
                      }}
                    >
                      A
                    </span>
                    {pair.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* ------------------------------------------------------------- */}
      <div>
        <div
          className="rounded-lg border border-border p-8"
          style={{ background, color: foreground }}
        >
          <p className="text-3xl font-semibold tracking-tight">128 / 84</p>
          <p className="mt-1 text-sm">Blood pressure · recorded this morning</p>
          <p className="mt-5 max-w-md text-base leading-relaxed">
            This is body text at the pair you have chosen. Read it at
            arm&rsquo;s length, and then read it again on the worst screen you
            own — that is the condition the floor exists for.
          </p>
          <p className="mt-4 text-xs">
            Small print, a unit, a timestamp: the sizes that fail first.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Readout
            label="APCA"
            value={describeLc(reading?.apcaLc ?? null)}
            passes={reading?.apcaPasses ?? null}
            note="Lightness contrast. Signed: negative means light text on dark."
            state={state}
          />
          <Readout
            label="WCAG 2.2"
            value={describeRatio(reading?.wcag ?? null)}
            passes={reading?.wcagPasses ?? null}
            note="The ratio procurement questionnaires ask about."
            state={state}
          />
          <Readout
            label="Verdict"
            value={reading?.verdict ?? "—"}
            passes={null}
            note="Against the published opsinjs floor for this size."
            state={state}
          />
        </div>

        {/*
          The service's own prose, shown verbatim. When APCA and WCAG disagree —
          the common and interesting case — two numbers do not tell you what to
          do and this does. It is written by the endpoint rather than by this
          page so that the tool, the CI failure message and the generated
          conformance table all explain a disagreement the same way.
        */}
        {reading && reading.notes.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {reading.notes.map((note) => (
              <li
                key={note}
                className="rounded-md border border-border bg-muted/40 p-3 text-sm leading-relaxed"
              >
                {note}
              </li>
            ))}
          </ul>
        ) : null}

        {state === "unavailable" ? (
          <p className="mt-4 rounded-md border border-status-attention bg-status-attention-surface p-3 text-sm leading-relaxed text-status-attention-ink">
            The contrast service did not answer, so there is no measurement to
            show. Nothing here will estimate one — a plausible number from a
            broken tool is how a wrong figure ends up in a design review. If you
            are running this locally, check that the development server is up.
          </p>
        ) : null}

        <div className="mt-6 flex items-start gap-3 rounded-lg border border-border p-4">
          <pre className="min-w-0 flex-1 overflow-x-auto font-mono text-xs leading-relaxed">
            {cssSnippet}
          </pre>
          <CopyButton value={cssSnippet} label="the CSS declaration" />
        </div>
      </div>
    </div>
  )
}

function ColorField({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string
  label: string
  hint: string
  value: string
  onChange: (next: string) => void
}) {
  const hex = toSrgbHex(value) ?? "#000000"

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} colour picker`}
          value={hex}
          onChange={(event) => onChange(event.target.value)}
          className="size-10 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
        />
        <input
          id={id}
          type="text"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3 font-mono text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Any CSS colour: hex, <code className="font-mono">oklch()</code>,{" "}
        <code className="font-mono">color(display-p3 …)</code>, or a{" "}
        <code className="font-mono">var()</code> you have on the page.
      </p>
    </div>
  )
}

function Readout({
  label,
  value,
  passes,
  note,
  state,
}: {
  label: string
  value: string
  /** Null where the service expresses no pass/fail for this readout. */
  passes: boolean | null
  note: string
  state: "idle" | "checking" | "ok" | "unavailable"
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="flex items-center justify-between gap-2 text-xs tracking-wide text-muted-foreground uppercase">
        {label}
        {passes === null || state !== "ok" ? null : (
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-medium normal-case"
            style={{
              backgroundColor: passes
                ? "var(--opsin-status-steady-surface)"
                : "var(--opsin-status-urgent-surface)",
              color: passes
                ? "var(--opsin-status-steady-ink)"
                : "var(--opsin-status-urgent-ink)",
            }}
          >
            {passes ? "clears the floor" : "below the floor"}
          </span>
        )}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-xl",
          state === "checking" && "opacity-50",
          state === "unavailable" && "text-muted-foreground"
        )}
      >
        {state === "unavailable" ? "unavailable" : value}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {note}
      </p>
    </div>
  )
}
