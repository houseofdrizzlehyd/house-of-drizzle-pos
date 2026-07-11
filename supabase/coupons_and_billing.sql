-- Run this file once in Supabase SQL Editor.

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  discount_type text not null
    check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10,2) not null
    check (discount_value > 0),
  minimum_order numeric(10,2) not null default 0
    check (minimum_order >= 0),
  maximum_discount numeric(10,2)
    check (maximum_discount is null or maximum_discount > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists coupon_id uuid references public.coupons(id);

alter table public.orders
  add column if not exists coupon_code text;

alter table public.customers
  alter column name set not null;

create index if not exists coupons_active_idx
  on public.coupons(is_active);

alter table public.coupons enable row level security;

drop policy if exists "Authenticated users can read coupons"
  on public.coupons;
drop policy if exists "Admins can create coupons"
  on public.coupons;
drop policy if exists "Admins can update coupons"
  on public.coupons;
drop policy if exists "Admins can delete coupons"
  on public.coupons;

create policy "Authenticated users can read coupons"
on public.coupons
for select
to authenticated
using (true);

create policy "Admins can create coupons"
on public.coupons
for insert
to authenticated
with check (
  (select public.is_admin_or_super_admin())
  and created_by = (select auth.uid())
);

create policy "Admins can update coupons"
on public.coupons
for update
to authenticated
using ((select public.is_admin_or_super_admin()))
with check ((select public.is_admin_or_super_admin()));

create policy "Admins can delete coupons"
on public.coupons
for delete
to authenticated
using ((select public.is_admin_or_super_admin()));
