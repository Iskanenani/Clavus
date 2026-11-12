import { useState } from 'react'
import { supabase, unwrap } from '../lib/supabase'
import { useQuery } from '../lib/useQuery'
import {
  shortLabel,
  VERDICT_LABELS,
  type Priority,
  type ProjectVerdict,
  type VerdictKind,
} from '../lib/types'

type Item = {
  id: number
  title: string
  description: string
  status: string | null
}

// One project: why it was judged that way, its work items, and the
// review (confirm or change) of FEATURES.md step 7.
export function ProjectPanel(props: {
  project: ProjectVerdict
  priorities: Priority[]
  onClose: () => void
  onChanged: () => void
}) {
  const { project, priorities } = props
  const items = useQuery(
    async () =>
      unwrap(
        await supabase
          .from('work_items')
          .select('id, title, description, status')
          .eq('parent', project.project)
          .order('id'),
      ) as Item[],
    [project.project],
  )

  const [editing, setEditing] = useState(false)
  const [verdict, setVerdict] = useState<VerdictKind>(project.verdict ?? 'none')
  const [priorityId, setPriorityId] = useState(project.priority_id ?? '')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const name = (id: string | null) => {
    const priority = priorities.find((p) => p.id === id)
    return priority ? shortLabel(priority.statement) : null
  }
  // A project can serve a priority only; it can contradict either kind.
  const needsPriority = verdict === 'serves' || verdict === 'contradicts'
  const choices = priorities.filter(
    (p) => verdict === 'contradicts' || p.kind === 'priority',
  )

  // Every review is one new row in the overrides log. Confirming logs a
  // row whose "to" equals its "from".
  async function logReview(
    toVerdict: VerdictKind,
    toPriority: string | null,
    why: string,
  ) {
    const { error } = await supabase.from('overrides').insert({
      project: project.project,
      from_verdict: project.verdict,
      from_priority_id: project.priority_id,
      to_verdict: toVerdict,
      to_priority_id: toPriority,
      reason: why,
    })
    if (error) return setError(error.message)
    setEditing(false)
    setReason('')
    setError(null)
    props.onChanged()
  }

  return (
    <div className="overlay" onClick={props.onClose}>
      <aside className="panel stack" onClick={(e) => e.stopPropagation()}>
        <div className="row spread">
          <h2>{project.project}</h2>
          <button className="link" onClick={props.onClose}>
            Close
          </button>
        </div>
        <p className="muted">
          {project.team} · {project.item_count} work items
          {project.effort !== null &&
            ` · ${project.effort} ${project.effort_unit}`}
        </p>

        {project.verdict === null ? (
          <p className="notice">
            {project.error
              ? `The last attempt to judge this project failed: ${project.error}`
              : 'This project has not been judged yet.'}
          </p>
        ) : (
          <div className="stack">
            <div className="row">
              <span className={`badge ${project.verdict}`}>
                {VERDICT_LABELS[project.verdict]}
              </span>
              {name(project.priority_id) && (
                <strong>{name(project.priority_id)}</strong>
              )}
              {project.stale && (
                <span className="badge unclear">Out of date</span>
              )}
            </div>
            {project.reviewed && (
              <p className="muted">
                {project.model_verdict === project.verdict &&
                project.model_priority_id === project.priority_id
                  ? 'Confirmed'
                  : `Changed from “${project.model_verdict ? VERDICT_LABELS[project.model_verdict] : 'not judged'}”`}{' '}
                by {project.reviewed_by ?? 'a reviewer'} on{' '}
                {new Date(project.reviewed_at!).toLocaleString()}:{' '}
                {project.review_reason}
              </p>
            )}
            {project.quote && (
              <blockquote>
                {project.quote}
                <footer>The strategy line the model quoted</footer>
              </blockquote>
            )}
            {project.reason && (
              <p>
                <strong>Model’s reason:</strong> {project.reason}
              </p>
            )}
          </div>
        )}

        {project.verdict !== null && !editing && (
          <div className="row">
            <button
              className="primary"
              onClick={() =>
                logReview(project.verdict!, project.priority_id, 'Confirmed')
              }
            >
              Confirm this verdict
            </button>
            <button onClick={() => setEditing(true)}>Change it</button>
          </div>
        )}
        {project.verdict === null && !editing && (
          <button className="fit" onClick={() => setEditing(true)}>
            Set a verdict by hand
          </button>
        )}

        {editing && (
          <div className="card stack">
            <label>
              Verdict
              <select
                value={verdict}
                onChange={(e) => setVerdict(e.target.value as VerdictKind)}
              >
                {Object.entries(VERDICT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {needsPriority && (
              <label>
                {verdict === 'serves'
                  ? 'Which priority'
                  : 'Which priority or “will not do” item'}
                <select
                  value={priorityId}
                  onChange={(e) => setPriorityId(e.target.value)}
                >
                  <option value="">— choose —</option>
                  {choices.map((p) => (
                    <option key={p.id} value={p.id}>
                      {shortLabel(p.statement)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Why (kept in the review log)
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <div className="row">
              <button
                className="primary"
                disabled={
                  reason.trim() === '' ||
                  (needsPriority && !choices.some((p) => p.id === priorityId))
                }
                onClick={() =>
                  logReview(
                    verdict,
                    needsPriority ? priorityId : null,
                    reason.trim(),
                  )
                }
              >
                Save the change
              </button>
              <button className="link" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {error && <p className="error">{error}</p>}

        <h3>Work items</h3>
        {items.loading && <p className="muted">Loading…</p>}
        {items.error && <p className="error">{items.error}</p>}
        <ul className="items">
          {items.data?.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              {item.status && <span className="muted"> · {item.status}</span>}
              {item.description && (
                <div className="muted">{item.description}</div>
              )}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
