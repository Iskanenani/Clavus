import Papa from 'papaparse'
import { supabase, unwrap } from '../lib/supabase'
import { useQuery } from '../lib/useQuery'
import {
  shortLabel,
  VERDICT_LABELS,
  type Override,
  type Priority,
} from '../lib/types'

async function loadLog() {
  const overrides = unwrap(
    await supabase
      .from('overrides')
      .select('*')
      .order('changed_at', { ascending: false }),
  ) as Override[]
  const priorities = unwrap(
    await supabase.from('priorities').select('*'),
  ) as Priority[]
  return { overrides, priorities }
}

// Hands the browser a file to save, built from text.
function download(fileName: string, text: string) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }))
  link.download = fileName
  link.click()
  URL.revokeObjectURL(link.href)
}

export function LogScreen() {
  const { data, error, loading } = useQuery(loadLog, [])

  if (loading && !data) return <p className="muted">Loading the log…</p>
  if (error) return <p className="error">Could not load the log: {error}</p>
  if (!data) return null
  const { overrides, priorities } = data

  const name = (id: string | null) => {
    const priority = priorities.find((p) => p.id === id)
    return priority ? shortLabel(priority.statement) : ''
  }
  const describe = (verdict: string | null, priorityId: string | null) => {
    if (!verdict) return 'Not judged'
    const label = VERDICT_LABELS[verdict as keyof typeof VERDICT_LABELS]
    return name(priorityId) ? `${label}: ${name(priorityId)}` : label
  }
  const isConfirmation = (o: Override) =>
    o.from_verdict === o.to_verdict && o.from_priority_id === o.to_priority_id

  function exportCsv() {
    const rows = overrides.map((o) => ({
      when: o.changed_at,
      who: o.changed_by_email ?? '',
      project: o.project,
      action: isConfirmation(o) ? 'confirmed' : 'changed',
      from_verdict: o.from_verdict ?? '',
      from_priority: name(o.from_priority_id),
      to_verdict: o.to_verdict,
      to_priority: name(o.to_priority_id),
      reason: o.reason,
    }))
    download('clavus-review-log.csv', Papa.unparse(rows))
  }

  return (
    <section className="stack">
      <div className="row spread">
        <h1>Review log</h1>
        <button disabled={overrides.length === 0} onClick={exportCsv}>
          Export as CSV
        </button>
      </div>
      <p className="muted">
        Every verdict a person confirmed or changed. Entries cannot be edited or
        removed.
      </p>
      {overrides.length === 0 ? (
        <p className="notice">
          No reviews yet. Open a project on the map to confirm or change its
          verdict.
        </p>
      ) : (
        <div className="card scroll">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Project</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {overrides.map((o) => (
                <tr key={o.id}>
                  <td>{new Date(o.changed_at).toLocaleString()}</td>
                  <td>{o.changed_by_email}</td>
                  <td>{o.project}</td>
                  <td>{describe(o.from_verdict, o.from_priority_id)}</td>
                  <td>
                    {isConfirmation(o)
                      ? 'Confirmed'
                      : describe(o.to_verdict, o.to_priority_id)}
                  </td>
                  <td>{o.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
