"use client"

import {
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from "react"
import {
  Activity,
  Check,
  CircleAlert,
  CircleCheck,
  Droplet,
  Eye,
  Heart,
  Minus,
  Moon,
  OctagonAlert,
  Scale,
  TriangleAlert,
  Wind,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  categories,
  statusLevels,
  type CategoryId,
  type StatusLevelId,
} from "@/app/_shared/axes"

/**
 * The two-axis lab.
 *
 * It exists to let you try the thing the documentation tells you not to do, and
 * to refuse. A rule you have attempted to break is a rule you remember; a rule
 * you have read is a rule you will break later, in a hurry, in a component
 * somebody else reviews.
 *
 * The specimen below is a SKETCH drawn from tokens — a rectangle, a number and a
 * label. It is not MetricTile and it is not ResultCard; neither of those exists.
 * Nothing here should be read as documentation of a component's behaviour.
 */

/**
 * lucide component per icon NAME, so the specimen can render whatever
 * `lib/status.ts` declares for a level rather than keeping a second opinion
 * about which glyph means what. An unrecognised name falls back to the calmest
 * glyph rather than throwing — a missing icon must never take a page down.
 */
const ICONS_BY_NAME: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  Check,
  CircleCheck,
  Eye,
  CircleAlert,
  TriangleAlert,
  OctagonAlert,
  Minus,
}

const CATEGORY_ICONS: Record<
  CategoryId,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  sleep: Moon,
  heart: Heart,
  activity: Activity,
  nutrition: Scale,
  mind: Wind,
  labs: Droplet,
}

/** Sample readings, so the specimen shows a plausible measurement per category. */
const SAMPLE: Record<
  CategoryId,
  { label: string; value: string; unit: string }
> = {
  sleep: { label: "Time asleep", value: "5h 10m", unit: "last night" },
  heart: { label: "Blood pressure", value: "148/96", unit: "mmHg" },
  activity: { label: "Active minutes", value: "18", unit: "min today" },
  nutrition: { label: "Energy", value: "1,240", unit: "kcal today" },
  mind: { label: "Mood check-in", value: "3", unit: "of 5" },
  labs: { label: "Blood glucose", value: "9.4", unit: "mmol/L" },
}

type Application = "status-surface" | "category-surface" | "both"

const APPLICATIONS: Array<{
  id: Application
  label: string
  description: string
}> = [
  {
    id: "status-surface",
    label: "Status on the surface, category as a label",
    description:
      "The correct arrangement for anything that reports a result. One chromatic surface, carrying the verdict; identity comes from the glyph and the words.",
  },
  {
    id: "category-surface",
    label: "Category on the surface, no status",
    description:
      "Correct where there is no verdict to give — a section header, a chart legend, an empty state before any reading exists.",
  },
  {
    id: "both",
    label: "Both axes on the surface",
    description:
      "The combination this lab refuses to render, and the reason it exists.",
  },
]

