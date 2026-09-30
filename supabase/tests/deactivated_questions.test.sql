-- Run with: npx supabase test db   (needs the local Supabase stack)
-- A deactivated question must stay readable inside the student's own
-- attempts, and stay hidden from everyone else.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

-- ---------- Setup (as postgres) ----------
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'student-a@test.local'),
  ('00000000-0000-4000-8000-00000000000b', 'student-b@test.local');

insert into public.skills (id, name, position) values ('test-skill', 'Test skill', 99);
insert into public.questions (id, skill_id, prompt, options) values
  ('test-q-1', 'test-skill', 'Q1', '["a","b"]'),
  ('test-q-2', 'test-skill', 'Q2', '["a","b"]');

insert into public.attempts (id, user_id, type) values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-00000000000a', 'diagnostic');
insert into public.attempt_items (attempt_id, question_id, position) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-q-1', 1);

update public.questions set is_active = false where id in ('test-q-1', 'test-q-2');

-- ---------- Student A (owns an attempt with test-q-1) ----------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
set local request.jwt.claims = '{"sub": "00000000-0000-4000-8000-00000000000a", "role": "authenticated"}';

select is(
  (select count(*)::int from public.questions where id = 'test-q-1'), 1,
  'student can still read a deactivated question from their own attempt');

select is(
  (select q.prompt from public.attempt_items ai
     join public.questions q on q.id = ai.question_id
    where ai.attempt_id = '00000000-0000-4000-8000-0000000000a1'), 'Q1',
  'resuming/reviewing the attempt still returns the question');

select is(
  (select count(*)::int from public.questions where id = 'test-q-2'), 0,
  'a deactivated question that is not in their attempts stays hidden');

select is(
  (select count(*)::int from public.questions where is_active and skill_id = 'test-skill'), 0,
  'new attempts cannot pick deactivated questions');

-- ---------- Student B (no attempts) ----------
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
set local request.jwt.claims = '{"sub": "00000000-0000-4000-8000-00000000000b", "role": "authenticated"}';

select is(
  (select count(*)::int from public.questions where id = 'test-q-1'), 0,
  'another student cannot read the deactivated question');

select is(
  (select count(*)::int from public.attempt_items
    where attempt_id = '00000000-0000-4000-8000-0000000000a1'), 0,
  'another student cannot see the attempt items');

-- ---------- Answer keys stay private ----------
select throws_ok(
  $$ select * from private.answer_keys $$,
  '42501', null,
  'students still cannot read answer keys');

select * from finish();
rollback;
