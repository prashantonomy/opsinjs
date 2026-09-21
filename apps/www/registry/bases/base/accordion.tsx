"use client"

/**
 * Accordion is a stack of sections that each expand and collapse, so a long page
 * of headings can be scanned first and read second. Its home is a set of related
 * passages a reader wants an index of before they commit to any one of them, a
 * list of questions and answers being the case it was built for.
 *
 * ONE THING IT MUST NEVER DO, STATED FIRST BECAUSE IT IS THE ONE THAT MATTERS.
 * A collapsed panel is hidden by default, so nothing a reader must not miss may
 * live inside one. A safety message, an urgent instruction, a warning about a
 * dose or an interaction, a step a reader has to take: none of these belong in a
 * panel that is shut when the screen loads, because a reader who never opens the
 * panel never meets the message, and that is a defect whatever component drew the
 * panel. Content a reader must always see belongs in a card or a callout that is
 * open on the surface at all times. This wrapper cannot inspect the words a
 * caller places inside it, so the rule is a contract stated here and on the page
 * rather than a check the code can make.
 *
 * WHY BASE UI'S Accordion RATHER THAN A PAIR OF <button> AND A HIDDEN <div>. The
 * naive build, a button that toggles a sibling's `hidden`, drops every keyboard
 * and screen-reader affordance the pattern owes. Base UI's Accordion renders the
 * header as an `<h3>` with a `<button>` inside it, wires `aria-expanded` and
 * `aria-controls` between the trigger and its panel, and manages open state for
 * the single-open and multi-open cases both, so a reader meets the WAI-ARIA
 * disclosure pattern rather than a bespoke one nobody has tested. Each trigger is
 * an ordinary tab stop, which is correct here: unlike a segmented control, an
 * accordion is a set of independent disclosures and a reader expects Tab to visit
 * each header in turn.
 *
 * NEITHER COLOUR AXIS. An accordion organises content: it states no clinical
 * level and names no category, so it carries neither `data-status` nor
 * `data-category` and draws only neutral chrome. The chevron and the header ink
 * are the two things that move, and both are neutral. When a section is about a
 * measurement, the level and the words for it are the consuming product's to
 * place inside the panel with the components that carry them, and the accordion
 * around them stays plain.
 *
 * SINGLE OPEN IS THE DEFAULT, AND THAT IS DELIBERATE. With `multiple` left off,
 * opening one section closes the others, which keeps a small screen from growing
 * a wall of open panels the reader then has to scroll past. Set `multiple` when
 * the sections are independent and a reader may want several open at once, such
 * as a set of filters. Base UI's own default is the same, so the prop maps
 * straight through.
 */

import { Accordion as BaseAccordion } from "@base-ui/react/accordion"
import { ChevronDown } from "lucide-react"
import type { ReactNode } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * One section in the stack. Kept as a local type rather than a fourth public
 * export, for the reason `segmented-control.tsx` gives about its own option
 * shape: the registry contract fixes this file at three public exports, so a
 * consumer names this shape as `AccordionProps["items"][number]` rather than
 * importing a fourth symbol.
 */
interface AccordionSection {
  /**
   * The value that identifies this section. Unique within the stack, and what
   * `value` and `defaultValue` match against. It is what a controlled caller
   * stores to say which sections are open.
   */
  value: string
  /**
   * The header's words, shown in the trigger button beside the chevron. Keep it
   * to a short, scannable line: a reader reads the whole stack of headers before
   * opening any one panel, so a header that runs to a sentence defeats the index.
   */
  title: ReactNode
  /**
   * The panel's content, revealed when the section is open. Ordinary content
   * only. Nothing a reader must always see belongs here, because a collapsed
   * panel is hidden by default; put a safety message or an urgent instruction in
   * a card or a callout that stays open on the surface instead.
   */
  content: ReactNode
  /**
   * Whether this section cannot be opened. A disabled header stays in the tab
   * order so a reader still meets it, drops to the muted ink, and does not toggle
   * its panel. Defaults to open-able.
   */
  disabled?: boolean
}

/**
 * The stack, spelled once. A single card surface with a hairline, the sections
 * set into it and divided by hairlines, so the whole control reads as one object
 * rather than a row of loose bars. `overflow-hidden` keeps the first and last
 * sections' corners inside the rounded border.
 */
