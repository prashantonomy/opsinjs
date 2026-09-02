"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Copy-to-clipboard for the interactive routes.
 *
 * The documentation corpus has its own `<CopyButton>` in the MDX vocabulary;
 * this is the plain one used by the colour browser, the token browser and the
 * three playground tools, none of which are MDX.
 *
 * Two details that matter more here than they look:
 *
 * 1. The confirmation is announced, not merely coloured. A tick that only
 *    changes shape is invisible to a screen-reader user and to anybody who has
 *    not noticed the button at all, so the state change goes through a live
 *    region as well.
 * 2. The label always says WHAT is being copied. "Copy" on a page with forty
 *    copy buttons is forty identically-named controls, which is a 2.4.6 problem
 *    and, more practically, a page nobody can navigate by voice.
 */
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string
  label: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused by permissions policy or an insecure
      // context. Failing silently would be a lie; the value stays selectable in
      // the page, so say nothing and let the user select it.
      setCopied(false)
    }
  }, [value])

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
    >
      {copied ? (
        <Check aria-hidden className="size-3.5" />
      ) : (
        <Copy aria-hidden className="size-3.5" />
      )}
      <span className="sr-only" role="status">
        {copied ? `Copied ${label}` : ""}
      </span>
    </button>
  )
}
