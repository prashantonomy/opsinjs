"use client"

/**
 * `no-matches` is the empty state whose whole job is to say that the data is
 * still there.
 *
 * This is the one reason a reader can be actively misled by. A list that goes
 * blank after a filter looks identical to a list that has nothing in it, and a
 * reader who concludes their readings have gone missing is not being
 * unreasonable. So the body names the filter as the cause and the primary
 * action removes it. Nothing here says the absence is reassuring, because for
 * `no-matches` the absence is not even real.
 *
 * It is also the example that shows the client boundary. `onSelect` is a
 * function, functions do not cross the server/client boundary, so the surface
 * that owns the filter is a client component and EmptyState joins its graph.
 * The component itself carries no `"use client"` directive; this file does.
 *
 * THE TWO THINGS THIS EXAMPLE OWNS THAT THE COMPONENT WILL NOT DO FOR IT, and
 * the reason this file is longer than an empty state needs to be.
 *
 * The first is the announcement. `patterns/empty-and-first-use` requires a
 * status message when a filter change empties a view, which is SC 4.1.3, and
 * EmptyState deliberately mounts no live region: a `role="status"` inside the
 * component would speak on every keystroke of a search field and speak twice
 * wherever the caller had already done the right thing. So the region that
 * changed owns it, and the region that changed is this list. The live region
 * below is a sibling of the thing it describes, it starts empty so nothing is
 * announced on first paint, and it is written once per activation rather than
 * once per render.
 *
 * The second is focus. Clearing the filter unmounts the EmptyState, and the
 * EmptyState contains the very button the reader pressed. Without this,
 * `document.activeElement` falls to `<body>`, a keyboard user loses their
 * place, and a screen-reader user's virtual cursor is thrown to the top of the
 * document. The list is given `tabIndex={-1}` and takes focus when the empty
 * state's own action brings it back, which puts the reader at the thing they
 * asked for. A filter chip does not move focus, because the chip survives the
 * change and a reader may be about to press the next one. Nothing here moves
 * focus on appearance, which is the rule EmptyState itself follows.
 *
 * opsinjs ships no announcement helper, and `accessibility/screen-readers`
 * lists that as a known gap. This is therefore what the caller's half of the
 * contract looks like written out by hand.
 */

import { useEffect, useRef, useState } from "react"

import { EmptyState } from "@/registry/base-lyra/ui/empty-state"

/* Deliberately fictional and deliberately numberless. A screenshot of an
   opsinjs example must not be mistakable for somebody's own list of results. */
const ROWS = [
  { id: "first", label: "First example measurement", tag: "sample" },
  { id: "second", label: "Second example measurement", tag: "sample" },
  { id: "third", label: "Third example measurement", tag: "other" },
]

const TAGS = ["sample", "other", "missing"]

export default function EmptyStateAFilterMatchedNothing() {
  const [tag, setTag] = useState("missing")
  const [announcement, setAnnouncement] = useState("")
  /* Not a boolean: the reader can clear the filter twice, and a flag that is
     already `true` would not re-run the effect. A counter changes every time. */
  const [returns, setReturns] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const rows = ROWS.filter((row) => row.tag === tag)

  useEffect(() => {
    if (returns === 0) return
    listRef.current?.focus()
  }, [returns])

  /* One handler for both controls, so the announcement cannot describe one
     state while the list shows another. It says what the list holds now, in
     words, and it never characterises the absence.

     `fromEmptyState` is what keeps the focus move honest. Focus is moved only
     when the control that was holding it is about to be unmounted, which is
     true of the empty state's action and false of the filter chips. A chip
     that yanked focus into the list would take it away from a reader who was
     about to try a different filter. */
  function applyTag(next: string, fromEmptyState = false) {
    const matched = ROWS.filter((row) => row.tag === next)
    setTag(next)
    setAnnouncement(
      matched.length === 0
        ? `No readings match the filter ${next}. Your readings are still here.`
        : `Showing the readings that match the filter ${next}.`,
    )
    if (fromEmptyState && matched.length > 0) setReturns((count) => count + 1)
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-opsin-4">
      <div className="flex flex-wrap gap-opsin-2">
        {TAGS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => applyTag(option)}
            aria-pressed={tag === option}
            className="min-h-(--opsin-target-minimum,2.75rem) rounded-opsin-md border border-border bg-card px-opsin-3 text-opsin-subheadline aria-pressed:bg-muted"
          >
            {option}
          </button>
        ))}
      </div>

      {/* Polite, atomic and permanently mounted. A region created at the moment
          it has something to say is often missed, because the assistive
          technology has to notice the node before it notices the text in it. */}
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>

      {rows.length > 0 ? (
        <ul
          ref={listRef}
          tabIndex={-1}
          className="m-0 flex list-none flex-col gap-opsin-2 p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label="Example measurements"
        >
          {rows.map((row) => (
            <li
              key={row.id}
              className="border-b border-border py-opsin-2 text-opsin-body"
            >
              {row.label}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          reason="no-matches"
          title="No readings match this filter"
          titleLevel={3}
          action={{
            label: "Clear the filter",
            onSelect: () => applyTag("sample", true),
          }}
        >
          Your readings are still here. The filter you have applied does not
          match any of them, so the list has nothing to show while it is on.
        </EmptyState>
      )}
    </div>
  )
}
