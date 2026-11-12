import { useRef, useState } from 'react'
import type { GoTo } from '../App'
import { supabase, unwrap } from '../lib/supabase'
import { useQuery } from '../lib/useQuery'
import {
  VERDICT_LABELS,
  type ProjectVerdict,
  type Strategy,
} from '../lib/types'

type Outcome = { project: string; verdict: string | null; error: string | null }

// Calls the judge-project function for one project.
async function judgeOne(project: string): Promise<Outcome> {
  const { data, error } = await supabase.functions.invoke('judge-project', {
    body: { project },
  })
  if (error) {
    // The function's own explanation, when it sent one, is in the response body.
    const body = await error.context?.json?.().catch(() => null)
    return { project, verdict: null, error: body?.error ?? error.message }
  }
  return data as Outcome
}

async function loadQueue() {
  const strategy = unwrap(
    await supabase
      .from('strategies')
      .select('id, body, validated_at')
      .maybeSingle(),
  ) as Strategy | null
  const projects = unwrap(
    await supabase
      .from('project_verdicts')
      .select('project, up_to_date, stale, error')
      .order('project'),
  ) as Pick<ProjectVerdict, 'project' | 'up_to_date' | 'stale' | 'error'>[]
  return { strategy, projects }
}

export function JudgeScreen({ goTo }: { goTo: GoTo }) {
  const { data, error, loading, reload } = useQuery(loadQueue, [])
  const [pauseMs, setPauseMs] = useState(300)
  const [running, setRunning] = useState(false)
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [runSize, setRunSize] = useState(0)
  // A ref, not state: the loop below must see "stop" immediately, and
  // state would only change on the next render.
  const stopRequested = useRef(false)

  if (loading && !data) return <p className="muted">Loading the projects…</p>
  if (error)
    return <p className="error">Could not load the projects: {error}</p>
  if (!data) return null

  const waiting = data.projects.filter((p) => !p.up_to_date)
  const total = data.projects.length
  const validated = Boolean(data.strategy?.validated_at)

  // One project per call, in order. Stopping is safe at any point: every
  // finished verdict is already stored, and the next start skips it.
  async function start() {
    stopRequested.current = false
    setRunning(true)
    setOutcomes([])
    setRunSize(waiting.length)
    for (const { project } of waiting) {
      if (stopRequested.current) break
      const outcome = await judgeOne(project)
      setOutcomes((done) => [outcome, ...done])
      await new Promise((resolve) => setTimeout(resolve, pauseMs))
    }
    setRunning(false)
    reload()
  }

  const failed = outcomes.filter((o) => o.error).length

  return (
    <section className="stack">
      <h1>Judge the projects</h1>
      <p className="muted">
        Each project is sent to the model once, with its work items and the
        strategy. Projects that already have an up-to-date verdict are skipped.
      </p>

      {total === 0 && (
        <p className="notice">
          No work items yet.{' '}
          <button className="link" onClick={() => goTo('import')}>
            Import a file →
          </button>
        </p>
      )}
      {total > 0 && !validated && (
        <p className="notice">
          The strategy is not validated, so nothing can be judged.{' '}
          <button className="link" onClick={() => goTo('strategy')}>
            Go to the strategy →
          </button>
        </p>
      )}

      {total > 0 && (
        <div className="card stack">
          <div className="stats">
            <div>
              <span className="figure">{total}</span> projects
            </div>
            <div>
              <span className="figure">{total - waiting.length}</span> up to
              date
            </div>
            <div>
              <span className="figure">{waiting.length}</span> to judge
            </div>
          </div>

          {(running || outcomes.length > 0) && (
            <>
              <progress value={outcomes.length} max={runSize || 1} />
              <p className="muted">
                {outcomes.length} of {runSize} done
                {failed > 0 && `, ${failed} failed`}
                {!running && outcomes.length < runSize && ' — stopped'}
              </p>
            </>
          )}

          <div className="row">
            {running ? (
              <button onClick={() => (stopRequested.current = true)}>
                Stop
              </button>
            ) : (
              <button
                className="primary"
                disabled={!validated || waiting.length === 0}
                onClick={start}
              >
                {waiting.length === 0
                  ? 'Everything is judged'
                  : outcomes.length > 0
                    ? `Resume (${waiting.length} left)`
                    : `Judge ${waiting.length} projects`}
              </button>
            )}
            <label className="inline">
              Pause between calls
              <input
                type="number"
                min={0}
                step={100}
                value={pauseMs}
                disabled={running}
                onChange={(e) => setPauseMs(Number(e.target.value))}
              />
              ms
            </label>
            {!running && waiting.length === 0 && (
              <button className="link" onClick={() => goTo('map')}>
                See the map →
              </button>
            )}
          </div>
          <p className="muted small">
            The pause keeps the run inside a model’s free-tier request limit.
          </p>
        </div>
      )}

      {outcomes.length > 0 && (
        <div className="card">
          <table>
            <tbody>
              {outcomes.map((outcome) => (
                <tr key={outcome.project}>
                  <td>{outcome.project}</td>
                  <td>
                    {outcome.error ? (
                      <span className="badge contradicts">
                        Failed: {outcome.error}
                      </span>
                    ) : (
                      <span className={`badge ${outcome.verdict}`}>
                        {
                          VERDICT_LABELS[
                            outcome.verdict as keyof typeof VERDICT_LABELS
                          ]
                        }
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
