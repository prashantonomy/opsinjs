import { routes } from "@/lib/routes"

/**
 * The screens on `/showcase`: whole screens assembled only from opsinjs
 * components, each one rendered from a file under `registry/screens/`.
 *
 * Every entry here is opsinjs's own work. An entry from another team would
 * have to clear the four tests printed on the showcase, and none has, so this
 * list holds no product somebody else shipped. Add one only when a screen file
 * exists and renders at its `/view` route.
 */
export interface Showcase {
  /** The file under `registry/screens/`, and the key of its preview. */
  slug: "diabetes-medicines-app" | "results-screen"
  title: string
  /** What the screen is, in one or two sentences. */
  description: string
  href: string
  /** The kind of health product, shown as a tag. */
  domain: string
  /** How many components the screen composes. */
  components: number
  /** The components the screen leans on, by their PascalCase names. */
  highlights: string[]
}

/** The showcase grid, in the order it renders. */
export const showcases: Showcase[] = [
  {
    slug: "diabetes-medicines-app",
    title: "Diabetes medicines app",
    description:
      "A medicines diary with four destinations that records what somebody takes and reminds them at times they chose. It calculates no dose, and it never marks a dose as missed.",
    href: routes.showcaseMedicinesApp(),
    domain: "Medicines",
    components: 35,
    highlights: [
      "DoseTracker",
      "LogSheet",
      "Stepper",
      "Sheet",
      "ConsentSheet",
      "TimelineEntry",
      "TabBar",
    ],
  },
  {
    slug: "results-screen",
    title: "Results screen",
    description:
      "One example lab result, then what it means, the next step and where it came from, in the order a screen reader meets them. It states one status and tints one title by category.",
    href: routes.docs("patterns", "result-disclosure"),
    domain: "Lab results",
    components: 7,
    highlights: [
      "ResultCard",
      "Term",
      "CareCard",
      "RelativeTime",
      "DisclaimerNote",
      "Surface",
    ],
  },
]
