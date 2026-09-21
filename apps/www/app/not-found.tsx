import Link from "next/link"

import "./not-found.css"
import { agentRoutes, registryRoutes, routes } from "@/lib/routes"

/**
 * The GLOBAL 404 is served for URLs that match no route at all.
 *
 * WHY IT LIVES HERE AND NOT IN `(chrome)`. With two sibling root layouts and no
 * `app/layout.tsx`, Next uses `app/not-found.tsx` for globally unmatched URLs
 * and silently ignores a group-local one for that case. So this file has to stay
 * at the top level. `notFound()` thrown *inside* `(chrome)` is a different case
 * and is handled by `app/(chrome)/not-found.tsx`, which renders fully chromed.
 *
 * WHY IT IMPORTS ITS OWN STYLESHEET. As the global error boundary, whatever this
 * file imports is pulled into every route's chunk graph. While it imported
 * `globals.css`, every `/view/*` preview shipped a preload for the 177 kB docs
 * stylesheet. That preload falsified the isolation the preview routes exist to
 * provide. `not-found.css` is ~40 lines of plain CSS with no Tailwind layer
 * behind it.
 *
 * It also renders inside a Next-generated `<html>` with no root layout and so no
 * `lang` attribute, which is why the language is declared on the wrapper below:
 * a site this insistent about accessibility should not ship a 404 that fails
 * WCAG 2.2 SC 3.1.1. The `lang` cannot reach `<html>` from here at all, because
 * there is no layout in which to set it. The wrapper is therefore all that is
 * available, and it is stated as a limit rather than as a fix. The `<title>`
 * below is the same situation with a different ending: React hoists it into the
 * head, so SC 2.4.2 is genuinely satisfied rather than approximated.
 *
 * WHAT A 404 IS FOR ON THIS SITE. Every other page here exists to stop an agent
 * inventing an API. A 404 is the one response that invites exactly that: ask an
 * assistant for `SymptomPicker`, let it hit a dead URL, and it will cheerfully
 * write you a component. So this page answers the question instead of
 * shrugging. It says what the two real causes are and where the definitive
 * answer for each one lives.
 */
export default function NotFound() {
  return (
    <div lang="en" className="nf-root">
      {/* Rendered in the tree rather than exported as `metadata`, because the
          Metadata API is collected from `layout` and `page` segments only and
          this file is neither. With no root layout above it, there is no layout
          here to carry a title either. React hoists a <title> rendered anywhere
          into the document head, which is the only way this file can have one.
          WCAG 2.2 SC 2.4.2: a page with no title is announced by its URL, and a
          URL is what the reader already could not make sense of. */}
      <title>Page not found · opsinjs</title>
      <main className="nf-main">
        <p className="nf-eyebrow">404</p>
        <h1 className="nf-title">There is no page at this address.</h1>
        <p className="nf-lede">
          That is a real answer, not a redirect to the home page. If you followed
          a link from somewhere on this site, it is a bug and worth reporting.
          Otherwise it is almost always one of two things.
        </p>

        <ol className="nf-list">
          <li>
            <h2>You asked for a component that does not exist at all.</h2>
            <p>
              Every component in the catalogue is implemented and installable
              from this origin&rsquo;s registry. Every one has been audited
              against WCAG 2.2 AA by its own authors, but none has had an
              independent accessibility review or a clinical review, so none
              is for a production health surface yet. An id that names none
              of them has no page, no specification and no roadmap entry. If an
              assistant told you such a component exists and sent you here, the
              honest answer is that it does not. The machine-readable catalogue
              at the foot of this page, not the assistant, is the authority on
              which components exist, and the catalogue linked below carries
              the count.
            </p>
            <p>
              <Link href={routes.docs("components")}>
                Component catalogue and status matrix
              </Link>
              {" · "}
              <Link href={routes.docs("project", "roadmap")}>Roadmap</Link>
              {" · "}
              <Link href={routes.docs("project", "state-of-the-system")}>
                State of the system
              </Link>
            </p>
          </li>

          <li>
            <h2>The address is slightly wrong.</h2>
            <p>
              Documentation URLs are all lower-case and hyphenated, with no
              version or language segment:{" "}
              {/* Built rather than written out: the example URL stays correct if
                  the corpus ever gains a language segment, and the file stays
                  free of the literal the IA gate bans. */}
              <code className="nf-code">
                {routes.docs("health", "alarm-fatigue")}
              </code>
              . Search is on every documentation page. Press{" "}
              <kbd className="nf-code">⌘K</kbd> once you are on one.
            </p>
          </li>
        </ol>

        <nav aria-label="Recovery links" className="nf-nav">
          <Link href={routes.home()}>Home</Link>
          <Link href={routes.docs()}>Documentation</Link>
          <Link href={routes.docs("components")}>Components</Link>
          <Link href={routes.playground()}>Playground</Link>
          <a href={agentRoutes.llms()}>llms.txt</a>
        </nav>

        <p className="nf-foot">
          If you are an automated client: this response is a genuine 404. The
          catalogue at <code className="nf-code">{registryRoutes.index()}</code>{" "}
          is the machine-readable list of every component id and its status, and
          it will tell you whether a component is implemented rather than
          leaving you to guess.
        </p>
      </main>
    </div>
  )
}
