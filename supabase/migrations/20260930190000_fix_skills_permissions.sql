begin;

-- Students can read skills through the existing RLS policy.
grant select on table public.skills to authenticated;

-- Client roles do not need these administrative privileges.
revoke truncate, references, trigger
on table public.skills
from public, anon, authenticated;

commit;