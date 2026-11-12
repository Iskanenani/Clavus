// The shapes of the rows the screens read. They mirror the tables and
// views in supabase/migrations.

export type VerdictKind = 'serves' | 'none' | 'contradicts' | 'unclear'

export const VERDICT_LABELS: Record<VerdictKind, string> = {
  serves: 'Serves a priority',
  none: 'Serves no priority',
  contradicts: 'Contradicts the strategy',
  unclear: 'Unclear',
}

export type Strategy = {
  id: string
  body: string
  validated_at: string | null
}

export type Priority = {
  id: string
  strategy_id: string
  slug: string
  kind: 'priority' | 'non_goal'
  statement: string
  position: number
}

// One row of the project_verdicts view.
export type ProjectVerdict = {
  project: string
  team: string | null
  item_count: number
  effort: number | null
  effort_unit: string | null
  verdict: VerdictKind | null // the verdict in force (override if any)
  priority_id: string | null
  model_verdict: VerdictKind | null
  model_priority_id: string | null
  quote: string | null
  reason: string | null
  error: string | null
  provider: string | null
  up_to_date: boolean
  stale: boolean
  reviewed: boolean
  review_reason: string | null
  reviewed_at: string | null
  reviewed_by: string | null
}

// One row of the effort_map() function.
export type MapRow = {
  bucket: string
  kind: 'priority' | 'none' | 'contradicts' | 'unclear' | 'not-judged'
  label: string
  projects: number
  items: number
  share: number
  effort: number | null
  effort_unit: string | null
}

export type Override = {
  id: string
  project: string
  from_verdict: VerdictKind | null
  to_verdict: VerdictKind
  from_priority_id: string | null
  to_priority_id: string | null
  reason: string
  changed_by_email: string | null
  changed_at: string
}

// "Win Germany and France: by the end of..." -> "Win Germany and France"
export function shortLabel(statement: string): string {
  const head = statement.split(':')[0]
  return head.length > 48 ? head.slice(0, 45) + '…' : head
}
