import { Avatar } from "@/registry/base-lyra/ui/avatar"

// A synthetic silhouette, not a photograph of anyone. It exists only to show
// the tier where a picture loads. opsinjs ships no image of a real person.
const SYNTHETIC_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='96' height='96' fill='%23aeb9c2'/%3E%3Ccircle cx='48' cy='38' r='16' fill='%23f4f6f8'/%3E%3Crect x='20' y='58' width='56' height='38' rx='19' fill='%23f4f6f8'/%3E%3C/svg%3E"

// The last row passes an empty name on purpose, to reach the neutral person
// glyph. That warns in development, which is the honest signal for a person
// with no name, so the warning is expected here rather than a defect to
// silence.
const TIERS = [
  {
    name: "Ada Vance",
    src: SYNTHETIC_IMAGE,
    note: "A picture, when the product supplies one.",
  },
  { name: "Bruno Sol", src: undefined, note: "Initials, when there is no picture." },
  {
    name: "",
    src: undefined,
    note: "A neutral person, when there is neither a picture nor a name.",
  },
] as const

export default function AvatarTheFallbackChain() {
  return (
    <ul className="m-0 flex list-none flex-col gap-opsin-4 p-0">
      {TIERS.map((tier) => (
        <li key={tier.note} className="flex items-center gap-opsin-3">
          <Avatar name={tier.name} src={tier.src} size="lg" />
          <span className="text-opsin-footnote text-muted-foreground">
            {tier.note}
          </span>
        </li>
      ))}
    </ul>
  )
}
