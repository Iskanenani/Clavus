import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import type { GoTo } from '../App'
import { supabase, unwrap } from '../lib/supabase'
import { useQuery } from '../lib/useQuery'
import {
  shortLabel,
  type MapRow,
  type Priority,
  type ProjectVerdict,
} from '../lib/types'
import { ProjectPanel } from './ProjectPanel'

const COLORS: Record<MapRow['kind'], string> = {
  priority: '#266df0',
  none: '#b5bdc9',
  contradicts: '#b96969',
  unclear: '#b79749',
  'not-judged': '#e4e7ec',
}

// Everything the map shows, for one team or for all. The totals come
// from the effort_map() SQL function; nothing is added up in the browser.
async function loadMap(team: string) {
  const rows = unwrap(
    await supabase.rpc('effort_map', { p_team: team || null }),
  ) as MapRow[]
  let projectQuery = supabase
    .from('project_verdicts')
    .select('*')
    .order('project')
  if (team) projectQuery = projectQuery.eq('team', team)
  const projects = unwrap(await projectQuery) as ProjectVerdict[]
  const priorities = unwrap(
    await supabase.from('priorities').select('*').order('position'),
  ) as Priority[]
  const teamRows = unwrap(
    await supabase.from('project_summary').select('team'),
  ) as {
    team: string | null
  }[]
  const teams = [
    ...new Set(teamRows.map((row) => row.team).filter(Boolean)),
  ].sort() as string[]
  // `team` is returned too, so the screen labels the figures with the
  // team they were computed for, even while another team is loading.
  return { rows, projects, priorities, teams, team }
}

// Does this project belong to this row of the map? Mirrors effort_map().
function inBucket(
  project: ProjectVerdict,
  row: MapRow,
  priorities: Priority[],
): boolean {
  if (row.kind === 'priority') {
    const priority = priorities.find((p) => p.slug === row.bucket)
    return project.verdict === 'serves' && project.priority_id === priority?.id
  }
  if (row.kind === 'not-judged') {
    return (
      project.verdict === null ||
      (project.verdict === 'serves' && !project.priority_id)
    )
  }
  return project.verdict === row.kind
}

