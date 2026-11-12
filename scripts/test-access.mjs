// Proves the "Done when" of step 2: a user from one company cannot read
// or change another company's rows.
// Run with: npm run db:test-access   (after npm run db:seed)
//
// It creates a second, throwaway company with its own user, signs in as
// each user the way a browser would, and checks what each can see.

import {
  adminClient,
  browserLikeClient,
  ensureUser,
  must,
  requireEnv,
} from './lib/admin.mjs'

const OTHER_COMPANY = 'Access test company'
const OTHER_EMAIL = 'access-test@example.com'
const OTHER_PASSWORD = crypto.randomUUID() // never needed again after this run
const TABLES = [
  'companies',
  'strategies',
  'priorities',
  'work_items',
  'verdicts',
  'overrides',
]

const admin = adminClient()
let failures = 0

function check(label, passed) {
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${label}`)
  if (!passed) failures++
}

// --- Set up the second company with one row in each table ---
must(
  await admin.from('companies').delete().eq('name', OTHER_COMPANY),
  'Clear test company',
)
const other = must(
  await admin
    .from('companies')
    .insert({ name: OTHER_COMPANY })
    .select()
    .single(),
  'Create test company',
)
const otherUser = await ensureUser(admin, OTHER_EMAIL, OTHER_PASSWORD)
must(
  await admin
    .from('members')
    .upsert({ user_id: otherUser.id, company_id: other.id }),
  'Attach test user',
)
const strategy = must(
  await admin
    .from('strategies')
    .insert({ company_id: other.id, body: 'Secret plan' })
    .select()
    .single(),
  'Create test strategy',
)
must(
  await admin.from('priorities').insert({
    company_id: other.id,
    strategy_id: strategy.id,
    slug: 'secret',
    kind: 'priority',
    statement: 'Secret priority',
  }),
  'Create test priority',
)
const item = must(
  await admin
    .from('work_items')
    .insert({
      company_id: other.id,
      title: 'Secret item',
      parent: 'Secret project',
    })
    .select()
    .single(),
  'Create test work item',
)
must(
  await admin.from('verdicts').insert({
    company_id: other.id,
    project: 'Secret project',
    verdict: 'none',
    reason: 'x',
  }),
  'Create test verdict',
)
must(
  await admin.from('overrides').insert({
    company_id: other.id,
    project: 'Secret project',
    to_verdict: 'unclear',
    reason: 'x',
  }),
  'Create test override',
)

// --- Sign in as each user, like a browser ---
async function signIn(email, password) {
  const client = browserLikeClient()
  must(
    await client.auth.signInWithPassword({ email, password }),
    `Sign in ${email}`,
  )
  return client
}
const demo = await signIn(
  requireEnv('DEMO_USER_EMAIL'),
  requireEnv('DEMO_USER_PASSWORD'),
)
const stranger = await signIn(OTHER_EMAIL, OTHER_PASSWORD)
const visitor = browserLikeClient() // not logged in

const demoCompany = must(
  await demo.from('companies').select(),
  'Read companies',
)
check('demo user sees exactly one company', demoCompany.length === 1)
const demoCompanyId = demoCompany[0]?.id

// --- Reading ---
for (const table of TABLES) {
  const column = table === 'companies' ? 'id' : 'company_id'

  const seenByDemo = must(
    await demo.from(table).select(column),
    `Demo reads ${table}`,
  )
  check(
    `demo user reads no ${table} of the other company`,
    seenByDemo.every((row) => row[column] === demoCompanyId),
  )

  const seenByStranger = must(
    await stranger.from(table).select(column),
    `Stranger reads ${table}`,
  )
  check(
    `other user reads only their own ${table} (${seenByStranger.length} row)`,
    seenByStranger.length === 1 && seenByStranger[0][column] === other.id,
  )

  // A visitor is refused outright or gets an empty list; both are fine.
  const seenByVisitor = await visitor.from(table).select(column)
  check(
    `visitor without login reads no ${table}`,
    (seenByVisitor.data ?? []).length === 0,
  )
}

const key = await demo.from('answer_key').select('project')
check('demo user cannot read the answer key', (key.data ?? []).length === 0)

// --- Writing ---
const planted = await demo
  .from('work_items')
  .insert({ company_id: other.id, title: 'Planted', parent: 'Planted' })
check('demo user cannot insert into the other company', planted.error !== null)

await demo.from('work_items').update({ title: 'Changed' }).eq('id', item.id)
await demo.from('work_items').delete().eq('id', item.id)
const after = must(
  await admin.from('work_items').select('title').eq('id', item.id),
  'Re-read item',
)
check(
  'demo user cannot change or delete the other company’s item',
  after.length === 1 && after[0].title === 'Secret item',
)

const forged = await demo.from('overrides').insert({
  project: 'Any',
  to_verdict: 'none',
  reason: 'x',
  changed_by: otherUser.id,
})
check(
  'demo user cannot log an override under someone else’s name',
  forged.error !== null,
)

// --- Clean up everything this script created ---
must(
  await admin.from('companies').delete().eq('id', other.id),
  'Remove test company',
)
must(await admin.auth.admin.deleteUser(otherUser.id), 'Remove test user')

console.log(
  failures === 0
    ? '\nAll access checks passed.'
    : `\n${failures} check(s) FAILED.`,
)
process.exit(failures === 0 ? 0 : 1)
