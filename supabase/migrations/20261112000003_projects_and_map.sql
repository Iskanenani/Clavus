-- Steps 5 to 7 of FEATURES.md: projects, the effective verdict, and the
-- totals of the map. "The model never counts": every figure the map
-- shows is produced by the SQL in this file.

-- ---------------------------------------------------------------
-- Small additions to the tables
-- ---------------------------------------------------------------

-- A fingerprint of the project's items at the time it was judged. If the
-- items change later, the fingerprints differ and the project is judged
-- again; if not, it never is.
alter table public.verdicts add column fingerprint text;

-- "From what to what", and who, in a form that survives in a CSV export.
alter table public.overrides
  add column from_priority_id uuid references public.priorities (id) on delete set null,
  add column changed_by_email text default (auth.jwt() ->> 'email');

drop policy "add to own company" on public.overrides;
create policy "add to own company" on public.overrides
  for insert to authenticated
  with check (
    company_id = public.my_company_id()
    and changed_by = auth.uid()
    and changed_by_email = (auth.jwt() ->> 'email')
  );

-- ---------------------------------------------------------------
-- Projects: work items grouped by their parent
-- ---------------------------------------------------------------
-- security_invoker makes the view obey the access rules of the person
-- asking. Without it a view would show every company's rows.
--
-- A project is assumed to belong to one team. If its items name several,
-- the first in alphabetical order is used.
create view public.project_summary
with (security_invoker = true) as
select
  company_id,
  parent as project,
  min(team) as team,
  count(*) as item_count,
  sum(effort) as effort,
  min(effort_unit) as effort_unit,
  -- Sorted, so the order of rows in the imported file does not matter.
  md5(string_agg(title || E'\n' || description, E'\n' order by title, description)) as fingerprint
from public.work_items
group by company_id, parent;

-- ---------------------------------------------------------------
-- Each project with the verdict in force
-- ---------------------------------------------------------------
-- The newest override wins over the model's verdict. Both are kept, so
-- the screen can show what the model said and what a person decided.
create view public.project_verdicts
with (security_invoker = true) as
select
  s.company_id,
  s.project,
  s.team,
  s.item_count,
  s.effort,
  s.effort_unit,
  coalesce(o.to_verdict, v.verdict) as verdict,
  case when o.id is not null then o.to_priority_id else v.priority_id end as priority_id,
  v.verdict as model_verdict,
  v.priority_id as model_priority_id,
  v.quote,
  v.reason,
  v.error,
  v.provider,
  v.judged_at,
  -- False means the queue must judge this project (again).
  (v.id is not null and v.error is null and not v.stale
    and v.fingerprint = s.fingerprint) as up_to_date,
  coalesce(v.stale, false) as stale,
  o.id is not null as reviewed,
  o.reason as review_reason,
  o.changed_at as reviewed_at,
  o.changed_by_email as reviewed_by
from public.project_summary s
left join public.verdicts v
  on v.company_id = s.company_id and v.project = s.project
left join lateral (
  select *
  from public.overrides o
  where o.company_id = s.company_id and o.project = s.project
  order by o.changed_at desc
  limit 1
) o on true;

-- ---------------------------------------------------------------
-- The map
-- ---------------------------------------------------------------
-- One row per priority, plus four fixed rows: serves no priority,
-- contradicts, unclear, not judged. The shares always add up to 100%.
--
-- Teams are compared by number of items, because their effort units
-- differ. Points or hours are returned only when one team is selected.
create function public.effort_map(p_team text default null)
returns table (
  bucket text,
  kind text,
  label text,
  sort_order int,
  projects bigint,
  items bigint,
  share numeric,
  effort numeric,
  effort_unit text
)
language sql
stable
as $$
  with scoped as (
    select * from public.project_verdicts
    where p_team is null or team = p_team
  ),
  total as (
    select coalesce(sum(item_count), 0) as items from scoped
  ),
  buckets as (
    select slug as bucket, 'priority' as kind, statement as label,
      position as sort_order, id as priority_id
    from public.priorities
    where kind = 'priority'
    union all
    select * from (values
      ('none', 'none', 'Serves no priority', 1000, null::uuid),
      ('contradicts', 'contradicts', 'Contradicts the strategy', 1001, null::uuid),
      ('unclear', 'unclear', 'Unclear: the strategy does not settle it', 1002, null::uuid),
      ('not-judged', 'not-judged', 'Not judged yet', 1003, null::uuid)
    ) as fixed
  )
  select
    b.bucket,
    b.kind,
    b.label,
    b.sort_order,
    count(s.project) as projects,
    coalesce(sum(s.item_count), 0)::bigint as items,
    coalesce(round(100.0 * sum(s.item_count) / nullif(t.items, 0), 1), 0) as share,
    case when p_team is not null then coalesce(sum(s.effort), 0) end as effort,
    case when p_team is not null then min(s.effort_unit) end as effort_unit
  from buckets b
  cross join total t
  left join scoped s on
    (b.kind = 'priority' and s.verdict = 'serves' and s.priority_id = b.priority_id)
    or (b.bucket = s.verdict)
    -- "serves" with no priority left (it was deleted) counts as not judged.
    or (b.bucket = 'not-judged'
      and (s.verdict is null or (s.verdict = 'serves' and s.priority_id is null)))
  group by b.bucket, b.kind, b.label, b.sort_order, t.items
  order by b.sort_order
$$;

grant select on public.project_summary, public.project_verdicts to authenticated, service_role;
revoke all on public.project_summary, public.project_verdicts from anon;
revoke execute on function public.effort_map(text) from public, anon;
grant execute on function public.effort_map(text) to authenticated;
