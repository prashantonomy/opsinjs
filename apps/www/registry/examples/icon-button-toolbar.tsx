import { Bell, MoreHorizontal, Search } from "lucide-react"

import { IconButton } from "@opsinjs/react"

export default function IconButtonToolbar() {
  return (
    <div className="flex items-center gap-opsin-1">
      <IconButton variant="quiet" icon={<Search />} label="Search example readings" />
      <IconButton variant="quiet" icon={<Bell />} label="Example reminders" />
      <IconButton
        variant="quiet"
        icon={<MoreHorizontal />}
        label="More actions for this example"
      />
    </div>
  )
}
