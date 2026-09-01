-- Arena Clash: make Supabase email confirmation the source of truth.
-- This keeps profiles.verified synchronized automatically when Auth confirms an email.

create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an admin can change role.';
  end if;

  if new.verified is distinct from old.verified and not public.is_admin() then
    if not (
      new.verified = true
      and exists (
        select 1
        from auth.users u
        where u.id = new.id
          and u.email_confirmed_at is not null
      )
    ) then
      raise exception 'Verification status can only be changed by email confirmation or an admin.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_self_role_escalation on public.profiles;
create trigger profiles_prevent_self_role_escalation
before update on public.profiles
for each row execute function public.prevent_self_role_escalation();

create or replace function public.sync_profile_email_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null
     and old.email_confirmed_at is distinct from new.email_confirmed_at then
    update public.profiles
    set verified = true, updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists auth_user_email_verified on auth.users;
create trigger auth_user_email_verified
after update of email_confirmed_at on auth.users
for each row execute function public.sync_profile_email_verification();

-- Repair accounts that were already confirmed before this fix.
update public.profiles p
set verified = true, updated_at = now()
from auth.users u
where u.id = p.id
  and u.email_confirmed_at is not null
  and p.verified = false;

revoke execute on function public.sync_profile_email_verification() from public, anon, authenticated;
revoke execute on function public.prevent_self_role_escalation() from public, anon, authenticated;


-- Prevent clients from submitting a manual payment amount different from the tournament fee.
create or replace function public.validate_payment_amount()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare expected_amount numeric;
begin
  select t.entry_fee into expected_amount
  from public.registrations r
  join public.tournaments t on t.id = r.tournament_id
  where r.id = new.registration_id;

  if expected_amount is null or new.amount <> expected_amount then
    raise exception 'Payment amount must exactly match the tournament entry fee.';
  end if;

  return new;
end;
$$;

drop trigger if exists payments_validate_amount on public.payments;
create trigger payments_validate_amount
before insert or update of registration_id, amount on public.payments
for each row execute function public.validate_payment_amount();

revoke execute on function public.validate_payment_amount() from public, anon, authenticated;
