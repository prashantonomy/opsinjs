"use client"

/**
 * Avatar is a picture or initials standing for a person, and never more than
 * that.
 *
 * IT ASSERTS A PERSON, NOT AN AUTHORITY. A face on a message says who, it does
 * not say on whose authority. The component draws the same neutral circle for
 * everyone, so nothing in the styling tells a reader that the person behind an
 * avatar is a clinician, a carer or a stranger. Who wrote a piece of health
 * guidance, and on whose authority, is a claim a product makes in words
 * through a citation, never a claim an avatar makes by looking official.
 * `source-citation` is where that claim belongs.
 *
 * THE NAME DRIVES EVERYTHING, AND IT IS REQUIRED. The `name` is the picture's
 * alt text and the source of the initials at once, so one field feeds both
 * paths and the two can never drift. A missing name is the mistake this
 * component is most likely to be shipped with, because a data layer returns
 * an empty string as readily as a real one, so an empty or whitespace only
 * name warns in development and falls back to a neutral person glyph rather
 * than rendering an unlabelled circle.
 *
 * THE FALLBACK IS A CHAIN, AND EACH STEP ASSERTS LESS THAN THE ONE BEFORE. A
 * supplied picture that loads is the most it can show. A picture that does not
 * load, or was never supplied, falls back to initials derived from the
 * name. A name that yields no initials, because it was empty, falls back to a
 * lucide `User` glyph, which says a person without saying which one. The
 * glyph is the floor, and it is reached only when there is neither a picture
 * nor a usable name.
 *
 * INITIALS ARE DERIVED CAREFULLY, BECAUSE NAMES ARE NOT ALL ONE SHAPE. A
 * two-part name gives the first character of the first part and the first
 * character of the last part. A single name gives a single character. A
 * non-Latin name keeps its own script, because uppercasing is a no-op in a
 * script without case and forcing a transliteration would be a guess. The
 * name is walked by Unicode code point rather than by UTF-16 unit, so a name
 * beginning with an astral character keeps its first character whole instead
 * of splitting a surrogate pair. The known limit is stated honestly here
 * rather than hidden: a grapheme cluster made of a base letter plus a
 * combining mark can still lose the mark, and adopting `Intl.Segmenter` is the
 * fix that has not been made.
 *
 * IT IS NOT A CONTROL. There is no `onClick`, no `href` and no
 * `role="button"`. An avatar presents a person and does nothing when it is
 * tapped. Where an avatar needs to open a menu or a profile, a wrapping
 * button or link owns the press and the focus, and the avatar rides along
 * inside it decoratively. Making the circle itself pressable is how a face
 * quietly becomes a control nobody can find by keyboard, which is why the
 * confused-with routing sends interactivity to `icon-button`.
 *
 * THE CHROME IS NEUTRAL, ON PURPOSE. A muted fill, a hairline boundary and a
 * full radius, and no colour from either health axis. A category tint would
 * say the person is a kind of measurement, and a status tint would say the
 * person is urgent, and a person is neither. The circle is the same neutral
 * mark whoever it stands for.
 *
 * WHAT IT DOES NOT DO. It does not fetch, cache, crop server-side, moderate,
 * or sanitise the `src`; the URL is spread onto a plain `img` and its trust
 * and its content are the product's. It does not animate. It does not measure
 * or gate its own contrast, and the page says the neutral pair it draws from
 * is published while its own rendered pixels are not.
 *
 * IS A CLIENT COMPONENT. It keeps a small piece of state, the `src` that
 * did not load, and handles the image's `onError` event, so it uses a hook
 * and cannot be a server component. That is the only reason.
 */

import { User } from "lucide-react"
import { useState } from "react"

import { isDevelopment } from "@/lib/opsinjs"
import { cn } from "@/lib/utils"

/**
 * The three diameters. Kept as a local type rather than a fourth public
 * export, for the reason `segmented-control.tsx` gives about its own option
 * shape: the registry contract fixes a file at three public exports, so a
 * consumer names this union as `AvatarProps["size"]` rather than importing a
 * fourth symbol.
 */
type AvatarSize = "sm" | "md" | "lg"

/**
 * Diameter and initials type step per size. Circle diameters come from the
 * space scale in rem, so an avatar grows with the reader's text size rather
 * than staying put at a pixel diameter. Nothing here is tappable, so no target
 * token is borrowed. Ink is set on the root as an arbitrary property below,
 * not here, so a type step and a colour never land in one tailwind-merge
 * group.
 */
const SIZE: Record<AvatarSize, string> = {
  sm: "size-opsin-8 text-opsin-caption1",
  md: "size-opsin-10 text-opsin-subheadline-emphasis",
  lg: "size-opsin-12 text-opsin-headline",
}

/**
 * The person glyph's own size per avatar size, written out because Tailwind
 * reads class names as literal strings.
 */
const GLYPH_SIZE: Record<AvatarSize, string> = {
  sm: "size-opsin-4",
  md: "size-opsin-5",
  lg: "size-opsin-6",
}

/**
 * The sizes as the object's own keys, so the runtime guard cannot answer yes
 * to "constructor" the way `size in SIZE` would.
 */
const SIZE_NAMES = Object.keys(SIZE) as AvatarSize[]

const MAX_INITIALS = 2

/**
 * Initials from a name, code point by code point. A two-part name gives first
 * and last; a single name gives one; a name that trims to nothing gives "".
 * `toLocaleUpperCase` is a no-op in a script without case, which is the
 * intended behaviour for a non-Latin name rather than a bug to work around.
 */
