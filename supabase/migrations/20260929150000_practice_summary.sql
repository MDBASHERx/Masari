-- =========================================================
-- my-coach: complete practice totals for the progress page (owner: Ward)
--
-- Aggregates ALL of the student's submitted practice attempts per skill,
-- instead of summing a limited list in the server.
-- SECURITY INVOKER: runs with the student's own permissions, so RLS applies.
-- =========================================================

create or replace function public.practice_summary()
returns table (
  skill_id          text,
  attempts          bigint,
  correct           bigint,
  total             bigint,
  last_practiced_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select a.skill_id,
         count(distinct a.id)                     as attempts,
         count(*) filter (where ai.is_correct)    as correct,
         count(*)                                 as total,
         max(a.submitted_at)                      as last_practiced_at
  from public.attempts a
  join public.attempt_items ai on ai.attempt_id = a.id
  where a.user_id = (select auth.uid())
    and a.type = 'practice'
    and a.status = 'submitted'
  group by a.skill_id;
$$;

revoke execute on function public.practice_summary() from public, anon;
grant  execute on function public.practice_summary() to authenticated;

-- Supports the progress queries (latest diagnostic, recent attempts)
create index if not exists attempts_user_status_submitted_idx
  on public.attempts(user_id, status, submitted_at desc);
