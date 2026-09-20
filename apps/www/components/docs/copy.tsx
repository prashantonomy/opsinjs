"use client"

import {
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from "react"
import { Check, Copy, ExternalLink, FileText } from "lucide-react"
import { useCopyButton } from "fumadocs-ui/utils/use-copy-button"

import { docsMarkdownPath, docsPath } from "@/lib/routes"
import { cn } from "@/lib/utils"

/* ==========================================================================
   copy.tsx holds <CopyButton>, <PageActions> and <OpenInSandbox>.

   Every page on this site has a machine twin: `/docs/<slug>.md` serves the
   processed Markdown of the same page (next.config.mjs rewrites it onto the
   llms.mdx route). <PageActions> is the human-visible handle on that twin.
   One click copies it, opens it, or hands it to a model.

   That matters more here than on an ordinary documentation site. opsinjs is
   read by agents at least as often as by people, and an agent that has the
   page's Markdown does not have to infer an API from rendered HTML. Every
   not-implemented marker, every refusal, every "do not generate code against
   this" survives the round trip.

   The prompt handed to a model is deliberately a REQUEST TO READ, not a request
   to build: "Read <url>, I want to ask questions about it." Seeding a model
   with "implement this" against a page describing an unimplemented component is
   precisely the failure the whole scaffold is designed to prevent.
   ========================================================================== */

/**
 * True once the component has hydrated.
 *
 * `useSyncExternalStore` with a never-firing subscription is the sanctioned way
 * to ask "am I on the client yet" without pushing a boolean through an effect:
 * the server snapshot is `false`, the client snapshot is `true`, React swaps
 * them during hydration, and nothing calls setState inside an effect to make it
 * happen. Anything that has to read `window`, `document` or `CSS.supports`
 * during render is gated on it.
 */
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  )
}

/** A subscription that never fires. Module-level so its identity is stable. */
function subscribeNever(): () => void {
  return () => {}
}

export interface CopyButtonProps extends Omit<
  ComponentProps<"button">,
  "value"
> {
  /** The text to put on the clipboard. */
  value: string
  /** Visible label. Omit for an icon-only button. */
  label?: ReactNode
}

/**
 * Universal copy. Announces the result rather than only animating it: a
 * checkmark that fades is invisible to a screen-reader user, so the live region
 * carries the confirmation too.
 */
export function CopyButton({
  value,
  label,
  className,
  ...props
}: CopyButtonProps) {
  const [checked, onClick] = useCopyButton(() =>
    navigator.clipboard.writeText(value)
  )

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label={checked ? "Copied" : "Copy to clipboard"}
        className={cn(
          "inline-flex items-center gap-1.5 border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground",
          className
        )}
        {...props}
      >
        {checked ? (
          <Check aria-hidden="true" className="size-3.5" />
        ) : (
          <Copy aria-hidden="true" className="size-3.5" />
        )}
        {label}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {checked ? "Copied to clipboard" : ""}
      </span>
    </>
  )
}

/* --------------------------------------------------------------------------
   <PageActions>
   -------------------------------------------------------------------------- */

export interface PageActionsProps {
  /**
   * The page's docs slug, without a leading slash. The range-bar component
   * page has the slug "components/range-bar". Omit on the docs index.
   */
  slug?: string
  /** The docs version, carried into the model prompt. */
  version?: string
  className?: string
}

const PROMPT = (url: string) =>
  `Read ${url}, I want to ask questions about it. It documents a component that ` +
  `may not be implemented yet; check for the data-opsinjs-not-implemented marker ` +
  `before writing any code.`

/**
 * Copy Markdown · View as .md · Open in Claude / ChatGPT / Cursor.
 *
 * The absolute URL is resolved after mount, because it depends on the origin
 * the reader is actually on (localhost, a preview deployment, production) and
 * baking one in at build time would hand a model a link to the wrong site.
 */
