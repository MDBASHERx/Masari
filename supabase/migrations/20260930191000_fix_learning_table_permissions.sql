begin;

-- Remove administrative privileges from client roles.
revoke truncate, references, trigger
on table
    public.questions,
    public.attempts,
    public.attempt_items,
    public.learning_plans,
    public.plan_tasks
from public, anon, authenticated;

-- Student reads remain restricted by the existing RLS policies.
grant select
on table
    public.questions,
    public.attempts,
    public.attempt_items,
    public.learning_plans,
    public.plan_tasks
to authenticated;

-- Allow trusted backend services to read learning data.
grant select
on table
    public.questions,
    public.attempts,
    public.attempt_items,
    public.learning_plans,
    public.plan_tasks
to service_role;

commit;