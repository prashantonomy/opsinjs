"use client"

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import { CircleAlert } from "lucide-react"

import {
  apiRoutes,
  docsPath,
  editUrl,
  issueUrl,
  registryRoutes,
} from "@/lib/routes"
import { cn } from "@/lib/utils"
import { CopyButton } from "./copy"
import { NoDataYet } from "./stub"

/* ==========================================================================
   meta.tsx holds <BrowserSupport>, <VersionNotice>, <LastUpdated>, <Figure>,
   <PromptRecipe>, <EvalResult>, <RegistryItem>, <Feedback>.

   The page furniture: provenance, support, and the two components that exist
   because opsinjs is read by agents. Those two are <PromptRecipe> and
   <EvalResult>.

   <BrowserSupport> tests the READER'S browser rather than reciting a table.
   Four of the features this design system leans on are recent, and each has a
   documented degradation. The four are `backdrop-filter`, `corner-shape`,
   wide-gamut colour and `linear()` easing. A static support table tells you
   what was true when somebody typed it; `CSS.supports()` tells you what is true
   in the browser you are holding, which is the only version of the answer that
   settles an argument.
   ========================================================================== */

/* --------------------------------------------------------------------------
   <LastUpdated>
   -------------------------------------------------------------------------- */

export interface LastUpdatedProps {
  /** ISO date. Supplied by the route from the file's git timestamp. */
  date?: string
  /**
   * The source file's path relative to `content/docs`, e.g.
   * `components/range-bar.mdx`. When it is not supplied the path is derived
   * from the URL, which is right for every page whose slug matches its file.
   * That is every page, because fumadocs derives one from the other.
   */
  file?: string
  className?: string
}

/**
 * The page's last-modified stamp and its edit link.
 *
 * Deliberately separate from <Reviewed>. "Last edited" and "last reviewed by a
 * clinician" are different facts, and collapsing them lets a typo fix look like
 * a clinical sign-off.
 */
export function LastUpdated({ date, file, className }: LastUpdatedProps) {
  const pathname = usePathname()
  const relative =
    file ?? `${pathname.replace(/^\/docs\/?/, "") || "index"}.mdx`
  return (
    <p
      data-opsinjs-last-updated=""
      className={cn("not-prose mt-6 text-xs text-muted-foreground", className)}
    >
      {date ? `Page last edited ${date}. ` : null}
      <a href={editUrl(relative)} rel="noreferrer noopener" target="_blank">
        Edit this page
      </a>
    </p>
  )
}

/* --------------------------------------------------------------------------
   <Figure>
   -------------------------------------------------------------------------- */

export interface FigureProps {
  /** The caption. Say what the reader should notice, not what it is. */
  caption?: ReactNode
  children: ReactNode
  className?: string
}

