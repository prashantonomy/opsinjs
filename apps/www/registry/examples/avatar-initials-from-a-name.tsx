import { Avatar } from "@/registry/base-lyra/ui/avatar"

const NAMES = [
  {
    name: "Ada Vance",
    note: "Two names give two initials, the first and the last.",
  },
  { name: "Sol", note: "A single name gives a single initial." },
  {
    name: "अनीता",
    note: "A non-Latin name keeps its own script; the first character stands in.",
  },
] as const

export default function AvatarInitialsFromAName() {
  return (
    <ul className="m-0 flex list-none flex-col gap-opsin-4 p-0">
      {NAMES.map((person) => (
        <li key={person.name} className="flex items-center gap-opsin-3">
          <Avatar name={person.name} />
          <span className="text-opsin-footnote text-muted-foreground">
            {person.note}
          </span>
        </li>
      ))}
    </ul>
  )
}