const ROOT = "overflow-hidden rounded-opsin-lg border border-border bg-card"

/**
 * One section wrapper. The top hairline divides it from the section above; the
 * first section drops it, because the root's own border already draws that edge.
 */
const ITEM = "border-t border-border first:border-t-0"

/**
 * The header row and its button, spelled once.
 *
 * The trigger is a full-width button with the title on one side and the chevron
 * on the other. The ink is written as the arbitrary property
 * `[color:var(--foreground)]` and not `text-foreground`, for the reason
 * `segmented-control.tsx` sets out: tailwind-merge files a `text-*` colour in the
 * same conflict group as the `text-opsin-*` type step and would drop one of them.
 * A disabled header drops to the measured `--muted-foreground` chrome role rather
 * than an opacity wash, so it stays readable while reading as unavailable.
 *
 * The focus ring is carried here rather than left to the product stylesheet, so a
 * project installed without that stylesheet does not lose it. The target floor is
 * `--opsin-target-minimum` in rem, so the 44pt pressable region grows with the
 * reader's text size rather than pinning at a device pixel, with a literal
 * fallback so the declaration stays valid where the generated token sheet was not
 * installed. The offset is negated so the ring draws inside the trigger rather
 * than around it. The root sets `overflow-hidden` to keep the first and last
 * corners rounded, and the trigger runs edge to edge inside it, so an outward
 * ring would be clipped on its left and right and on the top of the first
 * section. An inset ring sits within that clip and stays whole along every
 * straight edge. One honest limit remains: the trigger keeps square corners
 * while the root clips to a rounded radius, so on the first section's top
 * corners and the last section's bottom corners the square ring is trimmed to
 * a small notch where the curve cuts in. Most of the ring is present and the
 * focus stays clearly visible, so this does not reopen the 2.4.7 gap the inset
 * closed, but the ring is not literally unbroken at those two pairs of corners.
 * `group` is set so the chevron can read the trigger's own `data-panel-open`
 * state and turn with it.
 */
const TRIGGER =
  "group flex w-full items-center justify-between gap-opsin-3 " +
  "px-opsin-4 py-opsin-3 text-left align-middle text-opsin-headline font-medium " +
  "min-h-(--opsin-target-minimum,2.75rem) cursor-pointer [color:var(--foreground)] " +
  "transition-colors duration-(--opsin-duration-fast) ease-opsin-standard " +
  "hover:bg-state-hover " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:[color:var(--muted-foreground)] data-[disabled]:hover:bg-transparent " +
  "focus-visible:outline-[length:var(--opsin-border-focus,2px)] focus-visible:outline-offset-[calc(var(--opsin-border-focus-offset,2px)*-1)] focus-visible:outline-ring"

/**
 * The chevron. It rotates a half turn when its section opens, reading the
 * trigger's `data-panel-open` through the `group` on the trigger. `shrink-0`
 * keeps it from squashing when the title wraps. It is decorative: the open state
 * a reader relies on is `aria-expanded` on the button, which Base UI sets, so the
 * chevron is `aria-hidden` and carries no meaning of its own.
 */
const CHEVRON =
  "size-[1em] shrink-0 [color:var(--muted-foreground)] " +
  "transition-transform duration-(--opsin-duration-fast) ease-opsin-standard " +
  "group-data-[panel-open]:rotate-180"

/**
 * The panel that holds a section's content. The top padding is dropped because
 * the header above already spaces it; the reader gets the body ink at the body
 * step. Base UI unmounts the panel while the section is closed, so a shut section
 * costs nothing and its content is not in the tab order.
 */
