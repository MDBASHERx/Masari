-- =========================================================
-- my-coach: published questions are immutable (owner: Ward)
--
-- Changing a question's prompt, options or answer under the same id would
-- change grading for in-progress attempts and change what submitted attempts
-- display. So once a question exists, its content and answer key are fixed.
--
-- To change a question: insert a NEW id (e.g. frac-1-v2, version = 2) with
-- its own answer key, then set is_active = false on the old one. Deactivated
-- questions stay readable inside students' own attempts (20260929120000).
-- Allowed updates: is_active, difficulty, and the answer explanation.
-- =========================================================

create or replace function private.prevent_question_content_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.skill_id is distinct from old.skill_id
     or new.prompt is distinct from old.prompt
     or new.options is distinct from old.options
     or new.version is distinct from old.version then
    raise exception 'Question % is immutable. Add a new question id (new version) and deactivate this one.', old.id
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger questions_content_is_immutable
  before update on public.questions
  for each row execute function private.prevent_question_content_change();

create or replace function private.prevent_answer_key_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if exists (select 1 from public.attempt_items where question_id = old.question_id) then
      raise exception 'Answer key for % is used by attempts and cannot be deleted.', old.question_id
        using errcode = 'P0001';
    end if;
    return old;
  end if;

  if new.question_id is distinct from old.question_id
     or new.correct_option is distinct from old.correct_option then
    raise exception 'Answer key for % is immutable. Add a new question id (new version) instead.', old.question_id
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger answer_keys_are_immutable
  before update or delete on private.answer_keys
  for each row execute function private.prevent_answer_key_change();