export function Figure({ caption, children, className }: FigureProps) {
  return (
    <figure className={cn("not-prose my-6 border border-border", className)}>
      <div className="p-3">{children}</div>
      {caption ? (
        <figcaption className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

/* --------------------------------------------------------------------------
   <VersionNotice>
   -------------------------------------------------------------------------- */

export interface VersionNoticeProps {
  /** The version this page documents. */
  version: string
  /** The current version. */
  latest?: string
  /** Where the current page lives. */
  latestSlug?: string
  className?: string
}

/**
 * Warns a reader who has landed on an archived version.
 *
 * Search engines and models keep old URLs alive far longer than a project keeps
 * them accurate, and somebody following a two-year-old answer into a health
 * design system's docs should be told before they read a threshold that has
 * since changed.
 */
export function VersionNotice({
  version,
  latest,
  latestSlug,
  className,
}: VersionNoticeProps) {
  if (!latest || latest === version) return null
  return (
    <aside
      role="note"
      data-status="watch"
      className={cn("not-prose my-4 border-l-4 p-3 text-sm", className)}
      style={{
        borderColor: "var(--opsin-status-watch-line, var(--border))",
        background: "var(--opsin-status-watch-surface, var(--muted))",
        color: "var(--opsin-status-watch-ink, var(--foreground))",
      }}
    >
      You are reading the documentation for {version}. The current version is{" "}
      {latest}.{" "}
      {latestSlug ? (
        <a href={docsPath(latestSlug)}>Read the current page</a>
      ) : null}
    </aside>
  )
}

/* --------------------------------------------------------------------------
   <BrowserSupport>
   -------------------------------------------------------------------------- */

interface Feature {
  id: string
  label: string
  /** A `CSS.supports()` condition string. */
  test: string
  /** What opsinjs does when the answer is no. */
  degradation: string
}

const FEATURES: Feature[] = [
  {
    id: "backdrop-filter",
    label: "backdrop-filter",
    test: "backdrop-filter: blur(2px)",
    degradation:
      "Translucent material rungs fall back to their opaque colour. Layout is unchanged and the contrast floor is unchanged, because the fallback is the value the floor was measured against.",
  },
  {
    id: "corner-shape",
    label: "corner-shape (squircle)",
    test: "corner-shape: superellipse(4)",
    degradation:
      "A plain rounded rectangle at the same radius. A taste difference, never a functional one.",
  },
  {
    id: "p3",
    label: "Display-P3 colour",
    test: "color: color(display-p3 1 0 0)",
    degradation:
      "The sRGB ramp. The escalation only raises chroma and keeps hue and lightness identical. Every measured contrast figure therefore holds in both gamuts.",
  },
  {
    id: "linear",
    label: "linear() easing",
    test: "transition-timing-function: linear(0, 0.5 50%, 1)",
    degradation:
      "The browser's default easing. A spring is one custom property holding one linear() value, so there is no cubic-bezier approximation behind it: the declaration that substitutes it is invalid at computed-value time and the timing function is lost. Identical duration and identical end state; the curve is what goes.",
  },
  {
    id: "has",
    label: ":has()",
    test: "selector(:has(*))",
    degradation:
      "The status matrix filter and a handful of docs-only affordances stop filtering and show every row. Nothing in the product theme depends on it.",
  },
]

/**
 * Feature support is a property of the browser, not of this component, and it
 * cannot change while the page is open. It is therefore computed ONCE, cached
 * at module scope so `getSnapshot` returns a stable reference, and read through
 * `useSyncExternalStore`. That hook gives a `null` server snapshot, a real
 * client snapshot, and no setState inside an effect.
 */
let supportCache: Record<string, boolean> | null = null

function subscribeNever(): () => void {
  return () => {}
}

function supportSnapshot(): Record<string, boolean> {
  if (supportCache) return supportCache
  const next: Record<string, boolean> = {}
  for (const feature of FEATURES) {
    try {
      next[feature.id] = CSS.supports(feature.test)
    } catch {
      next[feature.id] = false
    }
  }
  supportCache = next
  return next
}

export interface BrowserSupportProps {
  /** Restrict to specific feature ids. */
  only?: string[]
  className?: string
}

export function BrowserSupport({ only, className }: BrowserSupportProps) {
  const results = useSyncExternalStore(
    subscribeNever,
    supportSnapshot,
    () => null
  )

  const rows = only ? FEATURES.filter((f) => only.includes(f.id)) : FEATURES

  return (
    <div className={cn("not-prose my-4 overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th scope="col" className="py-2 pr-4 font-medium">
              Feature
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Your browser
            </th>
            <th scope="col" className="py-2 font-medium">
              What happens without it
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((feature) => (
            <tr
              key={feature.id}
              className="border-b border-border/60 align-top"
            >
              <th
                scope="row"
                className="py-2 pr-4 text-left font-mono text-xs font-normal"
              >
                {feature.label}
              </th>
              <td className="py-2 pr-4">
                {results === null
                  ? "Checking…"
                  : results[feature.id]
                    ? "Supported"
                    : "Not supported"}
              </td>
              <td className="py-2 text-muted-foreground">
                {feature.degradation}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">
        Tested live with <code className="text-xs">CSS.supports()</code> in the
        browser you are reading this in. Nothing here is a claim about a browser
        matrix somebody maintained by hand.
      </p>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <RegistryItem>
   -------------------------------------------------------------------------- */

export interface RegistryItemProps {
  name: string
  className?: string
}

/**
 * The live registry-item.json beside the documentation, so that what the CLI
 * would install and what the page describes can be compared without leaving the
 * page. Fetched at runtime rather than inlined, because the point is that it is
 * the same bytes the CLI receives.
 */
export function RegistryItem({ name, className }: RegistryItemProps) {
  const [state, setState] = useState<"loading" | "missing" | "ok">("loading")
  const [json, setJson] = useState<string>("")

  useEffect(() => {
    let cancelled = false
    fetch(registryRoutes.item(name))
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: unknown) => {
        if (cancelled) return
        setJson(JSON.stringify(data, null, 2))
        setState("ok")
      })
      .catch(() => {
        if (!cancelled) setState("missing")
      })
    return () => {
      cancelled = true
    }
  }, [name])

  if (state === "missing") {
    return (
      <NoDataYet
        what={`The registry item for ${name}`}
        script="scripts/build-registry.mts"
        className={className}
      >
        <code className="text-xs">/r/{name}.json</code> did not resolve, which
        is not the same as saying the component is unbuilt: every id in{" "}
        <code className="text-xs">registry/catalogue.ts</code> answers, and one
        with no code answers with{" "}
        <code className="text-xs">meta.opsinjs.implemented: false</code>. So
        either no row uses this id, or the request itself failed.
      </NoDataYet>
    )
  }

  return (
    <div className={cn("not-prose my-4 border border-border", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
        <code className="text-xs">/r/{name}.json</code>
        <CopyButton value={json} />
      </div>
      <pre className="m-0 max-h-80 overflow-auto p-3 text-xs">
        {state === "loading" ? "Loading…" : json}
      </pre>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <PromptRecipe> and <EvalResult>
   -------------------------------------------------------------------------- */

export interface PromptRecipeProps {
  /** What the reader is trying to get a model to do. */
  task: string
  /** The prompt, copyable verbatim. */
  prompt: string
  /** What a correct answer looks like. Behaviour, not exact wording. */
  expected?: ReactNode
  className?: string
}

/**
 * A prompt worth copying, with the behaviour a correct answer shows.
 *
 * `expected` describes behaviour rather than pasting a model's output, because
 * a pasted answer becomes a target: the next reader compares word by word and
 * concludes the model is wrong when it is merely different. What matters is
 * whether it noticed that the component is not implemented.
 */
export function PromptRecipe({
  task,
  prompt,
  expected,
  className,
}: PromptRecipeProps) {
  return (
    <div className={cn("not-prose my-6 border border-border", className)}>
      <p className="m-0 border-b border-border/60 px-3 py-2 text-sm font-medium">
        {task}
      </p>
      <div className="p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Prompt</span>
          <CopyButton value={prompt} label="Copy" />
        </div>
        <pre className="m-0 overflow-x-auto bg-muted/40 p-2 text-xs whitespace-pre-wrap">
          {prompt}
        </pre>
      </div>
      {expected ? (
        <div className="border-t border-border/60 p-3 text-sm">
          <p className="m-0 mb-1 text-xs text-muted-foreground">
            A correct answer
          </p>
          <div className="[&>p]:m-0 [&>p+p]:mt-2">{expected}</div>
        </div>
      ) : null}
    </div>
  )
}

export interface EvalResultProps {
  /** The eval task id, as it appears in skills/opsinjs/evals/evals.json. */
  task: string
  /** Score 0 to 1. */
  score?: number
  /** ISO date the score was produced. */
  date?: string
  /**
   * The model a score is attributed to, when it is attributed to one at all.
   *
   * `scripts/run-evals.mts` produces no such score: it scores the CORPUS. What
   * it measures is whether the page an agent would need exists, at the address
   * it would guess, still saying the thing it exists to say. Its payload
   * records `"scored": "the opsinjs documentation corpus, not a model"`. So a
   * run-evals number arrives here with no model and renders "model not
   * recorded", which is the honest label. The prop exists for a hand-entered
   * score that DID come from one model on one day, where naming it is the
   * difference between a measurement and a rumour.
   */
  model?: string
  className?: string
}

/**
 * The current dated score for one eval task.
 *
 * Model and date are shown next to every score because a bare percentage is not
 * a fact about opsinjs. It is a fact about one corpus, or one model, on one
 * day, and the same documentation will score differently next month without
 * anybody touching it.
 *
 * NOTHING READS THE SCORES YET. `scripts/run-evals.mts` writes
 * `public/r/evals.json` and this component takes `score` as a prop, so a suite
 * that passed and a suite nobody ran are indistinguishable on the page. Closing
 * that needs three files moving together. The three are a route in
 * `lib/routes.ts`, the read here, and the paragraph plus `<Todo>` on
 * `content/docs/agents/evals.mdx` that currently describe the gap correctly.
 * That is not something this component can fix on its own, and the honest
 * absence below is what stands until it does.
 */
export function EvalResult({
  task,
  score,
  date,
  model,
  className,
}: EvalResultProps) {
  if (score === undefined) {
    return (
      <NoDataYet
        what={`The eval score for ${task}`}
        script="scripts/run-evals.mts"
        command="pnpm run evals"
        className={className}
      >
        Evals are run on demand, not in the P0 build. A score printed here that
        nobody ran would be the exact failure this site is built to prevent.
      </NoDataYet>
    )
  }

  return (
    <div
      className={cn(
        "not-prose my-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 border border-border p-3",
        className
      )}
    >
      <code className="text-xs">{task}</code>
      <span className="font-mono text-lg">{Math.round(score * 100)}%</span>
      <span className="text-xs text-muted-foreground">
        {model ? `${model}` : "model not recorded"}
        {date ? ` · ${date}` : null}
      </span>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <Feedback>
   -------------------------------------------------------------------------- */

export interface FeedbackProps {
  /** The docs version, carried into the report so a bug can be located. */
  version?: string
  className?: string
}

/**
 * Was this useful, and report a problem. Both are prefilled with the page path
 * and the docs version.
 *
 * The GitHub link is not a fallback bolted on afterwards; it is the guaranteed
 * path. `/api/feedback` may be unavailable, may be rate-limited, or may not be
 * deployed at all on a fork, and a feedback control that silently swallows a
 * report is worse than no feedback control. So the issue link is always
 * offered, prefilled, whatever the API does.
 */
export function Feedback({ version, className }: FeedbackProps) {
  const pathname = usePathname()
  const [sent, setSent] = useState<"idle" | "sending" | "thanks" | "failed">(
    "idle"
  )

  const send = (useful: boolean) => {
    setSent("sending")
    fetch(apiRoutes.feedback(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: pathname, useful, version }),
    })
      .then((response) => setSent(response.ok ? "thanks" : "failed"))
      .catch(() => setSent("failed"))
  }

  const reportUrl = issueUrl({
    title: `Docs: ${pathname}`,
    page: pathname,
    version,
  })

  return (
    <div
      data-opsinjs-chrome=""
      data-print="hide"
      className={cn(
        "not-prose mt-8 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-sm",
        className
      )}
    >
      <span className="text-muted-foreground">Was this page useful?</span>
      <button
        type="button"
        onClick={() => send(true)}
        disabled={sent === "sending"}
        className="border border-border px-2 py-1 text-xs hover:bg-muted"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => send(false)}
        disabled={sent === "sending"}
        className="border border-border px-2 py-1 text-xs hover:bg-muted"
      >
        No
      </button>
      <a
        href={reportUrl}
        rel="noreferrer noopener"
        target="_blank"
        className="border border-border px-2 py-1 text-xs no-underline hover:bg-muted"
      >
        Report a problem
      </a>

      <span
        role="status"
        aria-live="polite"
        className="text-xs text-muted-foreground"
      >
        {sent === "thanks" ? "Thank you." : null}
        {sent === "failed" ? (
          <span className="inline-flex items-center gap-1">
            <CircleAlert aria-hidden="true" className="size-3.5" />
            That did not send. The report-a-problem link still works.
          </span>
        ) : null}
      </span>
    </div>
  )
}
