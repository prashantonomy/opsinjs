"use client"

import { useMemo, useState, type ComponentType, type SVGProps } from "react"
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Bell,
  BellOff,
  Brain,
  Calendar,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  CircleQuestionMark,
  CircleSlash,
  Clock,
  CloudOff,
  Copy,
  Download,
  Droplet,
  Eye,
  EyeOff,
  FileText,
  Footprints,
  Funnel,
  Heart,
  HeartPulse,
  Info,
  LoaderCircle,
  Lock,
  Minus,
  Moon,
  MoveRight,
  OctagonAlert,
  Pill,
  Plus,
  RefreshCw,
  RotateCcw,
  Ruler,
  Scale,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Thermometer,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  WifiOff,
  Wind,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { CopyButton } from "@/app/_shared/copy-button"

/**
 * The icon inventory.
 *
 * This is a CURATED set, not a mirror of the lucide library. Lucide ships
 * thousands of icons; opsinjs documents the fifty or so that have a defined job
 * in a health interface, and states what that job is. An inventory that lists
 * everything is a search box with extra steps — the value of documenting icons
 * at all is in the sentence beside each one, not in the picture.
 *
 * One library, one weight, one size ladder: lucide. The named `lyra` shadcn
 * preset would have brought Phosphor and a second monospace face with it; the
 * preset code used at scaffold time does not. Mixing icon libraries in a system
 * whose status glyphs must be instantly distinguishable is how two subtly
 * different warning triangles end up on the same screen.
 */

type IconEntry = {
  name: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  use: string
}

type IconGroup = {
  id: string
  title: string
  description: string
  icons: IconEntry[]
}

