/**
 * THROWAWAY — pipeline proof only (brief §0.6). Replaced in Phase 2.
 *
 * It exists to answer four questions before anything is designed:
 * does `findBuilt()` see a flat file here, does `REGISTRY_INDEX` gain exactly
 * one entry, does `/view/base/base-lyra/component/status-pill` render with
 * `data-opsin-view-state="ready"`, and does the emitted
 * `ComponentType<Record<string, unknown>>` typing accept a zero-prop default
 * export. Nothing here is the specification.
 */

export interface StatusPillProps {
  /** Placeholder. The real interface arrives in Phase 2. */
  label: string
}

export function StatusPill({ label }: StatusPillProps) {
  return <span data-slot="status-pill">{label}</span>
}

export default function StatusPillDemo() {
  return <StatusPill label="Pipeline proof" />
}
