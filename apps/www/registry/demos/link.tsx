import { Link } from "@opsinjs/react"

/**
 * The zero-prop demo /view renders (ADR 0009, as amended by ADR 0030).
 *
 * `/view` renders this with no props and the component's page shows it, so it
 * is public, reviewed code rather than a scratch demo. It shows all three
 * emphases together on a neutral ground, because the only question worth
 * answering at a glance is whether the ladder reads as a ladder: an underline
 * inside a sentence, a bordered action, and a quieter one beside it, each
 * meeting the target floor and each taking the focus ring on keyboard focus.
 *
 * The labels name a fictional destination (ADR 0012). No number, no unit, and no
 * "click here": every label reads on its own out of a link list.
 */
export default function LinkDemo() {
  return (
    <div className="flex flex-col gap-opsin-4">
      <p className="m-0 text-opsin-body">
        Your readings are yours to keep, and you can{" "}
        <Link href="#example-destination" emphasis="inline">
          read how this example measurement is worked out
        </Link>{" "}
        before you share them.
      </p>
      <Link href="#example-destination" emphasis="action" className="self-start">
        Book a repeat example appointment
      </Link>
      <Link href="#example-destination" emphasis="secondary" className="self-start">
        Read about this example measurement
      </Link>
    </div>
  )
}
