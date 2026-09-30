-- Run with: npx supabase test db   (needs the local Supabase stack)
-- Regression: question content changes between starting and submitting an
-- attempt must be impossible, and the attempt must grade and display the
-- content the student actually saw.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

-- ---------- A student starts an attempt with q-imm-1 ----------
insert into auth.users (id, email) values ('00000000-0000-4000-8000-00000000000d', 'student-d@test.local');
insert into public.skills (id, name, position) values ('imm-skill', 'Immutable test skill', 97);
insert into public.questions (id, skill_id, prompt, options) values
  ('q-imm-1', 'imm-skill', 'Original prompt', '["A","B","C","D"]');
insert into private.answer_keys (question_id, correct_option) values ('q-imm-1', 1);

insert into public.attempts (id, user_id, type) values
  ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-00000000000d', 'diagnostic');
insert into public.attempt_items (attempt_id, question_id, position) values
  ('00000000-0000-4000-8000-0000000000d1', 'q-imm-1', 1);

-- ---------- Someone tries to change the content mid-attempt ----------
select throws_ok(
  $$ update public.questions set prompt = 'Changed prompt' where id = 'q-imm-1' $$,
  'P0001', null, 'prompt cannot change');

select throws_ok(
  $$ update public.questions set options = '["W","X","Y","Z"]' where id = 'q-imm-1' $$,
  'P0001', null, 'options cannot change');

select throws_ok(
  $$ update private.answer_keys set correct_option = 3 where question_id = 'q-imm-1' $$,
  'P0001', null, 'correct answer cannot change');

select throws_ok(
  $$ delete from private.answer_keys where question_id = 'q-imm-1' $$,
  'P0001', null, 'an answer key used by attempts cannot be deleted');

-- Re-running the seed with different content under the same id is a no-op
insert into public.questions (id, skill_id, prompt, options) values
  ('q-imm-1', 'imm-skill', 'Seed tried to replace this', '["1","2","3","4"]')
on conflict (id) do nothing;
insert into private.answer_keys (question_id, correct_option) values ('q-imm-1', 0)
on conflict (question_id) do nothing;

select is((select prompt from public.questions where id = 'q-imm-1'), 'Original prompt',
  're-running the seed keeps the original prompt');

-- ---------- Safe changes are still allowed ----------
select lives_ok(
  $$ update public.questions set difficulty = 3 where id = 'q-imm-1' $$,
  'difficulty can change');

select lives_ok(
  $$ update private.answer_keys set explanation = 'Better explanation' where question_id = 'q-imm-1' $$,
  'explanation can change');

-- The right way to change a question: new id + deactivate the old one
select lives_ok(
  $$ insert into public.questions (id, skill_id, prompt, options, version)
       values ('q-imm-1-v2', 'imm-skill', 'Improved prompt', '["A","B","C","D"]', 2);
     insert into private.answer_keys (question_id, correct_option) values ('q-imm-1-v2', 2);
     update public.questions set is_active = false where id = 'q-imm-1' $$,
  'a new version can be added and the old one deactivated');

-- ---------- The student submits: graded and shown with what they saw ----------
select is(
  (select correct_option from public.get_answer_keys(array['q-imm-1'])), 1::smallint,
  'grading at submit uses the original answer key');

update public.attempt_items set selected_option = 1, is_correct = true
 where attempt_id = '00000000-0000-4000-8000-0000000000d1';
update public.attempts set status = 'submitted', score = 100, submitted_at = now()
 where id = '00000000-0000-4000-8000-0000000000d1';

select is(
  (select q.prompt from public.attempt_items ai join public.questions q on q.id = ai.question_id
    where ai.attempt_id = '00000000-0000-4000-8000-0000000000d1'),
  'Original prompt',
  'the submitted attempt still shows the original question');

select is(
  (select q.options from public.attempt_items ai join public.questions q on q.id = ai.question_id
    where ai.attempt_id = '00000000-0000-4000-8000-0000000000d1'),
  '["A","B","C","D"]'::jsonb,
  'the submitted attempt still shows the original options');

select is(
  (select count(*)::int from public.questions where skill_id = 'imm-skill' and is_active), 1,
  'only the new version is offered to new attempts');

select * from finish();
rollback;
