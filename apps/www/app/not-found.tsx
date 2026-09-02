import Link from "next/link"

import "./globals.css"
import { agentRoutes, registryRoutes, routes } from "@/lib/routes"

/**
 * The 404.
 *
 * WHY IT LIVES HERE AND NOT IN `(chrome)`. This was resolved empirically during
 * bootstrap, and the answer contradicts what you would guess. With two sibling
 * root layouts and no `app/layout.tsx`, Next uses `app/not-found.tsx` for the
 * global 404 and silently ignores `app/(chrome)/not-found.tsx` — it falls back
 * to its own built-in page instead. So this file stays at the top level.
 *
 * The cost is that it renders inside a Next-generated `<html>` that has no root
 * layout and, critically, no `lang` attribute. A site this insistent about
 * accessibility should not ship a 404 that fails WCAG 2.2 SC 3.1.1, so the
 * language is declared on the wrapper below, and the stylesheet is imported
 * here because there is no layout above to have imported it.
 *
 * WHAT A 404 IS FOR ON THIS SITE. Every other page here exists to stop an agent
 * inventing an API. A 404 is the one response that invites exactly that: ask an
 * assistant for `SymptomPicker`, let it hit a dead URL, and it will cheerfully
 * write you a component. So this page answers the question instead of shrugging
 * — it says what the three real causes are and where the definitive answer for
 * each one lives.
 */
export default function NotFound() {
  return (
    <div
      lang="en"
      className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-foreground antialiased"
    >
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
