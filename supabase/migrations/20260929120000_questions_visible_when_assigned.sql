-- =========================================================
-- my-coach: keep assigned questions readable after deactivation (owner: Ward)
--
-- Before: students could read ACTIVE questions only. If a question was
-- deactivated while it was part of a student's attempt, the attempt could
-- no longer be resumed or reviewed.
-- After: students can read active questions, plus any question that is part
-- of one of their OWN attempts. Answer keys stay in private.answer_keys.
-- =========================================================

drop policy "active questions readable by signed-in users" on public.questions;

create policy "students read active or own assigned questions"
  on public.questions for select to authenticated
  using (
    is_active
    or exists (
      select 1
      from public.attempt_items ai
      join public.attempts a on a.id = ai.attempt_id
      where ai.question_id = questions.id
        and a.user_id = (select auth.uid())
    )
  );

-- Supports the lookup above
create index if not exists attempt_items_question_id_idx
  on public.attempt_items(question_id);
