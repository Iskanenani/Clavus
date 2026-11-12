// Loads the synthetic dataset into Supabase.
// Run with: npm run db:seed   (after the migrations have been applied)
//
// It fills a template company that nobody can log into, then copies it
// into the demo company. The "Reset demo" button in the app repeats that
// copy. Safe to run again: it replaces these two companies and nothing else.

import { ENGINEERING_TEAMS } from './dataset/teams.mjs'
import { STRATEGY_LINES } from './dataset/strategy-lines.mjs'
import {
  adminClient,
  ensureUser,
  must,
  readData,
  readDataCsv,
  requireEnv,
} from './lib/admin.mjs'

const DEMO_COMPANY = 'Tessel (demo)'
const TEMPLATE_COMPANY = 'Tessel (demo template)'

const admin = adminClient()
const email = requireEnv('DEMO_USER_EMAIL')
const password = requireEnv('DEMO_USER_PASSWORD')

// The strategy text without its two lists: the priorities and non-goals
// are stored as separate rows, so keeping them in the text too would
// let the two drift apart when someone edits one of them.
function strategyIntro() {
  const [beforeLists] = readData('strategy.md').split('## Priorities')
  return beforeLists.replace(/^# .*\n/, '').trim()
}

// 1. Start clean. Deleting a company removes all its rows (every table
// cascades).
for (const name of [DEMO_COMPANY, TEMPLATE_COMPANY]) {
  must(await admin.from('companies').delete().eq('name', name), `Clear ${name}`)
}

// 2. The template company: strategy, priorities, work items, answer key.
const template = must(
  await admin
    .from('companies')
    .insert({ name: TEMPLATE_COMPANY })
    .select()
    .single(),
  'Create template company',
)
const strategy = must(
  await admin
    .from('strategies')
    .insert({ company_id: template.id, body: strategyIntro() })
    .select()
    .single(),
  'Create strategy',
)

const priorities = Object.entries(STRATEGY_LINES).map(
  ([slug, line], index) => ({
    company_id: template.id,
    strategy_id: strategy.id,
    slug,
    kind: line.kind === 'priority' ? 'priority' : 'non_goal',
    statement: line.quote,
    position: index,
  }),
)
must(await admin.from('priorities').insert(priorities), 'Create priorities')

// Effort units follow the team (see data/README.md).
const workItems = readDataCsv('work_items.csv').map((row) => ({
  company_id: template.id,
  title: row.title,
  description: row.description,
  parent: row.parent,
  team: row.team,
  effort: Number(row.effort),
  effort_unit: ENGINEERING_TEAMS.includes(row.team) ? 'points' : 'hours',
  status: row.status,
}))
must(await admin.from('work_items').insert(workItems), 'Load work items')

// The expected answers: read by the mock provider, never by the browser.
const answers = readDataCsv('answer_key.csv').map((row) => ({
  company_id: template.id,
  project: row.project,
  planted_case: row.case,
  expected_verdict: row.expected_verdict,
  priority_slug: row.priority_id || null,
  quote: row.quote || null,
  reason: row.reason,
}))
must(await admin.from('answer_key').insert(answers), 'Load answer key')

// 3. The demo company and its one account.
const company = must(
  await admin
    .from('companies')
    .insert({ name: DEMO_COMPANY, demo_template_id: template.id })
    .select()
    .single(),
  'Create demo company',
)
const user = await ensureUser(admin, email, password)
must(
  await admin
    .from('members')
    .upsert({ user_id: user.id, company_id: company.id }),
  'Attach demo user',
)

// 4. Copy the template into the demo company, without verdicts: judging
// is part of what the demo shows.
must(
  await admin.rpc('load_demo', {
    p_company: company.id,
    p_user: user.id,
    p_with_verdicts: false,
  }),
  'Load demo data',
)

console.log(
  `Seeded "${DEMO_COMPANY}": ${priorities.length} priorities and non-goals, ` +
    `${workItems.length} work items, ${answers.length} expected verdicts.`,
)
console.log(`Demo login: ${email}`)
