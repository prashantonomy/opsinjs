/**
 * The screens on `/showcase`: whole screens assembled only from opsinjs
 * components, each one rendered from a file under `registry/screens/`.
 *
 * Every entry here is opsinjs's own work. An entry from another team would
 * have to clear the four tests printed on the showcase, and none has, so this
 * list holds no product somebody else shipped. Add one only when a screen file
 * exists and renders at its `/view` route. The entry's card links to
 * `/showcase/<slug>`, which shows the screen on its own.
 */
export interface Showcase {
  /**
   * The file under `registry/screens/`, the key of its preview, and the last
   * segment of its page under `/showcase`.
   */
  slug: "diabetes-medicines-app" | "patient-record-portal" | "results-screen"
  title: string
  /**
   * What the screen is, in one or two sentences. It is also the description
   * of the screen's own page, so it stays within the 160 characters a search
   * result shows.
   */
  description: string
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
      "A medicines diary that records what somebody takes and reminds them at times they chose. It calculates no dose, and it never marks a dose as missed.",
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
    slug: "patient-record-portal",
    title: "Patient record portal",
    description:
      "A patient's own view of the record their hospitals write, with who can see it, who looked, and a card a paramedic can read. It explains nothing it shows.",
    domain: "Health records",
    components: 24,
    highlights: [
      "TabBar",
      "RadioGroup",
      "Switch",
      "Accordion",
      "SegmentedControl",
      "Dialog",
      "Sheet",
    ],
  },
  {
    slug: "results-screen",
    title: "Results screen",
    description:
      "One example lab result, then what it means, the next step and where it came from, in screen reader order. It states one status and tints one title by category.",
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