export function MapScreen({ goTo }: { goTo: GoTo }) {
  const [compact, setCompact] = useState(
    () => window.matchMedia('(max-width: 680px)').matches,
  )
  // Leave room for the bars and percentages when labels are on a phone.
  useEffect(() => {
    const query = window.matchMedia('(max-width: 680px)')
    const update = () => setCompact(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const [selectedTeam, setTeam] = useState('')
  const [bucket, setBucket] = useState<string | null>(null)
  const [openProject, setOpenProject] = useState<string | null>(null)
  const { data, error, loading, reload } = useQuery(
    () => loadMap(selectedTeam),
    [selectedTeam],
  )

  if (loading && !data) return <p className="muted">Loading the map…</p>
  if (error) return <p className="error">Could not load the map: {error}</p>
  if (!data) return null
  const { rows, projects, priorities, teams, team } = data

  if (projects.length === 0 && !team) {
    return (
      <section className="stack">
        <h1>Where the effort goes</h1>
        <p className="notice">
          Nothing to show yet. Clavus needs a validated strategy and a file of
          work items.{' '}
          <button className="link" onClick={() => goTo('strategy')}>
            Strategy →
          </button>{' '}
          <button className="link" onClick={() => goTo('import')}>
            Import →
          </button>
        </p>
      </section>
    )
  }

  const totalItems = rows.reduce((sum, row) => sum + row.items, 0)
  const notJudged = rows.find((row) => row.kind === 'not-judged')?.projects ?? 0
  const stale = projects.filter((p) => p.stale).length
  const selectedRow = rows.find((row) => row.bucket === bucket) ?? null
  const chartRows = rows
    .filter((row) => row.kind !== 'not-judged' || row.items > 0)
    .map((row) => ({
      ...row,
      name: row.kind === 'priority' ? shortLabel(row.label) : row.label,
    }))
  const opened = projects.find((p) => p.project === openProject) ?? null

  const projectList = (list: ProjectVerdict[]) =>
    list.length === 0 ? (
      <p className="muted">None.</p>
    ) : (
      <ul className="projects">
        {list.map((p) => (
          <li key={p.project}>
            <button className="link" onClick={() => setOpenProject(p.project)}>
              {p.project}
            </button>
            <span className="muted">
              {p.team} · {p.item_count} items
              {team && p.effort !== null && ` · ${p.effort} ${p.effort_unit}`}
            </span>
            {p.reviewed && <span className="badge reviewed">Reviewed</span>}
            {p.stale && <span className="badge unclear">Out of date</span>}
          </li>
        ))}
      </ul>
    )

  return (
    <section className="stack">
      <div className="row spread">
        <h1>Where the effort goes</h1>
        <label className="inline">
          Team
          <select
            value={selectedTeam}
            onChange={(e) => {
              setTeam(e.target.value)
              setBucket(null)
            }}
          >
            <option value="">All teams</option>
            {teams.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>

      {(notJudged > 0 || stale > 0) && (
        <p className="notice">
          {notJudged > 0 && `${notJudged} projects are not judged yet. `}
          {stale > 0 &&
            `${stale} verdicts are out of date because the strategy changed. `}
          <button className="link" onClick={() => goTo('judge')}>
            Judge them →
          </button>
        </p>
      )}

      <div className="card stack">
        <p className="muted">
          Share of the {totalItems} work items{team ? ` of ${team}` : ''}, by
          what their project is for. Click a bar to see its projects.
        </p>
        <div className="scroll">
          <div className="chart-canvas">
            <ResponsiveContainer
              width="100%"
              height={chartRows.length * (compact ? 52 : 44) + 20}
            >
              <BarChart
                data={chartRows}
                layout="vertical"
                margin={{ left: compact ? 0 : 8, right: compact ? 42 : 56 }}
              >
                <XAxis type="number" hide domain={[0, 'dataMax']} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={compact ? 140 : 250}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: compact ? 11 : 13, fill: '#1c1d1f' }}
                />
                <Bar
                  dataKey="share"
                  radius={4}
                  minPointSize={3}
                  isAnimationActive={false}
                  cursor="pointer"
                  onClick={(entry) =>
                    setBucket((entry as unknown as MapRow).bucket)
                  }
                >
                  {chartRows.map((row) => (
                    <Cell
                      key={row.bucket}
                      fill={COLORS[row.kind]}
                      opacity={bucket && bucket !== row.bucket ? 0.45 : 1}
                    />
                  ))}
                  <LabelList
                    dataKey="share"
                    position="right"
                    formatter={(value) => `${value}%`}
                    style={{ fontSize: compact ? 11 : 13, fill: '#1c1d1f' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="scroll">
          <table className="map-table">
            <thead>
              <tr>
                <th>What the work is for</th>
                <th className="num">Projects</th>
                <th className="num">Items</th>
                <th className="num">Share</th>
                {team && <th className="num">Effort</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.bucket}
                  className={
                    row.bucket === bucket ? 'clickable selected' : 'clickable'
                  }
                  onClick={() => setBucket(row.bucket)}
                >
                  <td>
                    <span
                      className="dot"
                      style={{ background: COLORS[row.kind] }}
                    />
                    {row.kind === 'priority'
                      ? shortLabel(row.label)
                      : row.label}
                  </td>
                  <td className="num">{row.projects}</td>
                  <td className="num">{row.items}</td>
                  <td className="num">{row.share}%</td>
                  {team && (
                    <td className="num">
                      {row.effort ?? 0} {row.effort_unit ?? ''}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!team && (
          <p className="muted small">
            Teams are compared by number of items because they measure effort in
            different units. Choose a team to see its points or hours.
          </p>
        )}
      </div>

      {selectedRow && (
        <div className="card stack">
          <h2>{selectedRow.label}</h2>
          {projectList(
            projects.filter((p) => inBucket(p, selectedRow, priorities)),
          )}
        </div>
      )}

      <div className="columns">
        <div className="card stack">
          <h2>Contradictions to rule on</h2>
          {projectList(projects.filter((p) => p.verdict === 'contradicts'))}
        </div>
        <div className="card stack">
          <h2>Unclear: the strategy does not settle these</h2>
          {projectList(projects.filter((p) => p.verdict === 'unclear'))}
        </div>
      </div>

      {opened && (
        <ProjectPanel
          project={opened}
          priorities={priorities}
          onClose={() => setOpenProject(null)}
          onChanged={reload}
        />
      )}
    </section>
  )
}
