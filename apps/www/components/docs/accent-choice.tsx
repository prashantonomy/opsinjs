"use client"

import { useSyncExternalStore, type CSSProperties } from "react"

import {
  ACCENTS,
  ACCENT_SWATCHES,
  ACCENT_THEMES,
  DEFAULT_ACCENT,
  DEFAULT_ACCENT_THEME,
} from "@/lib/generated/accents"
import { cn } from "@/lib/utils"

/* ==========================================================================
   accent-choice.tsx holds the reader's accent theme and accent for the
   documentation (ADR 0029), and the picker that changes them.

   ONE CHOICE FOR THE WHOLE SITE. Light and dark, density and text size are
   switched per preview, because comparing one specimen in two states is the
   point of those switches. An accent is a product's look rather than a state
   of one component, so it is chosen once and every preview and every showcase
   screen follows it, on this page and the next one.

   It is a per-reader convenience and nothing more, so it lives in this
   browser's storage, and every read and write is guarded: a private window, a
   blocked storage or a thumbnail capture renders the default theme and accent
   rather than failing.
   ========================================================================== */

export interface AccentChoice {
  theme: string
  accent: string
}

const STORAGE_KEY = "opsinjs-accent"
const DEFAULT_CHOICE: AccentChoice = { theme: DEFAULT_ACCENT_THEME, accent: DEFAULT_ACCENT }

const themeIds = new Set(ACCENT_THEMES.map((theme) => theme.id))
const accentIds = new Set(ACCENTS.map((accent) => accent.id))

let snapshot: AccentChoice = DEFAULT_CHOICE
let loaded = false
const listeners = new Set<() => void>()

function parse(raw: string | null): AccentChoice | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== "object" || value === null) return null
    const { theme, accent } = value as { theme?: unknown; accent?: unknown }
    if (typeof theme !== "string" || typeof accent !== "string") return null
    if (!themeIds.has(theme) || !accentIds.has(accent)) return null
    return { theme, accent }
  } catch {
    return null
  }
}

function read(): AccentChoice {
  if (loaded) return snapshot
  loaded = true
  try {
    snapshot = parse(window.localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_CHOICE
  } catch {
    snapshot = DEFAULT_CHOICE
  }
  return snapshot
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    loaded = false
    read()
    listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

export function setAccentChoice(next: AccentChoice): void {
  snapshot = next
  loaded = true
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* Storage is a convenience. The choice still holds for this page. */
  }
  for (const listener of listeners) listener()
}

/** The reader's choice, or the default until the browser has answered. */
export function useAccentChoice(): AccentChoice {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_CHOICE)
}

/**
 * The two query values a `/view` address carries for a choice, or nothing at
 * the default, so the canonical preview URL stays clean. The accent rides
 * whenever the choice is not the default pair, because each theme has its own
 * default accent and leaving it off would select that one instead.
 */
export function accentQuery(choice: AccentChoice): { accentTheme?: string; accent?: string } {
  const isDefault = choice.theme === DEFAULT_CHOICE.theme && choice.accent === DEFAULT_CHOICE.accent
  if (isDefault) return {}
  return {
    accentTheme: choice.theme === DEFAULT_CHOICE.theme ? undefined : choice.theme,
    accent: choice.accent,
  }
}

/** Stamp a choice on a framed document without reloading it. */
export function applyAccentChoice(root: HTMLElement | undefined | null, choice: AccentChoice): void {
  if (!root) return
  const query = accentQuery(choice)
  if (query.accentTheme) root.setAttribute("data-accent-theme", query.accentTheme)
  else root.removeAttribute("data-accent-theme")
  if (query.accent) root.setAttribute("data-accent", query.accent)
  else root.removeAttribute("data-accent")
}

const CHIP =
  "cursor-pointer rounded-full border border-border px-2.5 py-1 text-[0.6875rem] font-medium leading-4 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"

export interface AccentPickerProps {
  /** A unique prefix for the radio names, so two pickers on one page stay apart. */
  name: string
  className?: string
}

/**
 * The theme as three chips and the accent as nine swatches. Each is a real
 * radio group, so the arrow keys move the choice and a screen reader hears
 * "Accent theme" and "Accent" with the chosen option. A swatch is drawn in the
 * chosen theme's own fill for that accent, in the documentation's light or
 * dark, so the swatch is the colour the preview will show.
 */
export function AccentPicker({ name, className }: AccentPickerProps) {
  const choice = useAccentChoice()
  const swatches = ACCENT_SWATCHES[choice.theme] ?? {}

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}>
      <fieldset className="m-0 flex flex-wrap items-center gap-1 border-0 p-0">
        <legend className="sr-only">Accent theme</legend>
        <span aria-hidden="true" className="pr-0.5 text-[0.6875rem] text-muted-foreground">
          Accent
        </span>
        {ACCENT_THEMES.map((theme) => {
          const id = `${name}-theme-${theme.id}`
          const active = theme.id === choice.theme
          return (
            <span key={theme.id} className="contents">
              <input
                type="radio"
                className="peer sr-only"
                id={id}
                name={`${name}-theme`}
                checked={active}
                title={theme.summary}
                onChange={() => setAccentChoice({ theme: theme.id, accent: choice.accent })}
              />
              <label
                htmlFor={id}
                title={theme.summary}
                className={cn(
                  CHIP,
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {theme.label}
              </label>
            </span>
          )
        })}
      </fieldset>

      <fieldset className="m-0 flex flex-wrap items-center gap-1 border-0 p-0">
        <legend className="sr-only">Accent</legend>
        {ACCENTS.map((accent) => {
          const id = `${name}-accent-${accent.id}`
          const active = accent.id === choice.accent
          const swatch = swatches[accent.id]
          return (
            <span key={accent.id} className="contents">
              <input
                type="radio"
                className="peer sr-only"
                id={id}
                name={`${name}-accent`}
                checked={active}
                title={accent.label}
                onChange={() => setAccentChoice({ theme: choice.theme, accent: accent.id })}
              />
              <label
                htmlFor={id}
                title={accent.label}
                style={
                  {
                    "--swatch-light": swatch?.light,
                    "--swatch-dark": swatch?.dark,
                  } as CSSProperties
                }
                className={cn(
                  "relative flex size-6 cursor-pointer items-center justify-center rounded-full transition-transform peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                  active ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-110",
                )}
              >
                <span
                  aria-hidden="true"
                  className="size-full rounded-full bg-[var(--swatch-light)] shadow-[inset_0_0_0_1px_oklch(0_0_0/0.14)] dark:bg-[var(--swatch-dark)] dark:shadow-[inset_0_0_0_1px_oklch(1_0_0/0.18)] forced-colors:[background:CanvasText]"
                />
                <span className="sr-only">{accent.label}</span>
              </label>
            </span>
          )
        })}
      </fieldset>
    </div>
  )
}
