import { useRef, useState, type FormEvent } from 'react'
import type { GoTo } from '../App'
import { WorkspaceIcon } from '../components/WorkspaceIcon'
import { supabase, unwrap } from '../lib/supabase'
import { useQuery } from '../lib/useQuery'
import type { Priority, Strategy } from '../lib/types'

// Reference names are generated for new priorities, rather than becoming
// another field the leader has to maintain. Existing names are kept on edit.
function slugFrom(statement: string): string {
  return statement
    .split(':')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-')
    .slice(0, 4)
    .join('-')
}

async function loadStrategy() {
  const strategy = unwrap(
    await supabase
      .from('strategies')
      .select('id, body, validated_at')
      .maybeSingle(),
  ) as Strategy | null
  const priorities = unwrap(
    await supabase.from('priorities').select('*').order('position'),
  ) as Priority[]
  const verdicts = await supabase
    .from('verdicts')
    .select('id', { count: 'exact', head: true })
  if (verdicts.error) throw new Error(verdicts.error.message)
  return { strategy, priorities, verdictCount: verdicts.count ?? 0 }
}

type Change = () => Promise<{ error: { message: string } | null }>
type Save = (statement: string) => Promise<boolean>

export function StrategyScreen({ goTo }: { goTo: GoTo }) {
  const { data, error, loading, reload } = useQuery(loadStrategy, [])
  const [actionError, setActionError] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [creating, setCreating] = useState(false)

  // Editors close only after success. Failed requests leave the draft intact.
  async function run(change: Change): Promise<boolean> {
    setActionError(null)
    try {
      const result = await change()
      if (result.error) throw new Error(result.error.message)
      reload()
      return true
    } catch (problem) {
      setActionError((problem as Error).message)
      return false
    }
  }

  if (loading && !data) return <p className="muted">Loading the strategy…</p>
  if (error)
    return (
      <p className="error" role="alert">
        Could not load the strategy: {error}
      </p>
    )
  if (!data) return null
  const { strategy, priorities, verdictCount } = data

  if (!strategy) {
    return (
      <section className="stack">
        <div className="workspace-page-heading">
          <h1>Strategy</h1>
          <p>Set the direction the work will be reviewed against.</p>
        </div>
        {actionError && (
          <p className="error" role="alert">
            {actionError}
          </p>
        )}
        <div className="strategy-empty">
          <WorkspaceIcon name="strategy" />
          <h2>Start with a shared direction.</h2>
          <p>
            Describe the company, name its priorities, and be explicit about
            what it will not do.
          </p>
          <button
            className="primary"
            disabled={creating}
            onClick={async () => {
              setCreating(true)
              await run(async () =>
                supabase.from('strategies').insert({ body: '' }),
              )
              setCreating(false)
            }}
          >
            {creating ? 'Creating…' : 'Create the strategy'}
          </button>
        </div>
      </section>
    )
  }

  const validated = strategy.validated_at !== null
  const goalCount = priorities.filter((p) => p.kind === 'priority').length
  const nonGoalCount = priorities.filter((p) => p.kind === 'non_goal').length
  const nextPosition = Math.max(-1, ...priorities.map((p) => p.position)) + 1
  const date = strategy.validated_at
    ? new Date(strategy.validated_at).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  async function validate() {
    setValidating(true)
    await run(async () => {
      const { data: auth, error } = await supabase.auth.getUser()
      if (error) return { error }
      return supabase
        .from('strategies')
        .update({
          validated_at: new Date().toISOString(),
          validated_by: auth.user?.id,
        })
        .eq('id', strategy!.id)
    })
    setValidating(false)
  }

  return (
    <section className="strategy-screen">
      <div className="strategy-page-header">
        <div className="workspace-page-heading">
          <h1>Strategy</h1>
          <p>The shared direction behind every project decision.</p>
        </div>
        <span
          className={`strategy-status ${validated ? 'is-validated' : 'is-draft'}`}
        >
          <span aria-hidden="true">{validated ? '✓' : '○'}</span>
          {validated ? 'Validated reference' : 'Awaiting validation'}
        </span>
      </div>
      {actionError && (
        <p className="error" role="alert">
          Could not save: {actionError}
        </p>
      )}
      <div className="strategy-summary" aria-label="Strategy at a glance">
        <span>
          <strong>{goalCount}</strong> Strategic priorities
        </span>
        <span>
          <strong>{nonGoalCount}</strong> Explicit non-goals
        </span>
        <span>
          <strong>{verdictCount}</strong> Project judgements
        </span>
        {date && (
          <span className="strategy-summary-date">Validated {date}</span>
        )}
      </div>

      <BodyEditor
        body={strategy.body}
        validated={validated}
        verdictCount={verdictCount}
        onSave={(body) =>
          run(async () =>
            supabase.from('strategies').update({ body }).eq('id', strategy.id),
          )
        }
      />

      <div className="strategy-columns">
        <ReferenceList
          kind="priority"
          priorities={priorities.filter((p) => p.kind === 'priority')}
          validated={validated}
          verdictCount={verdictCount}
          onSave={(statement, initial) =>
            initial
              ? run(async () =>
                  supabase
                    .from('priorities')
                    .update({ statement })
                    .eq('id', initial.id),
                )
              : run(async () =>
                  supabase.from('priorities').insert({
                    strategy_id: strategy.id,
                    kind: 'priority',
                    statement,
                    slug: slugFrom(statement),
                    position: nextPosition,
                  }),
                )
          }
          onDelete={(priority) =>
            run(async () =>
              supabase.from('priorities').delete().eq('id', priority.id),
            )
          }
        />
        <aside className="strategy-aside">
          <ReferenceList
            kind="non_goal"
            priorities={priorities.filter((p) => p.kind === 'non_goal')}
            validated={validated}
            verdictCount={verdictCount}
            onSave={(statement, initial) =>
              initial
                ? run(async () =>
                    supabase
                      .from('priorities')
                      .update({ statement })
                      .eq('id', initial.id),
                  )
                : run(async () =>
                    supabase.from('priorities').insert({
                      strategy_id: strategy.id,
                      kind: 'non_goal',
                      statement,
                      slug: slugFrom(statement),
                      position: nextPosition,
                    }),
                  )
            }
            onDelete={(priority) =>
              run(async () =>
                supabase.from('priorities').delete().eq('id', priority.id),
              )
            }
          />
          <div className="strategy-validation">
            <span className="strategy-validation-icon" aria-hidden="true">
              <WorkspaceIcon name={validated ? 'judge' : 'strategy'} />
            </span>
            <h2>
              {validated
                ? 'A reference you can work from.'
                : 'Ready to set the direction?'}
            </h2>
            <p>
              {validated
                ? 'Projects are reviewed against this validated strategy. You can inspect and correct every judgement on the map.'
                : 'Validate the reference when the priorities and boundaries reflect the leader’s direction.'}
            </p>
            {!validated && (
              <p className="small muted">
                {goalCount === 0
                  ? 'Add at least one priority before validating.'
                  : verdictCount > 0
                    ? 'Existing judgements will need to be reviewed against the updated strategy.'
                    : 'Projects can be judged once the strategy is validated.'}
              </p>
            )}
            {validated ? (
              <button onClick={() => goTo('map')}>
                View alignment map <WorkspaceIcon name="arrow" />
              </button>
            ) : (
              <button
                className="primary"
                disabled={validating || goalCount === 0}
                onClick={validate}
              >
                {validating ? 'Validating…' : 'Validate strategy'}
                <WorkspaceIcon name="judge" />
              </button>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

function ChangeNote({
  validated,
  verdictCount,
}: {
  validated: boolean
  verdictCount: number
}) {
  if (!validated) return null
  return (
    <p className="strategy-change-note">
      Saving changes withdraws the current validation
      {verdictCount > 0
        ? ` and marks ${verdictCount} project ${verdictCount === 1 ? 'judgement' : 'judgements'} for review`
        : ''}
      .
    </p>
  )
}

function BodyEditor({
  body,
  onSave,
  validated,
  verdictCount,
}: {
  body: string
  onSave: Save
  validated: boolean
  verdictCount: number
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(body)
  const [busy, setBusy] = useState(false)
  const editButton = useRef<HTMLButtonElement>(null)
  function closeEditor() {
    setEditing(false)
    requestAnimationFrame(() => editButton.current?.focus())
  }
  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    if (await onSave(draft.trim())) closeEditor()
    setBusy(false)
  }
  return (
    <div className="strategy-context">
      <div className="strategy-section-heading">
        <div>
          <span className="strategy-overline">The reference</span>
          <h2>Company direction</h2>
        </div>
        {!editing && (
          <button
            ref={editButton}
            className="strategy-edit-button"
            onClick={() => {
              setDraft(body)
              setEditing(true)
            }}
          >
            <WorkspaceIcon name="edit" />
            Edit overview
          </button>
        )}
      </div>
      {editing ? (
        <form className="strategy-inline-editor" onSubmit={save}>
          <label>
            Strategy overview
            <textarea
              aria-label="Strategy overview"
              disabled={busy}
              autoFocus
              rows={7}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Who the company is and where it is going."
            />
          </label>
          <ChangeNote validated={validated} verdictCount={verdictCount} />
          <div className="row">
            <button
              className="primary"
              disabled={busy || draft.trim() === body.trim()}
            >
              {busy ? 'Saving…' : 'Save overview'}
            </button>
            <button type="button" disabled={busy} onClick={closeEditor}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="strategy-body">
          {body.trim() ? (
            body
              .split(/\n\s*\n/)
              .map((paragraph, index) => <p key={index}>{paragraph}</p>)
          ) : (
            <p className="muted">
              Describe the company and the direction it has chosen.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

type ReferenceListProps = {
  kind: Priority['kind']
  priorities: Priority[]
  validated: boolean
  verdictCount: number
  onSave: (statement: string, initial?: Priority) => Promise<boolean>
  onDelete: (priority: Priority) => Promise<boolean>
}

function ReferenceList({
  kind,
  priorities,
  validated,
  verdictCount,
  onSave,
  onDelete,
}: ReferenceListProps) {
  const [adding, setAdding] = useState(false)
  const addButton = useRef<HTMLButtonElement>(null)
  function closeEditor() {
    setAdding(false)
    requestAnimationFrame(() => addButton.current?.focus())
  }
  const isGoal = kind === 'priority'
  return (
    <section
      className={`strategy-reference-list ${isGoal ? 'strategy-goals' : 'strategy-boundaries'}`}
      aria-label={isGoal ? 'Strategic priorities' : 'What we will not do'}
    >
      <div className="strategy-section-heading">
        <div>
          <h2>
            {isGoal ? 'Strategic priorities' : 'What we will not do'}
            <span className="strategy-count">{priorities.length}</span>
          </h2>
          <p>
            {isGoal
              ? 'Where we choose to put our effort.'
              : 'The boundaries that keep us on course.'}
          </p>
        </div>
        {isGoal && !adding && (
          <button ref={addButton} onClick={() => setAdding(true)}>
            <WorkspaceIcon name="plus" />
            Add priority
          </button>
        )}
      </div>
      <div className="strategy-reference-items">
        {priorities.map((priority, index) => (
          <PriorityItem
            key={priority.id}
            priority={priority}
            index={index}
            validated={validated}
            verdictCount={verdictCount}
            onSave={(statement) => onSave(statement, priority)}
            onDelete={() => onDelete(priority)}
          />
        ))}
      </div>
      {priorities.length === 0 && !adding && (
        <p className="strategy-list-empty">
          {isGoal
            ? 'No priorities yet. Start with one clear commitment.'
            : 'Add the things the company has explicitly ruled out.'}
        </p>
      )}
      {adding ? (
        <PriorityEditor
          kind={kind}
          validated={validated}
          verdictCount={verdictCount}
          onSave={(statement) => onSave(statement)}
          onClose={closeEditor}
        />
      ) : (
        !isGoal && (
          <button
            ref={addButton}
            className="strategy-add-button"
            onClick={() => setAdding(true)}
          >
            <WorkspaceIcon name="plus" />
            {isGoal ? 'Add priority' : 'Add non-goal'}
          </button>
        )
      )}
    </section>
  )
}

function PriorityItem({
  priority,
  index,
  validated,
  verdictCount,
  onSave,
  onDelete,
}: {
  priority: Priority
  index: number
  validated: boolean
  verdictCount: number
  onSave: Save
  onDelete: () => Promise<boolean>
}) {
  const [editing, setEditing] = useState(false)
  const editButton = useRef<HTMLButtonElement>(null)
  function closeEditor() {
    setEditing(false)
    requestAnimationFrame(() => editButton.current?.focus())
  }
  const separator = priority.statement.indexOf(':')
  const title =
    separator < 0 ? priority.statement : priority.statement.slice(0, separator)
  const detail =
    separator < 0 ? null : priority.statement.slice(separator + 1).trim()
  const isGoal = priority.kind === 'priority'
  if (editing)
    return (
      <div className="strategy-editing-item">
        <PriorityEditor
          kind={priority.kind}
          initial={priority}
          validated={validated}
          verdictCount={verdictCount}
          onSave={onSave}
          onDelete={onDelete}
          onClose={closeEditor}
        />
      </div>
    )
  return (
    <article className="strategy-priority">
      <span className="strategy-priority-number" aria-hidden="true">
        {isGoal ? String(index + 1).padStart(2, '0') : '−'}
      </span>
      <div>
        <h3>{title}</h3>
        {detail && <p>{detail}</p>}
      </div>
      <button
        ref={editButton}
        className="strategy-item-edit"
        aria-label={`Edit ${isGoal ? 'priority' : 'non-goal'}: ${title}`}
        onClick={() => setEditing(true)}
      >
        <WorkspaceIcon name="edit" />
      </button>
    </article>
  )
}

function PriorityEditor({
  kind,
  initial,
  validated,
  verdictCount,
  onSave,
  onDelete,
  onClose,
}: {
  kind: Priority['kind']
  initial?: Priority
  validated: boolean
  verdictCount: number
  onSave: Save
  onDelete?: () => Promise<boolean>
  onClose: () => void
}) {
  const [statement, setStatement] = useState(initial?.statement ?? '')
  const [busy, setBusy] = useState<'saving' | 'deleting' | null>(null)
  const isGoal = kind === 'priority'
  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy('saving')
    if (await onSave(statement.trim())) onClose()
    setBusy(null)
  }
  return (
    <form className="strategy-inline-editor" onSubmit={save}>
      <label>
        {isGoal ? 'Priority statement' : 'Non-goal statement'}
        <textarea
          aria-label={isGoal ? 'Priority statement' : 'Non-goal statement'}
          disabled={busy !== null}
          autoFocus
          rows={4}
          value={statement}
          onChange={(event) => setStatement(event.target.value)}
          placeholder={
            isGoal
              ? 'What will the company pursue, and what would success look like?'
              : 'What has the company explicitly decided not to do?'
          }
        />
      </label>
      <ChangeNote validated={validated} verdictCount={verdictCount} />
      <div className="strategy-editor-actions">
        <button
          className="primary"
          disabled={
            busy !== null ||
            !statement.trim() ||
            statement.trim() === initial?.statement
          }
        >
          {busy === 'saving'
            ? 'Saving…'
            : initial
              ? 'Save changes'
              : isGoal
                ? 'Add priority'
                : 'Add non-goal'}
        </button>
        <button type="button" disabled={busy !== null} onClick={onClose}>
          Cancel
        </button>
        {onDelete && (
          <button
            type="button"
            className="link danger"
            disabled={busy !== null}
            onClick={async () => {
              setBusy('deleting')
              if (await onDelete()) onClose()
              setBusy(null)
            }}
          >
            {busy === 'deleting'
              ? 'Deleting…'
              : isGoal
                ? 'Delete priority'
                : 'Delete non-goal'}
          </button>
        )}
      </div>
    </form>
  )
}
