-- Clavus schema, step 2 of FEATURES.md.
--
-- Every table carries a company_id, and every table has an access rule
-- that compares it with the company of the logged-in user. That single
-- pattern is what keeps one company from reading another's rows.

-- ---------------------------------------------------------------
-- Who belongs to which company
-- ---------------------------------------------------------------

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- One row per user. A user belongs to exactly one company in version 1.
create table public.members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade
);

-- The company of the logged-in user, or null when nobody is logged in.
-- "security definer" lets the function read `members` even though the
-- access rule on `members` itself calls this function; without it the
-- two would call each other forever.
create function public.my_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select company_id from public.members where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------
-- The reference: one strategy per company, with its priorities
-- ---------------------------------------------------------------

create table public.strategies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique default public.my_company_id()
    references public.companies (id) on delete cascade,
  body text not null default '',
  -- Null until the leader validates. Editing clears it again (step 3).
  validated_at timestamptz,
  validated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Priorities and "will not do" items live in one table because the
-- model treats them the same way: a line of the strategy it can quote.
create table public.priorities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.my_company_id()
    references public.companies (id) on delete cascade,
  strategy_id uuid not null references public.strategies (id) on delete cascade,
  slug text not null,
  kind text not null check (kind in ('priority', 'non_goal')),
  statement text not null,
  position int not null default 0,
  unique (strategy_id, slug)
);

-- ---------------------------------------------------------------
-- The work: imported items in the common format
-- ---------------------------------------------------------------

create table public.work_items (
  id bigint generated always as identity primary key,
  company_id uuid not null default public.my_company_id()
    references public.companies (id) on delete cascade,
  title text not null,
  description text not null default '',
  -- The project or epic. Verdicts are made at this level.
  parent text not null,
  team text,
  effort numeric,
  -- 'points', 'hours' or 'days'. Units differ between teams, so effort
  -- is only ever added up within one team.
  effort_unit text,
  status text,
  created_at timestamptz not null default now()
);

create index work_items_company_parent on public.work_items (company_id, parent);

-- ---------------------------------------------------------------
-- Judgements and human corrections
-- ---------------------------------------------------------------

create table public.verdicts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.my_company_id()
    references public.companies (id) on delete cascade,
  project text not null,
  verdict text check (verdict in ('serves', 'none', 'contradicts', 'unclear')),
  priority_id uuid references public.priorities (id) on delete set null,
  quote text,
  reason text,
  -- Set instead of a verdict when the model's answer failed the checks twice.
  error text,
  -- True once the strategy changed after this verdict was made.
  stale boolean not null default false,
  provider text,
  judged_at timestamptz not null default now(),
  -- One stored verdict per project: an unchanged project is never judged twice.
  unique (company_id, project),
  check (verdict is not null or error is not null),
  -- The verdict shape requires a quote for these two.
  check (verdict not in ('serves', 'contradicts') or quote is not null)
);

-- An append-only log. The newest row for a project is the one in force.
create table public.overrides (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.my_company_id()
    references public.companies (id) on delete cascade,
  project text not null,
  from_verdict text,
  to_verdict text not null check (to_verdict in ('serves', 'none', 'contradicts', 'unclear')),
  to_priority_id uuid references public.priorities (id) on delete set null,
  reason text not null,
  changed_by uuid default auth.uid() references auth.users (id) on delete set null,
  changed_at timestamptz not null default now()
);

create index overrides_company_project on public.overrides (company_id, project, changed_at desc);

-- The expected verdicts of the synthetic dataset. Used only by the mock
-- provider (which runs on the server) so the product can be built and
-- demonstrated before a real model is chosen.
create table public.answer_key (
  company_id uuid not null references public.companies (id) on delete cascade,
  project text not null,
  planted_case text not null,
  expected_verdict text not null,
  priority_slug text,
  quote text,
  reason text not null,
  primary key (company_id, project)
);

-- ---------------------------------------------------------------
-- Access rules
-- ---------------------------------------------------------------
-- With row level security on, a table returns nothing unless a policy
-- allows it. Server code using the service key bypasses these rules.

alter table public.companies enable row level security;
alter table public.members enable row level security;
alter table public.strategies enable row level security;
alter table public.priorities enable row level security;
alter table public.work_items enable row level security;
alter table public.verdicts enable row level security;
alter table public.overrides enable row level security;
alter table public.answer_key enable row level security;

-- Visitors who are not logged in get nothing at all.
revoke all on all tables in schema public from anon;

grant select on public.companies, public.members to authenticated;
grant select, insert, update, delete
  on public.strategies, public.priorities, public.work_items, public.verdicts
  to authenticated;
-- The override log can be added to and read, never edited or erased.
grant select, insert on public.overrides to authenticated;
grant all on all tables in schema public to service_role;

create policy "own company" on public.companies
  for select to authenticated
  using (id = public.my_company_id());

create policy "own membership" on public.members
  for select to authenticated
  using (user_id = auth.uid());

create policy "own company" on public.strategies
  for all to authenticated
  using (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

create policy "own company" on public.priorities
  for all to authenticated
  using (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

create policy "own company" on public.work_items
  for all to authenticated
  using (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

create policy "own company" on public.verdicts
  for all to authenticated
  using (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

create policy "read own company" on public.overrides
  for select to authenticated
  using (company_id = public.my_company_id());

create policy "add to own company" on public.overrides
  for insert to authenticated
  with check (company_id = public.my_company_id() and changed_by = auth.uid());

-- answer_key has no policy on purpose: the browser must never be able to
-- read the expected answers. Only server code (service key) can.
