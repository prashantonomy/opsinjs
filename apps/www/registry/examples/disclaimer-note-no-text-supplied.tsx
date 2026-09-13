/**
 * What the note does when nobody wrote it.
 *
 * THIS IS THE STATE THE COMPONENT EXISTS FOR, and it is the one a product is
 * most likely to ship by accident. Legal copy arrives from somewhere else: a
 * content service, a translation table, a flag that says whether the current
 * wording has been reviewed. Every one of those routes can return nothing
 * on a Tuesday afternoon without anybody noticing. A component that rendered
 * empty in that case would pass review, pass every gate in this repository, and
 * put a screen in front of a reader whose standing statement about what the
 * product is had silently gone missing.
 *
 * SO IT PRINTS AN ADMISSION, AND THE ADMISSION IS DELIBERATELY UNLOVELY. The
 * alternative is the one thing this system will not do: invent a sentence. A
 * disclaimer is a legal and clinical statement with a named owner, and a design
 * system is not that owner. It does not know the product, the jurisdiction,
 * the regulator or the reader. A default sentence from here would arrive in a
 * product whose author never read it, describing limits that product may not
 * have and omitting the ones it does, and it would arrive looking reviewed
 * because it came from a library.
 *
 * The line is also written so that nobody can mistake it for the real thing. It
 * says that something is missing; it does not say anything about the reader,
 * their data, or what the product can and cannot do.
 *
 * `EmptyState` refuses in exactly this shape and for exactly this reason, and
 * the two are worth reading together.
 */

import { DisclaimerNote } from "@/registry/base-lyra/ui/disclaimer-note"

export default function DisclaimerNoteNoTextSupplied() {
  return (
    <div className="w-full max-w-(--opsin-measure-comfortable,66ch)">
      {/* No children, which is what `{wording.forThisLocale}` looks like on the
          day the locale has no wording. A development warning names the same
          thing in the console, so an author working on the screen finds it
          before a reader does. */}
      <DisclaimerNote />
    </div>
  )
}