const PANEL = "px-opsin-4 pb-opsin-4 text-opsin-body [color:var(--foreground)]"

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a
 * consumer makes with the clinical API, and an accordion asserts nothing
 * clinical. `segmented-control.tsx` and `divider.tsx` keep the same small set for
 * the same reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface AccordionProps {
  /**
   * The sections, in the order they appear. Each is a value, a header title, the
   * panel content, and an optional `disabled` flag. An empty array renders
   * nothing and raises a development warning, because an accordion with no
   * sections has nothing to disclose.
   */
  items: AccordionSection[]
  /**
   * Whether more than one section may be open at once. Left off, opening a
   * section closes the others, which suits a small screen where a stack of open
   * panels would grow past the fold. Set it when the sections are independent and
   * a reader may want several open together. Defaults to `false`.
   */
  multiple?: boolean
  /**
   * The sections open on first render, by their `value`, when the accordion
   * manages its own open state. Use this for an uncontrolled accordion; for a
   * controlled one, use `value` and `onValueChange` instead. Omitted, every
   * section starts closed.
   */
  defaultValue?: string[]
  /**
   * The sections that are open, by their `value`, when the caller controls the
   * open state. Pass it together with `onValueChange`. A `value` here that
   * matches no section's `value` simply opens nothing, so a stale entry is
   * harmless rather than a crash.
   */
  value?: string[]
  /**
   * Called with the new list of open section values when the reader opens or
   * closes a section. The caller stores it and passes it back as `value`; with
   * `value` set and this omitted, the accordion cannot change and reads as fixed.
   */
  onValueChange?: (value: string[]) => void
  /**
   * Merged onto the root. Width, margin and place in a layout belong here. It is
   * the one route by which colour can reach an accordion, and the two-colour-axes
   * rule applies to it in full: an accordion takes neither a status nor a
   * category tint. A class you pass wins over the root's own where the two
   * conflict, because it is merged last.
   */
  className?: string
}

export function Accordion({
  items,
  multiple = false,
  defaultValue,
  value,
  onValueChange,
  className,
}: AccordionProps) {
  if (isDevelopment()) {
    if (!Array.isArray(items) || items.length === 0) {
      warnDev(
        "no-items",
        "[opsinjs] <Accordion> was rendered with no items, so it has nothing to " +
          "disclose. Pass the sections through the `items` prop, each with a " +
          "`value`, a `title` and its `content`.",
      )
    } else {
      const seen = new Set<string>()
      for (const item of items) {
        if (seen.has(item.value)) {
          warnDev(
            `duplicate-value:${String(item.value)}`,
            `[opsinjs] <Accordion> has two sections with value="${String(item.value)}". ` +
              "Section values must be unique, because they are how open state is " +
              "tracked; the second section will open and close with the first.",
          )
        }
        seen.add(item.value)
      }
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    return null
  }

  return (
    <BaseAccordion.Root
      data-slot="accordion"
      multiple={multiple}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (next) => onValueChange(next as string[]) : undefined}
      className={cn(ROOT, className)}
    >
      {items.map((item) => (
        <BaseAccordion.Item
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          data-slot="accordion-item"
          className={ITEM}
        >
          <BaseAccordion.Header data-slot="accordion-header" className="m-0">
            <BaseAccordion.Trigger data-slot="accordion-trigger" className={TRIGGER}>
              <span data-slot="accordion-title">{item.title}</span>
              <ChevronDown aria-hidden="true" className={CHEVRON} />
            </BaseAccordion.Trigger>
          </BaseAccordion.Header>
          <BaseAccordion.Panel data-slot="accordion-panel" className={PANEL}>
            {item.content}
          </BaseAccordion.Panel>
        </BaseAccordion.Item>
      ))}
    </BaseAccordion.Root>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is public,
 * reviewed code rather than a scratch demo. It shows a short set of questions and
 * answers with the first section open, which is the one thing worth seeing at a
 * glance: the headers read as an index a reader scans before opening any panel,
 * and the open section is lifted by nothing more than its revealed content and
 * the turned chevron. Read it in greyscale to check that no colour is doing the
 * work.
 *
 * The content is a fictional set of app questions (ADR 0012). No reading, no unit
 * and no clinical instruction, and nothing a reader would be harmed by not
 * opening, because a demo of a disclosure must not itself hide something that
 * ought to stay in view.
 */
export default function AccordionDemo() {
  return (
    <Accordion
      className="w-full max-w-md"
      defaultValue={["hours"]}
      items={[
        {
          value: "hours",
          title: "When can I reach the team?",
          content:
            "The example clinic in this demo answers messages on weekday mornings. This is placeholder copy, not a real opening time.",
        },
        {
          value: "records",
          title: "Where are my saved notes kept?",
          content:
            "Notes in this fictional app live on the device until you choose to share them. No real record is shown anywhere in this preview.",
        },
        {
          value: "export",
          title: "Can I export what I have entered?",
          content:
            "An export button would sit on the summary screen of the imagined app. This answer is sample text for the disclosure pattern only.",
        },
      ]}
    />
  )
}
