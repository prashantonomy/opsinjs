"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * Two hooks for reading things only the browser knows.
 *
 * Several of the tools on this site have to ask the *device* a question: does
 * this engine support relative colour syntax, is this display wide-gamut, has
 * the reader asked for reduced motion. The obvious implementation is to read it
 * in an effect and push it into state. That is both a lint error under
 * `react-hooks/set-state-in-effect` and, more importantly, wrong: it renders one
 * answer on the server, a different one after hydration, and never notices when
 * the answer changes.
 *
 * `useSyncExternalStore` is the API for exactly this. It takes a server snapshot
 * (here: `null`, meaning "not known yet"), a client snapshot, and a subscription.
 * React uses the server snapshot for hydration and then switches, so there is no
 * mismatch, and a media query that changes while the page is open updates the UI
 * rather than going stale.
 *
 * Both hooks return `null` until the browser has answered, and every caller is
 * expected to render an honest "reading…" rather than a guess in that window.
 */

const NO_SUBSCRIPTION = () => () => {}

/**
 * A value that only exists in the browser and does not change afterwards, which
 * is essentially feature detection. Returns null during server rendering and
 * during hydration.
 *
 * `read` MUST return a primitive or a cached reference. Returning a fresh object
 * each call makes React re-render forever.
 */
export function useClientValue<T>(read: () => T): T | null {
  const getSnapshot = useCallback(() => read(), [read])
  return useSyncExternalStore<T | null>(
    NO_SUBSCRIPTION,
    getSnapshot,
    () => null
  )
}

/**
 * A media query, subscribed. Returns null until the browser has answered.
 *
 * Used for the environment readouts on the token browser: telling somebody that
 * the reduced-motion overrides are in effect is only useful if it keeps being
 * true when they toggle the setting and come back to the tab.
 */
export function useMediaQuery(query: string): boolean | null {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", onStoreChange)
      return () => list.removeEventListener("change", onStoreChange)
    },
    [query]
  )

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query]
  )

  return useSyncExternalStore<boolean | null>(
    subscribe,
    getSnapshot,
    () => null
  )
}