function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ""
  const first = Array.from(parts[0])[0] ?? ""
  const last =
    parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] ?? "") : ""
  return (first + last).toLocaleUpperCase().slice(0, MAX_INITIALS)
}

/**
 * Development warnings, said once per distinct offender. Nothing here has an
 * `OpsinErrorCode`: the codes in `tokens/errors.json` describe mistakes a
 * consumer makes with the clinical API, and an avatar asserts nothing
 * clinical. `segmented-control.tsx` keeps the same small set for the same
 * reason.
 */
const warned = new Set<string>()

function warnDev(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

export interface AvatarProps {
  /**
   * Required. The person this avatar stands for. It is the picture's alt text
   * and the source of the initials at once, so it can never say one thing to
   * a screen reader and another on screen. An empty or whitespace only name
   * is the mistake a data layer ships by accident: it warns in development
   * and falls back to a neutral person glyph rather than an unlabelled
   * circle.
   */
  name: string
  /**
   * The picture, when the product has one. opsinjs ships none: no default
   * image, no placeholder face. When it is absent, or when it does not load,
   * the avatar falls back to the initials and then to the person glyph. The
   * URL is used as given, so its trust and the content behind it are the
   * product's to own and to moderate.
   */
  src?: string
  /**
   * Diameter only. Three sizes, "sm", "md" and "lg", sized in rem so the
   * circle grows with the reader's text size. Defaults to "md". A value
   * outside the three is repaired to "md" and warned in development, because
   * an avatar is decorative chrome and there is no honest smaller or larger
   * reading to guess.
   */
  size?: AvatarSize
  /**
   * Merged onto the root. For layout only, such as a margin in a stack. A
   * category or status colour passed here is refused by the design rather
   * than by code: the chrome is neutral, and tinting a person from either
   * health axis is the bug the two-axes rule names.
   */
  className?: string
}

export function Avatar({ name, src, size, className }: AvatarProps) {
  const [erroredSrc, setErroredSrc] = useState<string | null>(null)

  const resolvedSize: AvatarSize =
    size !== undefined && SIZE_NAMES.includes(size) ? size : "md"

  const trimmedName = typeof name === "string" ? name.trim() : ""
  const hasName = trimmedName !== ""

  if (!hasName) {
    warnDev(
      "empty-name",
      "[opsinjs] <Avatar> was rendered with no name. `name` is both the " +
        "picture's alt text and the source of the initials, and a " +
        "whitespace only string counts as none. It has fallen back to a " +
        "neutral person glyph rather than an unlabelled circle.",
    )
  }

  if (size !== undefined && !SIZE_NAMES.includes(size)) {
    warnDev(
      `unknown-size-${String(size)}`,
      `[opsinjs] <Avatar size="${String(size)}"> is not one of "sm", "md" ` +
        'or "lg". It has fallen back to "md".',
    )
  }

  const showImage =
    typeof src === "string" && src.trim() !== "" && erroredSrc !== src
  const initials = hasName ? initialsFrom(trimmedName) : ""
  const showInitials = !showImage && initials !== ""
  const labelled = !showImage && hasName

  return (
    <span
      data-slot="avatar"
      role={labelled ? "img" : undefined}
      aria-label={labelled ? trimmedName : undefined}
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-border bg-muted [color:var(--muted-foreground)]",
        SIZE[resolvedSize],
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- a registry component ships into a consumer through shadcn add, so it renders a plain img rather than importing next/image, which would not travel with the file
        <img
          data-slot="avatar-image"
          src={src}
          alt={hasName ? trimmedName : ""}
          className="size-full rounded-full object-cover"
          onError={() => setErroredSrc(src ?? null)}
        />
      ) : (
        <span
          data-slot="avatar-fallback"
          aria-hidden="true"
          className="inline-flex items-center justify-center leading-none"
        >
          {showInitials ? (
            initials
          ) : (
            <User aria-hidden="true" className={GLYPH_SIZE[resolvedSize]} />
          )}
        </span>
      )}
    </span>
  )
}

/**
 * The zero-prop default export (ADR 0009).
 *
 * `/view` renders this with no props and `shadcn add` ships it, so it is
 * public, reviewed code rather than a scratch demo. It shows the one
 * distinction worth seeing: that the mark is initials at three sizes,
 * circular and neutral, and stands for a person. The people are fictional
 * (ADR 0012), the sizes are all valid and no `src` is passed, so it triggers
 * no development warning, and no two avatars share an accessible name. The
 * glyph tier is left to the fallback-chain example, because reaching it
 * needs an empty name, which would warn.
 */
const DEMO_PEOPLE = [
  { name: "Ada Vance", size: "sm" as const, caption: "Small, in a dense list" },
  { name: "Bruno Sol", size: "md" as const, caption: "Medium, the default" },
  { name: "Mei Ling", size: "lg" as const, caption: "Large, on a profile" },
]

export default function AvatarDemo() {
  return (
    <div className="flex flex-wrap items-end gap-opsin-6">
      {DEMO_PEOPLE.map((person) => (
        <div
          key={person.name}
          className="flex flex-col items-center gap-opsin-2"
        >
          <Avatar name={person.name} size={person.size} />
          <p className="m-0 text-opsin-caption1 text-muted-foreground">
            {person.caption}
          </p>
        </div>
      ))}
    </div>
  )
}
