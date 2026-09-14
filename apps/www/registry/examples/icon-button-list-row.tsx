import { Pencil, X } from "lucide-react"

import { IconButton } from "@/registry/base-lyra/ui/icon-button"

export default function IconButtonListRow() {
  return (
    <ul className="flex w-full max-w-sm flex-col gap-opsin-1">
      <li className="flex items-center justify-between gap-opsin-2 rounded-opsin-md border border-border bg-card px-opsin-3 py-opsin-2">
        <span className="text-opsin-body [color:var(--foreground)]">
          Morning example reading
        </span>
        <span className="flex items-center gap-opsin-0-5">
          <IconButton
            variant="quiet"
            size="sm"
            icon={<Pencil />}
            label="Edit the morning example reading"
          />
          <IconButton
            variant="quiet"
            size="sm"
            icon={<X />}
            label="Remove the morning example reading"
          />
        </span>
      </li>
      <li className="flex items-center justify-between gap-opsin-2 rounded-opsin-md border border-border bg-card px-opsin-3 py-opsin-2">
        <span className="text-opsin-body [color:var(--foreground)]">
          Evening example reading
        </span>
        <span className="flex items-center gap-opsin-0-5">
          <IconButton
            variant="quiet"
            size="sm"
            icon={<Pencil />}
            label="Edit the evening example reading"
          />
          <IconButton
            variant="quiet"
            size="sm"
            icon={<X />}
            label="Remove the evening example reading"
          />
        </span>
      </li>
    </ul>
  )
}
