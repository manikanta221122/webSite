-- Email verification is performed by the auth.users trigger.
-- Do not block that trusted profile update with the duplicate auth.uid()-based trigger.
drop trigger if exists trg_prevent_self_privilege_escalation on public.profiles;