const GROUPS: IconGroup[] = [
  {
    id: "status",
    title: "Status",
    description:
      "One glyph per clinical status level, declared once in lib/status.ts and never chosen per component. The four silhouettes are deliberately unlike each other rather than four variations on a circle, so they stay distinguishable in greyscale, at 16 pixels, and to somebody who cannot separate red from green. An icon never carries status on its own — it always appears with the word.",
    icons: [
      {
        name: "Check",
        Icon: Check,
        use: "Steady. This reading is where it is expected to be.",
      },
      {
        name: "Eye",
        Icon: Eye,
        use: "Watch. Outside the usual range; keep an eye on it.",
      },
      {
        name: "TriangleAlert",
        Icon: TriangleAlert,
        use: "Needs attention. Contact your care team.",
      },
      {
        name: "OctagonAlert",
        Icon: OctagonAlert,
        use: "Urgent. This reading needs help now.",
      },
      {
        name: "Minus",
        Icon: Minus,
        use: "Not known. The absence of a verdict, and never a fifth status level.",
      },
      {
        name: "Info",
        Icon: Info,
        use: "Context and explanation. Never a verdict.",
      },
      {
        name: "CircleQuestionMark",
        Icon: CircleQuestionMark,
        use: "A definition or a glossary term.",
      },
    ],
  },
  {
    id: "trend",
    title: "Trend and direction",
    description:
      "Direction only. Whether a direction is good news depends entirely on the measurement — a falling weight and a falling blood oxygen are not the same story — so these glyphs never take a status colour by default. The valence comes from the status axis, applied deliberately.",
    icons: [
      {
        name: "TrendingUp",
        Icon: TrendingUp,
        use: "Rising over the window shown.",
      },
      {
        name: "TrendingDown",
        Icon: TrendingDown,
        use: "Falling over the window shown.",
      },
      {
        name: "Minus",
        Icon: Minus,
        use: "No meaningful change — which is not the same as no data. Minus is also the not-known glyph above; the surrounding label is what separates them.",
      },
      {
        name: "ArrowUp",
        Icon: ArrowUp,
        use: "A single reading higher than the last.",
      },
      {
        name: "ArrowDown",
        Icon: ArrowDown,
        use: "A single reading lower than the last.",
      },
      {
        name: "MoveRight",
        Icon: MoveRight,
        use: "Progression through a range or a flow.",
      },
    ],
  },
  {
    id: "measurement",
    title: "Measurement categories",
    description:
      "Identity glyphs, paired with the category colour axis. They label what a number is, never how worrying it is. Note what is absent: there is no glyph here that depicts a clinician, a clinical instrument or a medical institution.",
    icons: [
      {
        name: "Heart",
        Icon: Heart,
        use: "Cardiovascular measurements in general.",
      },
      {
        name: "HeartPulse",
        Icon: HeartPulse,
        use: "Heart rate and rhythm specifically.",
      },
      {
        name: "Activity",
        Icon: Activity,
        use: "Movement, active minutes, exertion.",
      },
      {
        name: "Droplet",
        Icon: Droplet,
        use: "Blood glucose and other fluid measures.",
      },
      { name: "Thermometer", Icon: Thermometer, use: "Body temperature." },
      {
        name: "Wind",
        Icon: Wind,
        use: "Respiratory measures — peak flow, breathing.",
      },
      { name: "Scale", Icon: Scale, use: "Weight." },
      {
        name: "Ruler",
        Icon: Ruler,
        use: "Height, waist, any linear measurement.",
      },
      { name: "Footprints", Icon: Footprints, use: "Steps and distance." },
      { name: "Moon", Icon: Moon, use: "Sleep." },
      { name: "Brain", Icon: Brain, use: "Mood, cognition, mental wellbeing." },
      { name: "Pill", Icon: Pill, use: "Medication — a dose taken or due." },
    ],
  },
  {
    id: "time",
    title: "Time and recency",
    description:
      "How old a reading is, is part of what the reading means. A three-day-old measurement presented as current is a safety problem, so recency gets glyphs of its own rather than being left to small grey text.",
    icons: [
      {
        name: "Clock",
        Icon: Clock,
        use: "A time of day, or a relative timestamp.",
      },
      { name: "Calendar", Icon: Calendar, use: "A date, or a logging streak." },
      {
        name: "CalendarClock",
        Icon: CalendarClock,
        use: "Something scheduled — a repeat, a review.",
      },
      {
        name: "RotateCcw",
        Icon: RotateCcw,
        use: "History: previous readings for this measure.",
      },
    ],
  },
  {
    id: "data-states",
    title: "Data states",
    description:
      "Empty, loading, error, stale and partial are defined once for every data surface, and each has a glyph. Rendering “we do not know” honestly is a requirement in a health interface, not a polish item.",
    icons: [
      {
        name: "CircleDashed",
        Icon: CircleDashed,
        use: "Empty. Nothing recorded yet.",
      },
      {
        name: "LoaderCircle",
        Icon: LoaderCircle,
        use: "Loading. The only glyph here that may spin.",
      },
      {
        name: "RefreshCw",
        Icon: RefreshCw,
        use: "Stale — last synced some time ago. Retry available.",
      },
      {
        name: "CloudOff",
        Icon: CloudOff,
        use: "Not synced. The value shown is local.",
      },
      {
        name: "WifiOff",
        Icon: WifiOff,
        use: "Offline. Nothing new can arrive right now.",
      },
      {
        name: "CircleSlash",
        Icon: CircleSlash,
        use: "Partial. Some of this record is missing.",
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy, consent and disclosure",
    description:
      "These screens are read in waiting rooms, on trains and over shoulders. Hiding a value, re-authenticating and recording consent are first-class interactions here rather than settings-screen afterthoughts.",
    icons: [
      {
        name: "Eye",
        Icon: Eye,
        use: "Reveal a value that is hidden by default.",
      },
      {
        name: "EyeOff",
        Icon: EyeOff,
        use: "Hide sensitive values on this screen.",
      },
      { name: "Lock", Icon: Lock, use: "Re-authentication required." },
      {
        name: "ShieldCheck",
        Icon: ShieldCheck,
        use: "A recorded, revocable consent. Never a security claim.",
      },
      {
        name: "FileText",
        Icon: FileText,
        use: "A document: a policy, a result letter, an export.",
      },
    ],
  },
  {
    id: "actions",
    title: "Actions and navigation",
    description:
      "The ordinary furniture. Included because a system that documents only its exotic glyphs leaves the everyday ones to be chosen at random, and a chevron that points a different way on two screens is a real, small, constant cost.",
    icons: [
      { name: "Plus", Icon: Plus, use: "Add a reading, start a log entry." },
      { name: "Check", Icon: Check, use: "Confirm. Not a status." },
      { name: "X", Icon: X, use: "Dismiss or close. Not a failure." },
      {
        name: "ChevronRight",
        Icon: ChevronRight,
        use: "Navigate into detail.",
      },
      { name: "ChevronDown", Icon: ChevronDown, use: "Expand in place." },
      { name: "Search", Icon: Search, use: "Search." },
      { name: "Funnel", Icon: Funnel, use: "Filter a list of readings." },
      { name: "Copy", Icon: Copy, use: "Copy a value or a record." },
      {
        name: "Share2",
        Icon: Share2,
        use: "Share with somebody — often a clinician.",
      },
      {
        name: "Download",
        Icon: Download,
        use: "Export. Usually the whole record, dated.",
      },
      {
        name: "Settings",
        Icon: Settings,
        use: "Preferences, units, reminders.",
      },
      { name: "Bell", Icon: Bell, use: "A reminder is on." },
      {
        name: "BellOff",
        Icon: BellOff,
        use: "Reminders are off. Say so explicitly.",
      },
    ],
  },
]

export function IconBrowser() {
  const [query, setQuery] = useState("")
  const needle = query.trim().toLowerCase()

  const groups = useMemo(() => {
    if (!needle) return GROUPS
    return GROUPS.map((group) => ({
      ...group,
      icons: group.icons.filter(
        (icon) =>
          icon.name.toLowerCase().includes(normalised) ||
          icon.use.toLowerCase().includes(normalised) ||
          group.title.toLowerCase().includes(normalised)
      ),
    })).filter((group) => group.icons.length > 0)
  }, [normalised])

  const total = GROUPS.reduce((count, group) => count + group.icons.length, 0)
  const shown = groups.reduce((count, group) => count + group.icons.length, 0)

  return (
    <div>
      <div className="sticky top-14 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-card py-3">
        <label className="sr-only" htmlFor="icon-search">
          Filter icons
        </label>
        <input
          id="icon-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter — urgent, sleep, stale, consent…"
          className="h-9 min-w-56 flex-1 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
        <p className="font-mono text-xs text-muted-foreground">
          {shown} of {total}
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          Nothing matches “{query}”. This is a curated set of {total} icons with
          a documented job, not a mirror of the whole lucide library — if what
          you need is not here, that is a question for{" "}
          <span className="font-medium">Proposing a component</span> rather than
          a search that failed.
        </p>
      ) : null}

      {groups.map((group) => (
        <section key={group.id} className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">
            {group.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {group.description}
          </p>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.icons.map(({ name, Icon, use }) => (
              <li
                key={name}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <code className="block font-mono text-xs font-medium">
                    {name}
                  </code>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {use}
                  </span>
                </span>
                <CopyButton
                  value={`import { ${name} } from "lucide-react"`}
                  label={`the ${name} import`}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
