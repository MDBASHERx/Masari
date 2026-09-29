-- Run with: npx supabase test db   (needs the local Supabase stack)
-- A retry for an older diagnostic must return its original plan and must
-- not create a plan or change the current one.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values ('00000000-0000-4000-8000-00000000000c', 'student-c@test.local');
insert into public.skills (id, name, position) values ('plan-test-skill', 'Plan test skill', 98);

insert into public.attempts (id, user_id, type, status, score) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-00000000000c', 'diagnostic', 'submitted', 50),
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-00000000000c', 'diagnostic', 'submitted', 80);

create temp table results (step text, result jsonb);

insert into results select 'A', public.create_plan('00000000-0000-4000-8000-00000000000c',
  '00000000-0000-4000-8000-0000000000c1', '[{"skillId":"plan-test-skill","title":"A","minutes":10,"position":1}]');
insert into results select 'B', public.create_plan('00000000-0000-4000-8000-00000000000c',
  '00000000-0000-4000-8000-0000000000c2', '[{"skillId":"plan-test-skill","title":"B","minutes":10,"position":1}]');
insert into results select 'retry A', public.create_plan('00000000-0000-4000-8000-00000000000c',
  '00000000-0000-4000-8000-0000000000c1', '[{"skillId":"plan-test-skill","title":"A again","minutes":10,"position":1}]');

select is((select result->>'created' from results where step = 'A'), 'true', 'plan A is created');
select is((select result->>'created' from results where step = 'B'), 'true', 'plan B is created');
select is((select result->>'created' from results where step = 'retry A'), 'false', 'retry A creates nothing');

select is(
  (select result->>'planId' from results where step = 'retry A'),
  (select result->>'planId' from results where step = 'A'),
  'retry A returns the original plan A');

select is((select result->>'isCurrent' from results where step = 'retry A'), 'false',
  'retry A reports that plan A is no longer current');

select is(
  (select count(*)::int from public.learning_plans where user_id = '00000000-0000-4000-8000-00000000000c'), 2,
  'still exactly two plans');

select is(
  (select source_attempt_id from public.learning_plans
    where user_id = '00000000-0000-4000-8000-00000000000c' and is_current),
  '00000000-0000-4000-8000-0000000000c2'::uuid,
  'plan B is still the current plan');

select throws_ok(
  $$ insert into public.learning_plans (user_id, source_attempt_id, version, is_current)
     values ('00000000-0000-4000-8000-00000000000c', '00000000-0000-4000-8000-0000000000c1', 9, false) $$,
  '23505', null,
  'the database itself refuses a second plan for the same attempt');

select * from finish();
rollback;
