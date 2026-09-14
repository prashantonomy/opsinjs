/**
 * TimelineEntry is one dated event on a vertical rail, and it is one entry
 * rather than the whole timeline.
 *
 * IT IS ONE ENTRY, NOT A TIMELINE, AND THAT IS THE WHOLE DESIGN. The catalogue
 * declined a full Timeline on purpose: a timeline is a layout, and every
 * product's timeline holds different things, so shipping one would ship a data
 * model with it. This renders a single list item and refuses to own the list,
 * its ordering, its filtering or its shape. The product supplies the `ol` or
 * `ul` around it and decides what an entry is.
 *
 * IT CARRIES NO CLINICAL VERDICT AND NO TINT. The marker and the connector are
 * neutral chrome, a muted fill and a hairline, and they take colour from
 * neither axis. Where the product supplies a `status` it is delegated to a
 * nested StatusPill, which carries the status axis with a word and a glyph the
 * way StatusPill always does. The entry around it stays neutral, because
 * tinting the whole entry would put a status colour on the record of an event
 * and leave a reader unable to tell it from a category tint, and it would drop
 * the word and the glyph that let a status survive greyscale.
 *
 * IT ASSERTS ONLY THAT AN EVENT WAS RECORDED AT A TIME. The event word handed
 * to the composed RelativeTime is `recorded`, and it is fixed rather than
 * configurable. A history records that something was written down at an
 * instant, which is what `recorded` means, and a surface that needs to tell a
 * measured reading apart from a synced one composes RelativeTime directly
 * instead of reaching through this component.
 *
 * IT READS NO CLOCK. `now` is required and is passed to RelativeTime, and this
 * component never calls `Date.now`, for the reasons RelativeTime states: a
 * component that read the clock itself would be impure and would read it once
 * per entry rather than once per screen, so a page of entries could straddle a
 * minute boundary and disagree with itself.
 *
 * IT DOES NOT FORWARD A LOCALE, AND THAT IS A STATED GAP. The prop list is
 * closed and has no `locale`, so the recorded time formats in the runtime's
 * default locale. A product that needs an explicit locale composes RelativeTime
 * itself. This is named on the page rather than papered over.
 *
 * IT IS A SERVER COMPONENT. No hooks, no state, no effects and no `typeof
 * window` branch, so there is nothing to hydrate and nothing to mismatch.
 */

import type { ReactNode } from "react"

import { isDevelopment, type ClinicalStatus } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"
import { RelativeTime } from "@/registry/base-lyra/ui/relative-time"
import { StatusPill } from "@/registry/base-lyra/ui/status-pill"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe a mistake a
 * consumer makes with the clinical API, and an empty title asserts nothing
 * clinical. `relative-time.tsx` keeps the same small channel for the same
 * reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

/**
 * The reference instant as an ISO 8601 string RelativeTime can parse.
 *
 * A Date or a number becomes a Z-form ISO string, which RelativeTime accepts. A
 * string is returned unchanged, so a caller who passes an ISO string with an
 * offset keeps it and RelativeTime applies its own strict rule to it. An
 * invalid number or Date falls through to a string RelativeTime will refuse and
 * render the date alone, rather than throwing during render.
 */
function toIsoInstant(now: Date | number | string): string {
  if (typeof now === "string") return now
  const date = now instanceof Date ? now : new Date(now)
  const ms = date.getTime()
  if (Number.isNaN(ms)) return String(now)
  return date.toISOString()
}

export interface TimelineEntryProps {
  /**
   * When the event was recorded, as ISO 8601 with an offset, for example
   * `2026-03-14T08:12:00+01:00`. It is handed to the composed RelativeTime as
   * its `at`, so the same contract applies: a timestamp with no offset is read
   * in whichever zone the code is running in and is refused rather than guessed
   * at, and a string that cannot be parsed renders no relative phrase.
   */
  when: string
  /**
   * The instant the recorded time is measured against, as a Date, a number of
   * milliseconds since the epoch, or an ISO 8601 string. Required, because this
   * component never reads the clock: a Date or a number is normalised to an ISO
   * string before it reaches RelativeTime, and a string is passed straight
   * through so RelativeTime applies its own offset rule. Read the clock once
   * where the screen is rendered and pass the same value to every entry on it.
   */
  now: Date | number | string
  /**
   * What happened, in the reader's words: `Repeat prescription issued`, `Blood
   * test booked`. Required. An empty title is reported in development and the
   * entry still renders, because the product owns its copy, but an entry with a
   * time and no event beside it is a marker on a rail that says nothing.
   */
  title: string
  /**
   * The body of the entry: any detail the product wants beneath the title. It
   * takes colour from neither axis and is the product's own content. Omit it
   * and the entry is a time and a title.
   */
  children?: ReactNode
  /**
   * The clinical status the product assigned to this event, from the
   * four-level union shared across the system. It is rendered as a nested
   * StatusPill beside the title, never as a tint on the entry, the rail or the
   * marker. It is an input the product owns and is never derived here. Omit it
   * and no pill is rendered. A value outside the four is refused by StatusPill
   * itself.
   */
  status?: ClinicalStatus
  /**
   * Whether this is the last entry, which stops the connector line below the
   * marker so the rail does not trail past the final event. Defaults to false.
   * The product sets it on the last item of the list it owns.
   */
  isLast?: boolean
  /**
   * Merged onto the root list item with `tailwind-merge`, last, so a
   * conflicting class passed here wins. The entry's own chrome is neutral by
   * design; a class that tints it is the caller's decision and the two colour
   * axes gate reads the component source rather than a caller override.
   */
  className?: string
}

