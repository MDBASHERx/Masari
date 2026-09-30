-- Run with: npx supabase test db   (needs the local Supabase stack)
-- Practice totals must include every attempt, not only a recent page,
-- and only the student's own attempts.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000e', 'student-e@test.local'),
  ('00000000-0000-4000-8000-00000000000f', 'student-f@test.local');
insert into public.skills (id, name, position) values ('sum-skill', 'Summary test skill', 96);
insert into public.questions (id, skill_id, prompt, options) values
  ('q-sum-1', 'sum-skill', 'Q', '["a","b"]');

-- Student E: one old diagnostic, then 250 newer practice attempts
insert into public.attempts (id, user_id, type, status, score, submitted_at) values
  ('00000000-0000-4000-8000-0000000000e0', '00000000-0000-4000-8000-00000000000e',
   'diagnostic', 'submitted', 50, now() - interval '30 days');

insert into public.attempts (id, user_id, type, skill_id, status, score, submitted_at)
select ('00000000-0000-4000-8000-' || lpad(to_hex(1000 + n), 12, '0'))::uuid,
       '00000000-0000-4000-8000-00000000000e', 'practice', 'sum-skill', 'submitted', 100,
       now() - (n || ' minutes')::interval
from generate_series(1, 250) as n;

-- Each practice attempt has one item; 200 correct, 50 wrong
insert into public.attempt_items (attempt_id, question_id, position, selected_option, is_correct)
select ('00000000-0000-4000-8000-' || lpad(to_hex(1000 + n), 12, '0'))::uuid, 'q-sum-1', 1, 0, n <= 200
from generate_series(1, 250) as n;

-- Student F: 3 practice attempts that must not leak into E's totals
insert into public.attempts (id, user_id, type, skill_id, status, score, submitted_at)
select ('00000000-0000-4000-8000-' || lpad(to_hex(5000 + n), 12, '0'))::uuid,
       '00000000-0000-4000-8000-00000000000f', 'practice', 'sum-skill', 'submitted', 0, now()
from generate_series(1, 3) as n;
insert into public.attempt_items (attempt_id, question_id, position, selected_option, is_correct)
select ('00000000-0000-4000-8000-' || lpad(to_hex(5000 + n), 12, '0'))::uuid, 'q-sum-1', 1, 1, false
from generate_series(1, 3) as n;

-- ---------- As student E ----------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000e';
set local request.jwt.claims = '{"sub": "00000000-0000-4000-8000-00000000000e", "role": "authenticated"}';

select is((select attempts from public.practice_summary() where skill_id = 'sum-skill'), 250::bigint,
  'all 250 practice attempts are counted');
select is((select total from public.practice_summary() where skill_id = 'sum-skill'), 250::bigint,
  'all 250 practice answers are counted');
select is((select correct from public.practice_summary() where skill_id = 'sum-skill'), 200::bigint,
  'correct answers are counted across all attempts');

select is(
  (select id from public.attempts
    where user_id = '00000000-0000-4000-8000-00000000000e' and type = 'diagnostic' and status = 'submitted'
    order by submitted_at desc limit 1),
  '00000000-0000-4000-8000-0000000000e0'::uuid,
  'the latest diagnostic is still found after 250 newer practice attempts');

-- ---------- As student F ----------
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000f';
set local request.jwt.claims = '{"sub": "00000000-0000-4000-8000-00000000000f", "role": "authenticated"}';

select is((select attempts from public.practice_summary() where skill_id = 'sum-skill'), 3::bigint,
  'another student only sees their own totals');

-- ---------- Anonymous ----------
reset role;
set local role anon;
select throws_ok($$ select * from public.practice_summary() $$, '42501', null,
  'anonymous users cannot call practice_summary');

reset role;
select is(
  (select prosecdef from pg_proc where proname = 'practice_summary'), false,
  'practice_summary runs with the caller''s permissions (security invoker)');

select * from finish();
rollback;
