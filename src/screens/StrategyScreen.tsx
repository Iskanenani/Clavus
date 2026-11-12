import { useState } from 'react'
import { supabase, unwrap } from '../lib/supabase'
import { useQuery } from '../lib/useQuery'
import type { Priority, Strategy } from '../lib/types'

type Kind = Priority['kind']

// "Win Germany and France: by..." -> "win-germany-and-france"
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
  return { strategy, priorities, verdictCount: verdicts.count ?? 0 }
}

export function StrategyScreen() {
  const { data, error, loading, reload } = useQuery(loadStrategy, [])
  const [actionError, setActionError] = useState<string | null>(null)

  // Runs one change, then reloads. Any failure is shown at the top.
  async function run(
    change: () => Promise<{ error: { message: string } | null }>,
  ) {
    const { error } = await change()
    setActionError(error ? error.message : null)
    reload()
  }

  if (loading && !data) return <p className="muted">Loading the strategy…</p>
  if (error)
    return <p className="error">Could not load the strategy: {error}</p>
  if (!data) return null
  const { strategy, priorities, verdictCount } = data

  if (!strategy) {
    return (
      <section className="stack">
        <h1>Strategy</h1>
        <p className="notice">No strategy yet. Start by writing it down.</p>
        <button
          className="primary fit"
          onClick={() =>
            run(async () => supabase.from('strategies').insert({ body: '' }))
          }
        >
          Create the strategy
        </button>
      </section>
    )
  }

  const validated = strategy.validated_at !== null
  const hasPriority = priorities.some((p) => p.kind === 'priority')
  const nextPosition = Math.max(-1, ...priorities.map((p) => p.position)) + 1

  return (
    <section className="stack">
      <div className="row spread">
        <h1>Strategy</h1>
        {validated ? (
          <span className="badge serves">
            Validated on {new Date(strategy.validated_at!).toLocaleDateString()}
          </span>
        ) : (
          <span className="badge unclear">Not validated</span>
        )}
      </div>

      {actionError && <p className="error">{actionError}</p>}
      {validated && verdictCount > 0 && (
        <p className="notice">
          This strategy is validated and {verdictCount} verdicts rest on it. Any
          edit withdraws the validation and marks those verdicts as out of date.
        </p>
      )}

      <BodyEditor
        body={strategy.body}
        onSave={(body) =>
          run(async () =>
            supabase.from('strategies').update({ body }).eq('id', strategy.id),
          )
        }
      />

      {(['priority', 'non_goal'] as Kind[]).map((kind) => (
        <div className="card stack" key={kind}>
          <h2>{kind === 'priority' ? 'Priorities' : 'What we will not do'}</h2>
          {priorities.filter((p) => p.kind === kind).length === 0 && (
            <p className="muted">None yet.</p>
          )}
          {priorities
            .filter((p) => p.kind === kind)
            .map((priority) => (
              <LineEditor
                key={priority.id}
                initial={priority}
                onSave={(slug, statement) =>
                  run(async () =>
                    supabase
                      .from('priorities')
                      .update({ slug, statement })
                      .eq('id', priority.id),
                  )
                }
                onDelete={() =>
                  run(async () =>
                    supabase.from('priorities').delete().eq('id', priority.id),
                  )
                }
              />
            ))}
          <LineEditor
            key={`new-${kind}-${priorities.length}`}
            onSave={(slug, statement) =>
              run(async () =>
                supabase.from('priorities').insert({
                  strategy_id: strategy.id,
                  kind,
                  slug: slug || slugFrom(statement),
                  statement,
                  position: nextPosition,
                }),
              )
            }
          />
        </div>
      ))}

      <div className="card row spread">
        <div>
          <strong>Validation by the leader</strong>
          <p className="muted">
            Projects can only be judged against a validated strategy.
            {!hasPriority && ' Add at least one priority first.'}
          </p>
        </div>
        <button
          className="primary"
          disabled={validated || !hasPriority}
          onClick={() =>
            run(async () => {
              const { data: auth } = await supabase.auth.getUser()
              return supabase
                .from('strategies')
                .update({
                  validated_at: new Date().toISOString(),
                  validated_by: auth.user?.id,
                })
                .eq('id', strategy.id)
            })
          }
        >
          {validated ? 'Validated' : 'Validate this strategy'}
        </button>
      </div>
    </section>
  )
}

function BodyEditor({
  body,
  onSave,
}: {
  body: string
  onSave: (body: string) => void
}) {
  const [draft, setDraft] = useState(body)
  return (
    <div className="card stack">
      <h2>The strategy in the leader’s words</h2>
      <textarea
        rows={7}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Who the company is, where it stands, what the next years are about."
      />
      <button
        className="fit"
        disabled={draft === body}
        onClick={() => onSave(draft)}
      >
        Save text
      </button>
    </div>
  )
}

// One priority or non-goal. Without `initial` it is the "add" form.
function LineEditor(props: {
  initial?: Priority
  onSave: (slug: string, statement: string) => void
  onDelete?: () => void
}) {
  const [slug, setSlug] = useState(props.initial?.slug ?? '')
  const [statement, setStatement] = useState(props.initial?.statement ?? '')
  const changed =
    slug !== (props.initial?.slug ?? '') ||
    statement !== (props.initial?.statement ?? '')

  return (
    <div className="line">
      <textarea
        rows={2}
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        placeholder={
          props.initial ? '' : 'Add one: a single sentence the model can quote'
        }
        aria-label="Statement"
      />
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="short-name"
        aria-label="Short name"
      />
      <button
        disabled={!changed || statement.trim() === ''}
        onClick={() => props.onSave(slug.trim(), statement.trim())}
      >
        {props.initial ? 'Save' : 'Add'}
      </button>
      {!props.onDelete && <span />}
      {props.onDelete && (
        <button className="link danger" onClick={props.onDelete}>
          Delete
        </button>
      )}
    </div>
  )
}
