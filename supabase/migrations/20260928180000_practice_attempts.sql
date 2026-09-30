-- =========================================================
-- my-coach: guided practice attempts (owner: Ward)
-- =========================================================

-- A practice attempt always belongs to one skill
alter table public.attempts
  add constraint attempts_practice_needs_skill
  check (type <> 'practice' or skill_id is not null);

-- At most one open practice per skill per student
create unique index attempts_one_open_practice_per_skill
  on public.attempts(user_id, skill_id)
  where status = 'in_progress' and type = 'practice';
