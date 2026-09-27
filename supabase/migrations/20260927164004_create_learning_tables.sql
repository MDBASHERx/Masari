-- =========================================================
-- my-coach: Learning engine tables (owner: Ward)
-- skills, questions, private.answer_keys, attempts,
-- attempt_items, learning_plans, plan_tasks
-- =========================================================

-- ---------- Skills ----------
create table public.skills (
  id              text primary key,
  subject         text not null default 'math',
  name            text not null,
  description     text,
  prerequisite_id text references public.skills(id),
  position        int  not null default 0
);

-- ---------- Questions (no answers here) ----------
create table public.questions (
  id         text primary key,
  skill_id   text not null references public.skills(id),
  prompt     text not null,
  options    jsonb not null
             check (jsonb_typeof(options) = 'array'
                    and jsonb_array_length(options) between 2 and 6),
  difficulty smallint not null default 1 check (difficulty between 1 and 3),
  version    int not null default 1,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index questions_skill_id_idx on public.questions(skill_id);

-- ---------- Answer keys (private schema, never exposed to the API) ----------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.answer_keys (
  question_id    text primary key references public.questions(id) on delete cascade,
  correct_option smallint not null check (correct_option >= 0),
  explanation    text
);

-- Server-only access to answer keys (called with the secret key via rpc)
create or replace function public.get_answer_keys(p_question_ids text[])
returns table (question_id text, correct_option smallint)
language sql
stable
security definer
set search_path = ''
as $$
  select k.question_id, k.correct_option
  from private.answer_keys k
  where k.question_id = any (p_question_ids);
$$;
revoke execute on function public.get_answer_keys(text[]) from public, anon, authenticated;
grant  execute on function public.get_answer_keys(text[]) to service_role;

-- ---------- Attempts ----------
create table public.attempts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  type              text not null check (type in ('diagnostic', 'practice')),
  skill_id          text references public.skills(id),
  status            text not null default 'in_progress'
                    check (status in ('in_progress', 'submitted')),
  score             numeric(5,2) check (score between 0 and 100),
  submit_request_id text,
  created_at        timestamptz not null default now(),
  submitted_at      timestamptz
);
create index attempts_user_id_idx on public.attempts(user_id, created_at desc);

create table public.attempt_items (
  attempt_id      uuid not null references public.attempts(id) on delete cascade,
  question_id     text not null references public.questions(id),
  position        smallint not null,
  selected_option smallint,
  is_correct      boolean,
  primary key (attempt_id, question_id)
);

-- ---------- Learning plans ----------
create table public.learning_plans (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  source_attempt_id uuid references public.attempts(id),
  version           int not null default 1,
  is_current        boolean not null default true,
  created_at        timestamptz not null default now()
);
create index learning_plans_user_id_idx on public.learning_plans(user_id);
create unique index learning_plans_one_current
  on public.learning_plans(user_id) where is_current;

create table public.plan_tasks (
  id         uuid primary key default gen_random_uuid(),
  plan_id    uuid not null references public.learning_plans(id) on delete cascade,
  skill_id   text not null references public.skills(id),
  title      text not null check (char_length(title) between 1 and 120),
  minutes    smallint not null check (minutes between 5 and 120),
  status     text not null default 'todo'
             check (status in ('todo', 'in_progress', 'done')),
  position   int not null,
  source     text not null default 'plan' check (source in ('plan', 'chat')),
  request_id text,
  created_at timestamptz not null default now()
);
create index plan_tasks_plan_position_idx on public.plan_tasks(plan_id, position);
-- Same accepted suggestion twice => no duplicate task (FR09)
create unique index plan_tasks_request_unique
  on public.plan_tasks(plan_id, request_id) where request_id is not null;

-- =========================================================
-- Row Level Security
-- Students READ their own rows. Scores, attempts, plans and
-- tasks are WRITTEN by the server (secret key + ownership checks).
-- =========================================================
alter table public.skills         enable row level security;
alter table public.questions      enable row level security;
alter table public.attempts       enable row level security;
alter table public.attempt_items  enable row level security;
alter table public.learning_plans enable row level security;
alter table public.plan_tasks     enable row level security;

create policy "skills readable by signed-in users"
  on public.skills for select to authenticated using (true);

create policy "active questions readable by signed-in users"
  on public.questions for select to authenticated using (is_active);

create policy "students read own attempts"
  on public.attempts for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "students read items of own attempts"
  on public.attempt_items for select to authenticated
  using (exists (
    select 1 from public.attempts a
    where a.id = attempt_id and a.user_id = (select auth.uid())
  ));

create policy "students read own plans"
  on public.learning_plans for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "students read tasks of own plans"
  on public.plan_tasks for select to authenticated
  using (exists (
    select 1 from public.learning_plans p
    where p.id = plan_id and p.user_id = (select auth.uid())
  ));

-- Students may change ONLY the status column of their own tasks
revoke update on public.plan_tasks from authenticated;
grant  update (status) on public.plan_tasks to authenticated;

create policy "students update status of own tasks"
  on public.plan_tasks for update to authenticated
  using (exists (
    select 1 from public.learning_plans p
    where p.id = plan_id and p.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.learning_plans p
    where p.id = plan_id and p.user_id = (select auth.uid())
  ));