export function PageActions({ slug, version, className }: PageActionsProps) {
  const isClient = useIsClient()
  const origin = isClient ? window.location.origin : ""

  const [markdown, setMarkdown] = useState<string | null>(null)
  const path = docsPath(slug)
  const mdPath = docsMarkdownPath(slug)
  const absolute = origin ? `${origin}${path}` : path
  const prompt = PROMPT(absolute)

  const [copied, onCopy] = useCopyButton(async () => {
    // Fetched once per page and kept, so a second copy is instant and does not
    // hit the .md route again.
    const text: string =
      markdown === null
        ? await fetch(mdPath).then((response) => response.text())
        : markdown
    setMarkdown(text)
    await navigator.clipboard.writeText(text)
  })

  const targets = [
    {
      label: "Claude",
      href: `https://claude.ai/new?${new URLSearchParams({ q: prompt })}`,
    },
    {
      label: "ChatGPT",
      href: `https://chatgpt.com/?${new URLSearchParams({ prompt, hints: "search" })}`,
    },
    {
      label: "Cursor",
      href: `https://cursor.com/link/prompt?${new URLSearchParams({ text: prompt })}`,
    },
  ]

  return (
    <div
      data-opsinjs-chrome=""
      data-print="hide"
      className={cn("not-prose flex flex-wrap items-center gap-1.5", className)}
    >
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-1.5 border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {copied ? (
          <Check aria-hidden="true" className="size-3.5" />
        ) : (
          <Copy aria-hidden="true" className="size-3.5" />
        )}
        Copy page as Markdown
      </button>

      <a
        href={mdPath}
        className="inline-flex items-center gap-1.5 border border-border px-2 py-1 text-xs text-muted-foreground no-underline hover:text-foreground"
      >
        <FileText aria-hidden="true" className="size-3.5" />
        View as .md
      </a>

      {targets.map((target) => (
        <a
          key={target.label}
          href={target.href}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 border border-border px-2 py-1 text-xs text-muted-foreground no-underline hover:text-foreground"
        >
          <ExternalLink aria-hidden="true" className="size-3.5" />
          Open in {target.label}
        </a>
      ))}

      {version ? (
        <span className="pl-1 text-[0.6875rem] text-muted-foreground">
          docs {version}
        </span>
      ) : null}

      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Page Markdown copied to clipboard" : ""}
      </span>
    </div>
  )
}

/* --------------------------------------------------------------------------
   <OpenInSandbox>
   -------------------------------------------------------------------------- */

export interface OpenInSandboxProps {
  /** The example id this sandbox would fork. */
  name?: string
  /**
   * `owner/repo/tree/branch/path` on GitHub. StackBlitz forks it directly.
   * Left unset on every page today, because the fork has to resolve to a
   * public repository and this one is not published yet; the component says so
   * instead of linking somewhere that 404s.
   */
  repoPath?: string
  /** The file StackBlitz should open first. */
  file?: string
  className?: string
}

/**
 * A forkable sandbox is the surveyed systems' most common omission, and the
 * thing a developer reaches for after reading two paragraphs.
 *
 * It is honest about the scaffold state. A sandbox that opens an empty project
 * is worse than a button that explains there is nothing to open yet, because
 * the first wastes a minute before the reader works it out.
 */
export function OpenInSandbox({
  name,
  repoPath,
  file,
  className,
}: OpenInSandboxProps) {
  if (!repoPath) {
    return (
      <p
        data-opsinjs-no-data="sandbox"
        className={cn(
          "not-prose my-3 text-xs text-muted-foreground",
          className
        )}
      >
        There is no sandbox for{" "}
        {name ? <code className="text-xs">{name}</code> : "this example"} yet.
        The source lives in <code className="text-xs">registry/examples/</code>{" "}
        and you can copy it from the block above; a fork link needs a public
        repository for StackBlitz to clone, and appears here automatically once
        there is one.
      </p>
    )
  }

  const href = `https://stackblitz.com/fork/github/${repoPath}${
    file ? `?file=${encodeURIComponent(file)}` : ""
  }`

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "not-prose inline-flex items-center gap-1.5 border border-border px-2 py-1 text-xs text-muted-foreground no-underline hover:text-foreground",
        className
      )}
    >
      <ExternalLink aria-hidden="true" className="size-3.5" />
      Fork this example
    </a>
  )
}