export function StatusTool() {
  const [category, setCategory] = useState<CategoryId>("heart")
  const [status, setStatus] = useState<StatusLevelId>("attention")
  const [application, setApplication] = useState<Application>("status-surface")
  const [greyscale, setGreyscale] = useState(false)
  const [colourOnly, setColourOnly] = useState(false)

  const level =
    statusLevels.find((item) => item.id === status) ?? statusLevels[0]
  const categoryMeta =
    categories.find((item) => item.id === category) ?? categories[0]
  const sample = SAMPLE[category]
  // Looked up, not built: creating the component inside render would reset
  // its state on every keystroke, and the lint rule that says so is right.
  const StatusIcon = ICONS_BY_NAME[level.icon] ?? CircleCheck
  const CategoryIcon = CATEGORY_ICONS[category]

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
      {/* ------------------------------------------------------------- */}
      <div className="space-y-6">
        <Field label="Measurement category" hint="What kind of thing this is.">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as CategoryId)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} — {item.example}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Clinical status" hint="How urgent this reading is.">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusLevelId)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {statusLevels.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} — {item.meaning}
              </option>
            ))}
          </select>
        </Field>

        <fieldset>
          <legend className="text-sm font-medium">
            How the colour is applied
          </legend>
          <div className="mt-2 space-y-2">
            {APPLICATIONS.map((option) => (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-md border border-border p-3 text-sm",
                  application === option.id && "border-foreground",
                  option.id === "both" && "border-dashed"
                )}
              >
                <input
                  type="radio"
                  name="application"
                  className="mt-1"
                  checked={application === option.id}
                  onChange={() => setApplication(option.id)}
                />
                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">Stress the specimen</legend>
          <div className="mt-2 space-y-2">
            <Toggle
              checked={greyscale}
              onChange={setGreyscale}
              label="Remove colour"
              hint="Greyscale, exactly as a monochrome print or a screenshot in a document would render it."
            />
            <Toggle
              checked={colourOnly}
              onChange={setColourOnly}
              label="Remove the word and the shape"
              hint="Leave the verdict carried by colour alone. Combine with the above."
            />
          </div>
        </fieldset>
      </div>

      {/* ------------------------------------------------------------- */}
      <div>
        {application === "both" ? (
          <Refusal category={categoryMeta.label} status={level.label} />
        ) : (
          <div
            className="rounded-lg border border-border p-8"
            style={greyscale ? { filter: "grayscale(1)" } : undefined}
          >
            <div
              data-status={
                application === "status-surface" ? status : undefined
              }
              data-category={category}
              className="max-w-sm rounded-lg p-5"
              style={
                application === "status-surface"
                  ? {
                      backgroundColor: `var(--opsin-status-${level.id}-surface)`,
                      color: `var(--opsin-status-${level.id}-ink)`,
                      border: `1px solid var(--opsin-status-${level.id}-line)`,
                    }
                  : {
                      backgroundColor: `var(--opsin-category-${category}-surface)`,
                      color: `var(--opsin-category-${category}-ink)`,
                      border: `1px solid var(--opsin-category-${category}-accent)`,
                    }
              }
            >
              <p className="flex items-center gap-2 text-sm font-medium">
                <CategoryIcon aria-hidden className="size-4" />
                {sample.label}
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight">
                {sample.value}
                {/* A no-break space in the text, not a margin. A CSS gap is
                    invisible to copy, to speech and to anything that reads the
                    text node, so `ml-2` alone rendered "148/96mmHg" —
                    content/grammar-and-mechanics rule: a space between the
                    number and the unit, and a non-breaking one so the pair
                    never wraps apart. The margin goes with it: one separator,
                    not two. */}
                {"\u00A0"}
                <span className="text-base font-normal">{sample.unit}</span>
              </p>

              {application === "status-surface" ? (
                colourOnly ? (
                  <p className="mt-4 h-5 text-sm opacity-0" aria-hidden>
                    placeholder
                  </p>
                ) : (
                  <>
                    <p className="mt-4 flex items-center gap-2 text-sm font-medium">
                      <StatusIcon aria-hidden className="size-4" />
                      {level.label}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">
                      {level.sentence}
                    </p>
                  </>
                )
              ) : (
                <p className="mt-4 text-sm leading-relaxed opacity-80">
                  No verdict is being given. This surface says what the
                  measurement is, and nothing about whether it is worrying.
                </p>
              )}
            </div>
          </div>
        )}

        <Verdict
          application={application}
          greyscale={greyscale}
          colourOnly={colourOnly}
          status={level.label}
        />
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint: string
  children: ReactNode
}) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-0.5 mb-2 text-xs text-muted-foreground">{hint}</p>
      {children}
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  hint: string
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-md border border-border p-3 text-sm",
        checked && "border-foreground"
      )}
    >
      <input
        type="checkbox"
        className="mt-1"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-xs leading-relaxed text-muted-foreground">
          {hint}
        </span>
      </span>
    </label>
  )
}

/**
 * The refusal.
 *
 * It is a real refusal — the specimen is not rendered dimmed, or with a warning
 * over it. The combination does not get drawn, because a picture of the wrong
 * thing is what people screenshot.
 */
