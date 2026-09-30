-- =========================================================
-- my-coach: atomic attempt operations (owner: Ward)
-- Called only by the Express server with the secret key.
-- =========================================================

-- A student has at most one open diagnostic at a time
create unique index attempts_one_open_diagnostic
  on public.attempts(user_id)
  where status = 'in_progress' and type = 'diagnostic';

-- Create an attempt and its assigned questions in ONE transaction
create or replace function public.start_attempt(
  p_user_id      uuid,
  p_type         text,
  p_skill_id     text,
  p_question_ids text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt_id uuid;
begin
  if coalesce(array_length(p_question_ids, 1), 0) = 0 then
    raise exception 'start_attempt: no questions given';
  end if;

  insert into public.attempts (user_id, type, skill_id)
  values (p_user_id, p_type, p_skill_id)
  returning id into v_attempt_id;

  insert into public.attempt_items (attempt_id, question_id, position)
  select v_attempt_id, t.question_id, t.ord::smallint
  from unnest(p_question_ids) with ordinality as t(question_id, ord);

  return v_attempt_id;
end;
$$;

-- Save grading results in ONE transaction.
-- Returns false if the attempt is not open (already submitted / not owned),
-- so a double submission can never overwrite the first result.
create or replace function public.save_attempt_result(
  p_attempt_id uuid,
  p_user_id    uuid,
  p_request_id text,
  p_score      numeric,
  p_items      jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated int;
begin
  update public.attempts
     set status            = 'submitted',
         score             = p_score,
         submit_request_id = p_request_id,
         submitted_at      = now()
   where id = p_attempt_id
     and user_id = p_user_id
     and status = 'in_progress';

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    return false;
  end if;

  update public.attempt_items ai
     set selected_option = (item ->> 'selectedOption')::smallint,
         is_correct      = (item ->> 'isCorrect')::boolean
    from jsonb_array_elements(p_items) as item
   where ai.attempt_id = p_attempt_id
     and ai.question_id = item ->> 'questionId';

  return true;
end;
$$;

revoke execute on function public.start_attempt(uuid, text, text, text[])            from public, anon, authenticated;
revoke execute on function public.save_attempt_result(uuid, uuid, text, numeric, jsonb) from public, anon, authenticated;
grant  execute on function public.start_attempt(uuid, text, text, text[])            to service_role;
grant  execute on function public.save_attempt_result(uuid, uuid, text, numeric, jsonb) to service_role;
