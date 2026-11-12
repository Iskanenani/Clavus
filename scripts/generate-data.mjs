// Builds the synthetic dataset in data/ from the hand-written projects.
// Run with: npm run data
//
// The output is deterministic: the same script always writes the same
// files, so the answer key and the work items can never disagree.

import { readFileSync, writeFileSync } from 'node:fs'
import { PROJECTS } from './dataset/projects.mjs'
import { STRATEGY_LINES } from './dataset/strategy-lines.mjs'

const DATA_DIR = new URL('../data/', import.meta.url)

// Engineering teams estimate in story points, the others in hours.
// This is why the map only compares teams by number of items.
const ENGINEERING = ['Payments Engineering', 'Product Engineering']
const POINTS = [1, 2, 3, 5, 8]
const HOURS = [2, 4, 6, 8, 12, 16]
const STATUSES = ['Done', 'Done', 'In progress', 'To do']

// Routine items that every real project contains. They say nothing about
// what the project is for, which is why Clavus judges projects, not items.
const ROUTINE_ENGINEERING = [
  ['Write technical design note', ''],
  ['Code review fixes', ''],
  ['Add automated tests', ''],
  ['Release and rollout', 'Gradual rollout behind a feature flag.'],
  ['Update runbook', ''],
  ['Fix bugs found in QA', ''],
  ['Sprint demo', ''],
]
const ROUTINE_BUSINESS = [
  ['Kickoff meeting', ''],
  ['Weekly status update', ''],
  ['Budget sign-off', ''],
  ['Stakeholder review', ''],
  ['Collect feedback', ''],
  ['Write final report', ''],
  ['Agree timeline', ''],
]

// A tiny seeded random generator (mulberry32). Math.random() cannot be
// seeded, and we need the same dataset on every run.
function seededRandom(seed) {
  let state = seed
  return function next() {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = seededRandom(2026)
const pick = (list) => list[Math.floor(random() * list.length)]

// Returns `count` different entries of `list`, in random order.
function pickSeveral(list, count) {
  const remaining = [...list]
  const chosen = []
  for (let i = 0; i < count; i++) {
    const index = Math.floor(random() * remaining.length)
    chosen.push(remaining.splice(index, 1)[0])
  }
  return chosen
}

// One CSV cell: quoted only when it contains a comma, quote or newline.
function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function toCsv(header, rows) {
  return (
    [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n') + '\n'
  )
}

// Turns every project into its work items in the common format.
function buildWorkItems() {
  const items = []
  for (const project of PROJECTS) {
    const isEngineering = ENGINEERING.includes(project.team)
    const routinePool = isEngineering ? ROUTINE_ENGINEERING : ROUTINE_BUSINESS
    const routineCount = 3 + Math.floor(random() * 3) // 3 to 5
    const all = [...project.items, ...pickSeveral(routinePool, routineCount)]
    for (const [title, description] of all) {
      items.push({
        title,
        description,
        parent: project.name,
        team: project.team,
        effort: pick(isEngineering ? POINTS : HOURS),
        status: pick(STATUSES),
      })
    }
  }
  return items
}

// Stops the build if the answer key would be wrong or unusable.
function checkProjects(strategyText) {
  const names = new Set()
  for (const project of PROJECTS) {
    if (names.has(project.name))
      throw new Error(`Duplicate project: ${project.name}`)
    names.add(project.name)

    const line = project.priorityId ? STRATEGY_LINES[project.priorityId] : null
    if (project.priorityId && !line) {
      throw new Error(`${project.name}: unknown priority ${project.priorityId}`)
    }
    const needsQuote = ['serves', 'contradicts'].includes(project.verdict)
    if (needsQuote && !line)
      throw new Error(`${project.name}: verdict needs a quote`)
  }
  for (const [id, line] of Object.entries(STRATEGY_LINES)) {
    if (!strategyText.includes(line.quote)) {
      throw new Error(`Quote for "${id}" is not in strategy.md word for word`)
    }
  }
}

const strategyText = readFileSync(new URL('strategy.md', DATA_DIR), 'utf8')
checkProjects(strategyText)
const workItems = buildWorkItems()

// 1. The common format.
writeFileSync(
  new URL('work_items.csv', DATA_DIR),
  toCsv(
    ['title', 'description', 'parent', 'team', 'effort', 'status'],
    workItems.map((i) => [
      i.title,
      i.description,
      i.parent,
      i.team,
      i.effort,
      i.status,
    ]),
  ),
)

// 2. The same data as a tracker might export it: other column names, another
// order, and one extra column the mapping screen must let the user ignore.
writeFileSync(
  new URL('work_items_other_shape.csv', DATA_DIR),
  toCsv(
    [
      'Issue Key',
      'State',
      'Epic Name',
      'Summary',
      'Squad',
      'Estimate',
      'Details',
    ],
    workItems.map((i, index) => [
      `TES-${index + 1}`,
      i.status,
      i.parent,
      i.title,
      i.team,
      i.effort,
      i.description,
    ]),
  ),
)

// 3. The expected verdict for every project. A quote is given only for
// "serves" and "contradicts", as the verdict shape requires.
writeFileSync(
  new URL('answer_key.csv', DATA_DIR),
  toCsv(
    [
      'project',
      'team',
      'case',
      'expected_verdict',
      'priority_id',
      'quote',
      'reason',
    ],
    PROJECTS.map((p) => {
      const hasQuote = ['serves', 'contradicts'].includes(p.verdict)
      return [
        p.name,
        p.team,
        p.kase,
        p.verdict,
        p.priorityId ?? '',
        hasQuote ? STRATEGY_LINES[p.priorityId].quote : '',
        p.reason,
      ]
    }),
  ),
)

// A summary to paste into data/README.md and to eyeball after a change.
const countBy = (key) =>
  PROJECTS.reduce(
    (acc, p) => ({ ...acc, [p[key]]: (acc[p[key]] ?? 0) + 1 }),
    {},
  )
console.log(`Projects: ${PROJECTS.length}, work items: ${workItems.length}`)
console.log('By case:', countBy('kase'))
console.log('By verdict:', countBy('verdict'))
console.log('By team:', countBy('team'))
