-- =========================================================
-- my-coach: add a suggested task to a plan (owner: Ward)
-- =========================================================

-- Add one task to the end of the student's CURRENT plan.
-- Same (plan, request_id) twice => returns the existing task (created = false).
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
  v_task_id  uuid;
  v_position int;
begin
  -- Same lock as create_plan: one plan change at a time per student
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  if not exists (
    select 1 from public.learning_plans
    where id = p_plan_id and user_id = p_user_id and is_current
  ) then
    raise exception 'add_plan_task: plan not found or not current';
  end if;

  select id into v_task_id
  from public.plan_tasks
  where plan_id = p_plan_id and request_id = p_request_id;

  if found then
    return jsonb_build_object('taskId', v_task_id, 'created', false);
  end if;

  select coalesce(max(position), 0) + 1 into v_position
  from public.plan_tasks where plan_id = p_plan_id;

  insert into public.plan_tasks (plan_id, skill_id, title, minutes, position, source, request_id, reason)
  values (p_plan_id, p_skill_id, p_title, p_minutes, v_position, 'chat', p_request_id,
          'أضفتها من المحادثة مع المعلم')
  returning id into v_task_id;

  return jsonb_build_object('taskId', v_task_id, 'created', true);
end;
$$;

revoke execute on function public.add_plan_task(uuid, uuid, text, text, int, text) from public, anon, authenticated;
grant  execute on function public.add_plan_task(uuid, uuid, text, text, int, text) to service_role;
