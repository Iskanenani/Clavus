-- Step 9 of FEATURES.md: a "reset demo" action.
--
-- The pristine synthetic dataset is kept in a template company that has
-- no members, so nobody can log into it or read it. Resetting copies the
-- template over the demo company's data.

alter table public.companies
  add column demo_template_id uuid references public.companies (id) on delete set null;

-- Replaces everything in p_company with a fresh copy of its template.
-- With p_with_verdicts, the stored verdicts are loaded too, so the map
-- can be shown without calling any model.
create function public.load_demo(p_company uuid, p_user uuid, p_with_verdicts boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  template uuid;
  new_strategy uuid;
begin
  select demo_template_id into template from public.companies where id = p_company;
  if template is null then
    raise exception 'This company has no demo dataset to reload.';
  end if;

  delete from public.overrides where company_id = p_company;
  delete from public.verdicts where company_id = p_company;
  delete from public.work_items where company_id = p_company;
  delete from public.strategies where company_id = p_company; -- priorities follow

  insert into public.strategies (company_id, body)
    select p_company, body from public.strategies where company_id = template
    returning id into new_strategy;

  insert into public.priorities (company_id, strategy_id, slug, kind, statement, position)
    select p_company, new_strategy, slug, kind, statement, position
    from public.priorities where company_id = template;

  -- Validated last: adding priorities above would withdraw the validation.
  update public.strategies
    set validated_at = now(), validated_by = p_user
    where id = new_strategy;

  insert into public.work_items
    (company_id, title, description, parent, team, effort, effort_unit, status)
    select p_company, title, description, parent, team, effort, effort_unit, status
    from public.work_items where company_id = template
    order by id;

  if p_with_verdicts then
    insert into public.verdicts
      (company_id, project, verdict, priority_id, quote, reason, provider, fingerprint)
      select p_company, a.project, a.expected_verdict, p.id, a.quote, a.reason,
        'stored demo verdicts', s.fingerprint
      from public.answer_key a
      join public.project_summary s
        on s.company_id = p_company and s.project = a.project
      left join public.priorities p
        on p.company_id = p_company and p.slug = a.priority_slug
      where a.company_id = template;
  end if;
end
$$;

-- Only server code may reset an arbitrary company...
revoke execute on function public.load_demo(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.load_demo(uuid, uuid, boolean) to service_role;

-- ...a logged-in user may reset only their own.
create function public.reset_demo(p_with_verdicts boolean default false)
returns void
language sql
security definer
set search_path = ''
as $$
  select public.load_demo(public.my_company_id(), auth.uid(), p_with_verdicts)
$$;

revoke execute on function public.reset_demo(boolean) from public, anon;
grant execute on function public.reset_demo(boolean) to authenticated;