function Refusal({ category, status }: { category: string; status: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-status-urgent bg-status-urgent-surface p-6 text-status-urgent-ink"
    >
      <h2 className="text-lg font-semibold tracking-tight">
        This lab will not render that.
      </h2>
      <p className="mt-3 text-sm leading-relaxed">
        You have asked for a surface that is simultaneously{" "}
        <strong className="font-medium">{category}</strong> and{" "}
        <strong className="font-medium">{status}</strong>. Both axes want the
        same pixels, and the result would be two chromatic fields competing to
        be the thing the reader interprets.
      </p>
      <ul className="mt-4 space-y-2 text-sm leading-relaxed">
        <li>
          <strong className="font-medium">
            The reader cannot tell which colour is the verdict.
          </strong>{" "}
          A tile that is heart-red and urgent-red is a tile whose reader has to
          guess whether the red means &ldquo;heart&rdquo; or &ldquo;phone
          somebody&rdquo;. They will guess wrong at the worst moment, because
          the worst moment is when they are frightened.
        </li>
        <li>
          <strong className="font-medium">
            The categories stop meaning anything.
          </strong>{" "}
          If every category surface also carries a status, the category colours
          are no longer identity — they are just decoration on top of the
          verdict, and the six-way distinction you paid for disappears.
        </li>
        <li>
          <strong className="font-medium">
            It fails first for the people it matters most to.
          </strong>{" "}
          Two competing chromatic fields are the arrangement that collapses
          fastest under colour-vision deficiency, greyscale printing and bright
          sunlight — three conditions that are ordinary, not edge cases.
        </li>
      </ul>
      <p className="mt-4 text-sm leading-relaxed">
        <strong className="font-medium">What to do instead:</strong> put the
        status on the surface and the category in the glyph and the label.
        Choose the first option on the left and the specimen comes back — it
        carries both pieces of information, and only one of them is a colour.
      </p>
    </div>
  )
}

/** A plain-language reading of what the current combination demonstrates. */
function Verdict({
  application,
  greyscale,
  colourOnly,
  status,
}: {
  application: Application
  greyscale: boolean
  colourOnly: boolean
  status: string
}) {
  if (application === "both") {
    return (
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        Nothing is rendered above, on purpose. The refusal is the demonstration.
      </p>
    )
  }

  if (application === "category-surface") {
    return (
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        No verdict is present, so nothing is lost in greyscale: the category
        colour was carrying identity, and the identity is also in the glyph and
        the label. This is why category colour is allowed to be quiet.
      </p>
    )
  }

  if (colourOnly && greyscale) {
    return (
      <p className="mt-5 rounded-md border border-status-urgent bg-status-urgent-surface p-4 text-sm leading-relaxed text-status-urgent-ink">
        The verdict has vanished. Colour was the only thing carrying{" "}
        <strong className="font-medium">{status}</strong>, and colour is the
        thing that just went away — for the reader who printed this,
        screenshotted it into a document, or cannot separate these hues. This is
        the failure the never-colour-alone rule exists to prevent, and it is one
        checkbox deep.
      </p>
    )
  }

  if (colourOnly) {
    return (
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        The word and the shape are gone; the verdict is now carried by colour
        alone. It still looks fine here. Now switch on{" "}
        <span className="font-medium text-foreground">Remove colour</span> and
        watch what a screen-reader user, a greyscale printout and a reader with
        a colour-vision deficiency are left with.
      </p>
    )
  }

  if (greyscale) {
    return (
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        Colour is gone and the verdict survives intact: the word{" "}
        <strong className="font-medium text-foreground">{status}</strong>, the
        shape of the icon, and the sentence that says what to do. That is the
        whole test. If a status specimen fails it, the specimen is wrong — not
        the reader.
      </p>
    )
  }

  return (
    <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
      One chromatic surface, carrying one verdict, with the category supplied by
      a glyph and a label. Try removing the colour, then the word, then both.
    </p>
  )
}
