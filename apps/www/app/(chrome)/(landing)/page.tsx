import type { Metadata } from "next"
import Link from "next/link"
import { Geist } from "next/font/google"

import "./landing.css"
import { pageMetadata } from "@/app/_shared/seo"
import { LogoMark } from "@/components/logo-mark"
import { routes, site } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { PensieveLockup } from "./pensieve-lockup"

/**
 * The landing page, in the shape of blueprintjs.com (ADR 0027): one dark
 * banner carrying the mark, the name, the claim and three links, then a footer
 * carrying the publisher's lockup and address. It defines nothing the
 * documentation defines, which is what got the previous landing page deleted:
 * every fact a reader needs is one link away, under `/docs`.
 *
 * It renders inside `app/(chrome)/layout.tsx` and in no other layout, so it
 * has neither the tool pages' header nor their footer.
 */

/**
 * Geist, the Pensieve wordmark face, for one word in the footer. Loaded
 * without a weight so the variable file arrives and the wordmark can sit at
 * the in-between weight the lockup is tuned to. next/font serves it from this
 * origin, which the font-src policy in next.config.mjs requires.
 */
const wordmark = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
})

export const metadata: Metadata = {
  ...pageMetadata({
    title: site.name,
    description: site.tagline,
    path: routes.home(),
    type: "website",
  }),
  title: { absolute: `${site.name} · a design system for consumer health apps` },
}

/**
 * The banner's backdrop, which is decoration and is hidden from assistive
 * technology. Two quiet layers: a sheet of measurement paper that fades out
 * towards the edges, and a horizon drawn from the mark itself, a track with
 * its expected band and one reading, stretched across the width of the page.
 */
function Backdrop() {
  return (
    <div className="landing-backdrop" aria-hidden="true">
      <div className="landing-grid" />
      <div className="landing-horizon">
        <span className="landing-track" />
        <span className="landing-band" />
        <span className="landing-reading" />
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="landing">
      <main className="landing-hero">
        <Backdrop />
        <div className="landing-center">
          <span className="landing-mark">
            <LogoMark size={72} />
          </span>
          <h1 className="landing-title">{site.name}</h1>
          <p className="landing-tagline">{site.tagline}</p>
          <nav className="landing-links" aria-label="Primary">
            <Link href={routes.docs()}>Documentation</Link>
            <span className="landing-separator" aria-hidden="true" />
            <Link href={routes.showcase()}>Showcase</Link>
            {site.sourcePublic ? (
              <>
                <span className="landing-separator" aria-hidden="true" />
                <a href={site.github}>GitHub</a>
              </>
            ) : null}
          </nav>
        </div>
      </main>

      <footer className={cn("landing-footer", wordmark.variable)}>
        <PensieveLockup name={site.publisher.name} />
        <span className="landing-rule" aria-hidden="true" />
        <a className="landing-website" href={site.publisher.url}>
          {site.publisher.url.replace(/^https:\/\//, "")}
        </a>
      </footer>
    </div>
  )
}