export function TimelineEntry({
  when,
  now,
  title,
  children,
  status,
  isLast = false,
  className,
}: TimelineEntryProps) {
  if (title.trim() === "") {
    warnDev(
      "empty-title",
      "[opsinjs] TimelineEntry was given an empty title, so the entry shows a " +
        "recorded time with no event beside it. Pass the name of what happened. " +
        "The product owns the words, so the entry still renders.",
    )
  }

  const reference = toIsoInstant(now)

  return (
    <li data-slot="timeline-entry" className={cn("relative flex gap-opsin-3", className)}>
      {/* THE RAIL. Purely visual timeline chrome, hidden from assistive
          technology, so a screen reader meets the time, the title and the body
          and skips the drawing. Neutral only: a muted marker and a hairline
          connector, never a category or a status tint. */}
      <div
        data-slot="timeline-entry-rail"
        aria-hidden="true"
        className="relative flex flex-col items-center"
      >
        <span
          data-slot="timeline-entry-marker"
          className="mt-opsin-1 size-opsin-3 shrink-0 rounded-full border border-border bg-muted"
        />
        {isLast ? null : <span className="mt-opsin-1 w-px flex-1 bg-border" />}
      </div>

      {/* The content wrapper is unnamed, as range-bar has one; do not go
          looking for a data-slot on it. */}
      <div className="flex min-w-0 flex-1 flex-col gap-opsin-1 pb-opsin-4">
        <div
          data-slot="timeline-entry-time"
          className="text-opsin-footnote [color:var(--muted-foreground)]"
        >
          <RelativeTime at={when} event="recorded" now={reference} />
        </div>

        <div
          data-slot="timeline-entry-title"
          className="flex flex-wrap items-center gap-opsin-2 text-opsin-headline [color:var(--foreground)]"
        >
          <span>{title}</span>
          {status ? <StatusPill status={status} size="sm" /> : null}
        </div>

        {children == null ? null : (
          <div
            data-slot="timeline-entry-body"
            className="text-opsin-body [color:var(--muted-foreground)]"
          >
            {children}
          </div>
        )}
      </div>
    </li>
  )
}

/**
 * The instant the demo is measured against.
 *
 * A literal rather than a clock read, for the reason RelativeTime's own demo
 * gives: `now` is required of every caller, and a fixed instant makes this
 * deterministic and every number in it obviously synthetic (ADR 0012).
 */
const DEMO_NOW = "2026-03-14T11:12:00+00:00"

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is
 * public, reviewed code. It shows the one distinction worth seeing: three
 * entries share one rail with the connector stopping at the last, and the
 * middle one carries a status on a nested pill while the entry, its marker and
 * its rail stay neutral.
 *
 * `now` is a fixed instant so the demo says the same thing every render, and
 * every title and body is obviously synthetic (ADR 0012): no reading, no
 * number, no measurement a reader could mistake for their own.
 */
export default function TimelineEntryDemo() {
  return (
    <ol className="m-0 flex w-full max-w-md list-none flex-col p-0">
      <TimelineEntry when="2026-03-14T09:30:00+00:00" now={DEMO_NOW} title="Example note added">
        Written by the example app.
      </TimelineEntry>
      <TimelineEntry
        when="2026-03-12T18:00:00+00:00"
        now={DEMO_NOW}
        title="Example reminder set"
        status="watch"
      >
        Set by the example app.
      </TimelineEntry>
      <TimelineEntry
        when="2026-03-02T09:00:00+00:00"
        now={DEMO_NOW}
        title="Example entry recorded"
        isLast
      >
        Recorded by the example app.
      </TimelineEntry>
    </ol>
  )
}
