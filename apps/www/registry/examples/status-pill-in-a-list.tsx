/**
 * The primary use: making status scannable down a column.
 *
 * The rule this demonstrates is the escalation budget. Four rows, and exactly
 * one of them is `urgent`. A screen with two urgent pills has taught its
 * reader that red means nothing, and that lesson does not wear off. If a
 * product's own rules produce two, the screen needs an AlertBanner about the
 * more serious one, not a second pill.
 *
 * The measurements are deliberately fictional and carry no numbers at all. A
 * screenshot of an opsinjs example must never be mistakable for somebody's
 * result.
 */

import { StatusPill } from "@/registry/base-lyra/ui/status-pill"

const ROWS = [
  { subject: "First example measurement", status: "steady" },
  { subject: "Second example measurement", status: "watch" },
  { subject: "Third example measurement", status: "attention" },
  { subject: "Fourth example measurement", status: "urgent" },
] as const

export default function StatusPillInAList() {
  return (
    <ul className="m-0 flex w-full max-w-md list-none flex-col gap-opsin-2 p-0">
      {ROWS.map((row) => (
        <li
          key={row.subject}
          className="flex items-center justify-between gap-opsin-4 border-b border-border py-opsin-2 text-opsin-body"
        >
          <span>{row.subject}</span>
          <StatusPill status={row.status} describes={row.subject} />
        </li>
      ))}
    </ul>
  )
}
