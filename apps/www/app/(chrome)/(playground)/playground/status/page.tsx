import type { Metadata } from "next"
import Link from "next/link"

import { Container, PageHeader, Prose } from "@/app/_shared/ui"
import { StatusTool } from "./status-tool"
import { routes } from "@/lib/routes"
import { pageMetadata } from "@/app/_shared/seo"
import {
  JsonLd,
  breadcrumbLd,
  graph,
} from "@/app/_shared/structured-data"

export const metadata: Metadata = pageMetadata({
  title: "Two-axis lab",
  description:
    "Combine a measurement category with a clinical status and watch the lab refuse the unsafe pair. Then strip the colour out and see what survives without it.",
  path: routes.playgroundStatus(),
  type: "website",
  section: "Playground",
})

export default function StatusPlaygroundPage() {
  return (
    <>
      {/*
        The trail Google prints in place of a truncated URL. The site
        entity and the publisher are declared once on the root layout and
        referred to by `@id`, so this block carries only what is local to
        this page.
      */}
      <JsonLd
        data={graph([
          breadcrumbLd([
            { name: "Introduction", path: routes.home() },
            { name: "Playground", path: routes.playground() },
            { name: "Two-axis lab", path: routes.playgroundStatus() },
          ]),
        ])}
      />
      <PageHeader
        eyebrow="Playground"
        title="Two-axis lab"
        lead="Category says what a measurement is. Status says how urgent it is. They may not share a surface. The fastest way to believe that is to try it."
      />

      <Container className="py-10">
        <StatusTool />

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Why a tool instead of a paragraph
            </h2>
            <Prose className="mt-3">
              <p>
                The never-mix rule is easy to state and easy to agree with, and
                it is broken constantly. It is broken not by people who disagree
                with it, but by people building a &ldquo;heart&rdquo; card who
                reach for red because heart cards are red, and then need to show
                that this particular reading is fine.
              </p>
              <p>
                The failure is invisible in the moment. It looks like a design
                choice, it passes contrast, and it only becomes a problem later,
                on a screen with several cards, when the reader has to work out
                which red is the one that means something.
              </p>
              <p>
                So the lab refuses. Rather than putting a warning over a
                rendered example, it does not draw the combination at all,
                because the picture is what gets screenshotted and pasted into a
                ticket as evidence that it looked fine.
              </p>
            </Prose>
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              The greyscale test is the real one
            </h2>
            <Prose className="mt-3">
              <p>
                Every status specimen in this system has to survive having its
                colour removed. Not because greyscale is common, but because it
                is a cheap proxy for four things that are: colour-vision
                deficiency, a printout taken to an appointment, a screenshot
                pasted into a document, and a phone held at an angle in bright
                sun.
              </p>
              <p>
                A status that survives greyscale has three carriers and loses
                only one of them. The three are the word, the shape and the
                colour. A status carried by colour alone loses everything, and
                it fails silently: nothing errors, nothing looks broken, the
                reader simply does not know.
              </p>
              <p>
                The generated contrast audit runs this check across every token
                pair rather than by eye. See{" "}
                <Link
                  href={routes.docs("reference", "generated", "contrast")}
                >
                  the contrast reference
                </Link>{" "}
                for the measured version, including the colour-vision
                simulations this lab deliberately does not approximate a second
                time.
              </p>
            </Prose>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold tracking-tight">
            Where the rules are written down
          </h2>
          <Prose className="mt-3">
            <p>
              <Link href={routes.docs("health", "two-colour-axes")}>
                Two colour axes
              </Link>{" "}
              is the doctrine page, and it is the one to read if you only read
              one. It defines what each of the four levels means, who is allowed
              to assign it and what it must never be read as, and it covers the
              category axis and what a category colour may not carry.
            </p>
            <p>
              For the wording rather than the colour,{" "}
              <Link href={routes.docs("foundations", "writing")}>
                Writing
              </Link>{" "}
              has the sentence pattern for each level and the words banned at
              each one. The two pages are meant to be read together: a status is
              a colour, a shape and a sentence, and the sentence is the part
              that travels furthest.
            </p>
            <p>
              The ramps themselves are browsable at{" "}
              <Link href={routes.colors()}>/colors</Link>, and the measured
              contrast for every pair is in{" "}
              <Link href={routes.docs("reference", "generated", "contrast")}>
                the contrast reference
              </Link>
              .
            </p>
          </Prose>
        </section>
      </Container>
    </>
  )
}
