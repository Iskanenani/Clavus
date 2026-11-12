// Turning any tracker's export into the common format (FEATURES.md).
// Pure functions: no screen and no database, so they can be tested alone.

export const COMMON_FIELDS = [
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description', required: true },
  { key: 'parent', label: 'Parent (project or epic)', required: true },
  { key: 'team', label: 'Team', required: false },
  { key: 'effort', label: 'Effort', required: false },
  { key: 'status', label: 'Status', required: false },
] as const

export type FieldKey = (typeof COMMON_FIELDS)[number]['key']

// Which column of the file feeds each field ('' = not mapped).
export type Mapping = Record<FieldKey, string>

export type CommonItem = {
  title: string
  description: string
  parent: string
  team: string | null
  effort: number | null
  status: string | null
}

// Column names trackers commonly use, to pre-fill the mapping screen.
// The user can always change the guess.
const SYNONYMS: Record<FieldKey, string[]> = {
  title: ['title', 'summary', 'name', 'task', 'subject'],
  description: ['description', 'details', 'notes', 'body'],
  parent: ['parent', 'epic name', 'epic', 'project', 'epic link', 'initiative'],
  team: ['team', 'squad', 'department', 'group'],
  effort: ['effort', 'estimate', 'story points', 'points', 'hours', 'days'],
  status: ['status', 'state', 'stage'],
}

export function guessMapping(columns: string[]): Mapping {
  const mapping = {} as Mapping
  for (const field of COMMON_FIELDS) {
    const match = SYNONYMS[field.key]
      .map((name) =>
        columns.find((column) => column.trim().toLowerCase() === name),
      )
      .find(Boolean)
    mapping[field.key] = match ?? ''
  }
  return mapping
}

// Applies the mapping. Returns the items plus every problem found, in
// words a user can act on. Nothing is stored while there are errors.
export function mapRows(
  rows: Record<string, string>[],
  mapping: Mapping,
): { items: CommonItem[]; errors: string[] } {
  const errors: string[] = []

  for (const field of COMMON_FIELDS) {
    if (field.required && !mapping[field.key]) {
      errors.push(`Choose the column that holds "${field.label}".`)
    }
  }
  if (errors.length > 0) return { items: [], errors }

  const cell = (row: Record<string, string>, key: FieldKey) =>
    mapping[key] ? (row[mapping[key]] ?? '').trim() : ''

  const items = rows.map((row, index) => {
    const line = index + 2 // +1 for the header row, +1 because people count from 1
    const title = cell(row, 'title')
    const parent = cell(row, 'parent')
    const effortText = cell(row, 'effort')
    const effort =
      effortText === '' ? null : Number(effortText.replace(',', '.'))

    if (!title) errors.push(`Line ${line}: the title is empty.`)
    if (!parent) errors.push(`Line ${line}: the parent is empty.`)
    if (effort !== null && Number.isNaN(effort)) {
      errors.push(`Line ${line}: effort "${effortText}" is not a number.`)
    }
    return {
      title,
      description: cell(row, 'description'), // may be empty, the column must exist
      parent,
      team: cell(row, 'team') || null,
      effort,
      status: cell(row, 'status') || null,
    }
  })
  return { items, errors }
}
