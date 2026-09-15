"use client"

import { useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import { CopyButton } from "@/app/_shared/copy-button"
import {
  colorFormatLabels,
  formatColor,
  readCustomProperty,
  toSrgbHex,
  type ColorFormat,
} from "@/app/_shared/css-color"
import { categories, statusLevels } from "@/app/_shared/axes"

/**
 * The two-axis ramp browser.
 *
 * HOW IT GETS ITS VALUES. It reads the custom properties off the live document
 * with `getComputedStyle`. It does not import a generated token map, and it does
 * not contain a single colour value.
 *
 * That is a deliberate choice with a real consequence: this page cannot drift.
 * `scripts/build-tokens.mts` rewrites `app/tokens.generated.css` from
 * `tokens/*.json`, the browser applies whatever that file says including the
 * Display-P3 escalation and the reduced-transparency and dark-mode overrides,
 * and this component reports what is actually in effect on the device you are
 * holding. A browser that imported the token JSON would show you the authored
 * value; this one shows you the resolved one, and on a system whose whole
 * argument is about gamut and contrast those are not the same thing.
 *
 * The cost is that values appear after hydration rather than in the HTML. That
 * is acceptable here, because the swatches themselves are painted by CSS and
 * are correct in the first frame; it is only the printed text of each value
 * that waits. The wait is why the table renders a neutral placeholder rather
 * than a guess.
 */

type TokenRow = {
  /** The custom property, e.g. `--opsin-status-urgent-surface`. */
  property: string
  /** Short label shown in the row. */
  role: string
  /** What the token is for, in one line. */
  use: string
}

type TokenGroup = {
  id: string
  title: string
  description: string
  /** Search terms beyond the token names themselves. */
  keywords: string
  rows: TokenRow[]
}

const STATUS_ROLES: Array<{ role: string; suffix: string; use: string }> = [
  {
    role: "surface",
    suffix: "surface",
    use: "The background of the thing carrying the verdict.",
  },
  {
    role: "line",
    suffix: "line",
    use: "Borders, indicators, chart marks, the dot in a pill.",
  },
  {
    role: "ink",
    suffix: "ink",
    use: "Text and icons drawn on the matching surface.",
  },
]

const CATEGORY_ROLES: Array<{ role: string; suffix: string; use: string }> = [
  {
    role: "accent",
    suffix: "accent",
    use: "Chart lines, glyphs, section identity. Never a verdict.",
  },
  {
    role: "surface",
    suffix: "surface",
    use: "A quiet tinted background for a section of one category.",
  },
  {
    role: "ink",
    suffix: "ink",
    use: "Text drawn on the matching category surface.",
  },
]

const GROUPS: TokenGroup[] = [
  {
    id: "status",
    title: "Status: how urgent it is",
    description:
      "Four levels, from steady to urgent. Bright colours, so they still read on a cheap screen in a bright room. Colour is never the only clue: a status always comes with a word, and an icon if there is room for one.",
    keywords: "urgency severity triage alert warning verdict clinical",
    rows: statusLevels.flatMap((level) =>
      STATUS_ROLES.map((role) => ({
        property: `--opsin-status-${level.id}-${role.suffix}`,
        role: `${level.label} · ${role.role}`,
        use: role.use,
      }))
    ),
  },
  {
    id: "category",
    title: "Category: what is being measured",
    description:
      "Heart, glucose, sleep, and the rest. These colours are dull on purpose. A category colour bright enough to look like an alert tells the reader something is wrong when nothing is, and that is the one mistake this colour system exists to stop.",
    keywords: "identity kind measurement heart glucose sleep steps weight",
    rows: categories.flatMap((category) =>
      CATEGORY_ROLES.map((role) => ({
        property: `--opsin-category-${category.id}-${role.suffix}`,
        role: `${category.label} · ${role.role}`,
        use: role.use,
      }))
    ),
  },
]

export function RampBrowser() {
  const [format, setFormat] = useState<ColorFormat>("var")
  const [query, setQuery] = useState("")
  const [resolved, setResolved] = useState<Record<string, string>>({})

  /**
   * Read every token, and read it again whenever the theme class changes. The
   * theme toggle in the header rewrites `class` on `<html>`; without the
   * observer the printed values would silently describe the previous theme
   * while the swatches beside them showed the new one. That would be a small
   * lie, on a page whose entire job is to be trustworthy about colour.
   */
  useEffect(() => {
    const read = () => {
      const next: Record<string, string> = {}
      for (const group of GROUPS) {
        for (const row of group.rows) {
          next[row.property] = readCustomProperty(row.property)
        }
      }
      setResolved(next)
    }

    read()

    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    })
    return () => observer.disconnect()
  }, [])

  const needle = query.trim().toLowerCase()

  const groups = useMemo(() => {
    if (!needle) return GROUPS
    return GROUPS.map((group) => ({
      ...group,
      rows: group.rows.filter(
        (row) =>
          row.property.includes(needle) ||
          row.role.toLowerCase().includes(needle) ||
          row.use.toLowerCase().includes(needle) ||
          group.keywords.includes(needle)
      ),
    })).filter((group) => group.rows.length > 0)
  }, [needle])

  return (
    <div>
      <div className="sticky top-14 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-card py-3">
        <label className="sr-only" htmlFor="ramp-search">
          Filter colour tokens
        </label>
        <input
          id="ramp-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by urgent, cardio, ink, border…"
          className="h-9 min-w-56 flex-1 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />

        <fieldset className="flex items-center gap-1">
          <legend className="sr-only">Copy format</legend>
          {(Object.keys(colorFormatLabels) as ColorFormat[]).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={format === option}
              onClick={() => setFormat(option)}
              className={cn(
                "h-9 rounded-md border px-3 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                format === option
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {colorFormatLabels[option]}
            </button>
          ))}
        </fieldset>
      </div>

      {format === "hex" ? (
        <p className="mt-4 rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
          Hex is an sRGB clamp produced by your browser, not an equivalent
          value. Several of these tokens are deliberately outside sRGB on a
          wide-gamut display; copying the hex gives you the fallback, which is a
          legitimate thing to want and a misleading thing to mistake for the
          token.
        </p>
      ) : null}

      {groups.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          No token matches “{query}”. Token names are lower-case and hyphenated.
          Try <code className="font-mono">urgent</code>,{" "}
          <code className="font-mono">ink</code> or{" "}
          <code className="font-mono">cardio</code>.
        </p>
      ) : null}

      {groups.map((group) => (
        <section
          key={group.id}
          className="mt-10"
          aria-labelledby={`group-${group.id}`}
        >
          <h2
            id={`group-${group.id}`}
            className="text-lg font-semibold tracking-tight"
          >
            {group.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {group.description}
          </p>

          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
            {group.rows.map((row) => {
              const authored = resolved[row.property] ?? ""
              const copyValue = authored
                ? formatColor(format, row.property, authored)
                : `var(${row.property})`
              const display =
                format === "var"
                  ? `var(${row.property})`
                  : format === "hex"
                    ? authored
                      ? (toSrgbHex(authored) ?? "not resolved")
                      : "not resolved"
                    : authored || "not resolved"

              return (
                <li
                  key={row.property}
                  className="flex items-center gap-3 bg-card p-3"
                >
                  <span
                    aria-hidden
                    className="size-9 shrink-0 rounded-md border border-border"
                    style={{ background: `var(${row.property})` }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {row.role}
                    </span>
                    <span className="block truncate font-mono text-xs text-muted-foreground">
                      {row.property}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      {row.use}
                    </span>
                  </span>
                  <span className="hidden max-w-64 min-w-0 shrink-0 sm:block">
                    <code className="block truncate font-mono text-xs text-muted-foreground">
                      {display}
                    </code>
                  </span>
                  <CopyButton value={copyValue} label={row.property} />
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
