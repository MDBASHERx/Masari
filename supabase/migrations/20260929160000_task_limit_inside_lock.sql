-- =========================================================
-- my-coach: enforce the task limit inside the lock (owner: Ward)
--
-- Before: the 20-task limit was checked in the server BEFORE calling
-- add_plan_task. Two requests at 19 tasks could both pass and add 21
-- (10 at once reached 29 in testing).
-- After: add_plan_task checks the limit itself, after taking the per-student
-- lock and after the idempotent-retry check, so the count cannot change
-- between the check and the insert, and a retry of an added task still works.
-- A full plan returns { planFull: true } instead of raising.
-- =========================================================

create or replace function public.add_plan_task(
  p_user_id    uuid,
  p_plan_id    uuid,
  p_skill_id   text,
  p_title      text,
  p_minutes    int,
  p_request_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_max_tasks constant int := 20;
  v_task_id   uuid;
  v_count     int;
  v_position  int;
begin
  -- 1. One plan change at a time per student (same lock as create_plan)
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  if not exists (
    select 1 from public.learning_plans
    where id = p_plan_id and user_id = p_user_id and is_current
  ) then
    raise exception 'add_plan_task: plan not found or not current';
  end if;

  -- 2. Idempotent retry: the same request returns the task it already added
  select id into v_task_id
  from public.plan_tasks
  where plan_id = p_plan_id and request_id = p_request_id;

  if found then
    return jsonb_build_object('taskId', v_task_id, 'created', false, 'planFull', false);
  end if;

  -- 3. Limit, counted while holding the lock
  select count(*), coalesce(max(position), 0)
    into v_count, v_position
  from public.plan_tasks
  where plan_id = p_plan_id;

  if v_count >= c_max_tasks then
    return jsonb_build_object('taskId', null, 'created', false, 'planFull', true, 'maxTasks', c_max_tasks);
  end if;

  insert into public.plan_tasks (plan_id, skill_id, title, minutes, position, source, request_id, reason)
  values (p_plan_id, p_skill_id, p_title, p_minutes, v_position + 1, 'chat', p_request_id,
          'أضفتها من المحادثة مع المعلم')
  returning id into v_task_id;

  return jsonb_build_object('taskId', v_task_id, 'created', true, 'planFull', false);
end;
$$;

-- create or replace keeps the existing grants; restated for clarity
revoke execute on function public.add_plan_task(uuid, uuid, text, text, int, text) from public, anon, authenticated;
grant  execute on function public.add_plan_task(uuid, uuid, text, text, int, text) to service_role;
