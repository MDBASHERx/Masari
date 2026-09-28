-- =========================================================
-- my-coach: learning plan creation (owner: Ward)
-- =========================================================

-- Why a task is in this position (shown on the learning path screen)
alter table public.plan_tasks
  add column reason text check (char_length(reason) <= 300);

-- Create a plan and its tasks in ONE transaction.
-- Same attempt twice => returns the existing plan (created = false).
create or replace function public.create_plan(
  p_user_id    uuid,
  p_attempt_id uuid,
  p_tasks      jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan_id uuid;
  v_version int;
begin
  -- One plan change at a time per student
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  if not exists (
    select 1 from public.attempts
    where id = p_attempt_id and user_id = p_user_id
      and type = 'diagnostic' and status = 'submitted'
  ) then
    raise exception 'create_plan: attempt not found or not submitted';
  end if;

  select id into v_plan_id
  from public.learning_plans
  where user_id = p_user_id and is_current and source_attempt_id = p_attempt_id;

  if found then
    return jsonb_build_object('planId', v_plan_id, 'created', false);
  end if;

  if coalesce(jsonb_array_length(p_tasks), 0) = 0 then
    raise exception 'create_plan: a plan needs at least one task';
  end if;

  select coalesce(max(version), 0) + 1 into v_version
  from public.learning_plans where user_id = p_user_id;

  update public.learning_plans
     set is_current = false
   where user_id = p_user_id and is_current;

  insert into public.learning_plans (user_id, source_attempt_id, version)
  values (p_user_id, p_attempt_id, v_version)
  returning id into v_plan_id;

  insert into public.plan_tasks (plan_id, skill_id, title, minutes, position, reason, source)
  select v_plan_id,
         t ->> 'skillId',
         t ->> 'title',
         (t ->> 'minutes')::smallint,
         (t ->> 'position')::int,
         t ->> 'reason',
         'plan'
  from jsonb_array_elements(p_tasks) as t;

  return jsonb_build_object('planId', v_plan_id, 'created', true);
end;
$$;

revoke execute on function public.create_plan(uuid, uuid, jsonb) from public, anon, authenticated;
grant  execute on function public.create_plan(uuid, uuid, jsonb) to service_role;
