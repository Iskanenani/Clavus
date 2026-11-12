-- Step 3 of FEATURES.md: editing a validated strategy marks existing
-- verdicts as out of date.
--
-- This is done in the database, not in the screen, so that no code path
-- can change the strategy and forget to flag the verdicts.

-- When the strategy text changes: validation is withdrawn and every
-- verdict of that company is flagged. Validating (which only sets
-- validated_at) does not count as a change.
create function public.strategy_text_changed()
returns trigger
language plpgsql
as $$
begin
  if new.body is distinct from old.body then
    new.validated_at := null;
    new.validated_by := null;
    new.updated_at := now();
    update public.verdicts set stale = true where company_id = new.company_id;
  end if;
  return new;
end
$$;

create trigger strategy_text_changed
  before update on public.strategies
  for each row execute function public.strategy_text_changed();

-- The same when a priority or non-goal is added, reworded or removed.
-- Reordering alone (position) changes nothing the model reads as meaning.
create function public.priority_changed()
returns trigger
language plpgsql
as $$
declare
  affected_strategy uuid;
  affected_company uuid;
begin
  if tg_op = 'DELETE' then
    affected_strategy := old.strategy_id;
    affected_company := old.company_id;
  else
    affected_strategy := new.strategy_id;
    affected_company := new.company_id;
  end if;

  if tg_op = 'UPDATE'
    and new.statement = old.statement
    and new.kind = old.kind
    and new.slug = old.slug then
    return null;
  end if;

  update public.strategies
    set validated_at = null, validated_by = null, updated_at = now()
    where id = affected_strategy;
  update public.verdicts set stale = true where company_id = affected_company;
  return null;
end
$$;

create trigger priority_changed
  after insert or update or delete on public.priorities
  for each row execute function public.priority_changed();
