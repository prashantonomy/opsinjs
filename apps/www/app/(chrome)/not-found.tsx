import Link from "next/link"

import { getConsidered } from "@/lib/catalogue"
import { builtComponentCount } from "@/lib/registry"
import { agentRoutes, registryRoutes, routes } from "@/lib/routes"

/**
 * The 404 for anything below `(chrome)` — in practice every `notFound()` thrown
 * by a documentation route.
 *
 * WHY THIS FILE EXISTS SEPARATELY FROM `app/not-found.tsx`. Two sibling root
 * layouts and no `app/layout.tsx` means Next only uses `app/not-found.tsx` for
 * globally unmatched URLs. A `notFound()` thrown inside `(chrome)` looks for the
 * nearest not-found boundary instead, and without this file it fell through to
 * Next's built-in page: an empty server-rendered body, no `lang`, no title, with
 * the real copy painted only after hydration. This file renders inside the real
 * root layout, so it is server-rendered, styled, and reachable without JS — and
 * it carries its own `<title>`, because the root layout it renders inside
 * exports no metadata and a 404 with no title is announced by its URL.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16">
      <main className="w-full max-w-xl">
        <p className="font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
          There is no page at this address.
        </h1>
        <p className="mt-4 leading-relaxed text-pretty text-muted-foreground">
          That is a real answer, not a redirect to the home page. If you
          followed a link from somewhere on this site, it is a bug and worth
          reporting. Otherwise it is almost always one of three things.
        </p>

        <ol className="mt-8 space-y-5">
          <li>
            <h2 className="font-medium">
              You asked for a component that is only <em>considered</em>.
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Around thirty component ideas are recorded in the catalogue
              without a page, because a page here has to carry a real
              specification and those do not have one yet. The catalogue is the
              definitive list of what exists, what is planned and what was
              considered and set aside.
            </p>
            <p className="mt-2 text-sm">
              <Link
                className="underline underline-offset-4"
                href={routes.docs("components")}
              >
                Component catalogue and status matrix
              </Link>
            </p>
          </li>

          <li>
            <h2 className="font-medium">
              You asked for a component that does not exist at all.
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Nothing on this site is implemented yet — opsinjs is a token
              system and a set of specifications. If an assistant told you a
              component exists and sent you here, the honest answer is that it
              does not, and the roadmap says when it might.
            </p>
            <p className="mt-2 text-sm">
              <Link
                className="underline underline-offset-4"
                href={routes.docs("project", "roadmap")}
              >
                Roadmap
              </Link>
              <span className="text-muted-foreground"> · </span>
              <Link
                className="underline underline-offset-4"
                href={routes.docs("project", "state-of-the-system")}
              >
                State of the system
              </Link>
            </p>
          </li>

          <li>
            <h2 className="font-medium">The address is slightly wrong.</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Documentation URLs are all lower-case and hyphenated, with no
              version or language segment:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
                {/* Built rather than written out: the example URL stays correct
                    if the corpus ever gains a language segment, and the file
                    stays free of the literal the IA gate bans. */}
                {routes.docs("health", "alarm-fatigue")}
              </code>
              . Search is on every documentation page — press{" "}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.75em]">
                ⌘K
              </kbd>{" "}
              once you are on one.
            </p>
          </li>
        </ol>

        <nav
          aria-label="Recovery links"
          className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-6 text-sm"
        >
          <Link className="underline underline-offset-4" href={routes.home()}>
            Home
          </Link>
          <Link className="underline underline-offset-4" href={routes.docs()}>
            Documentation
          </Link>
          <Link
            className="underline underline-offset-4"
            href={routes.docs("components")}
          >
            Components
          </Link>
          <Link
            className="underline underline-offset-4"
            href={routes.playground()}
          >
            Playground
          </Link>
          <a className="underline underline-offset-4" href={agentRoutes.llms()}>
            llms.txt
          </a>
        </nav>

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          If you are an automated client: this response is a genuine 404. The
          catalogue at{" "}
          <code className="font-mono">{registryRoutes.index()}</code> is the
          machine-readable list of every component id and its status, and it
          will tell you that a component is unimplemented rather than leaving
          you to guess.
        </p>
      </main>
    </div>
  )
}
