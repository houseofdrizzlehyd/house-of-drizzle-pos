-- Run this file once in Supabase SQL Editor.

create table if not exists public.bill_settings (
  id integer primary key default 1 check (id = 1),
  business_name text not null default 'House of Drizzle',
  tagline text default 'Sip. Scoop. Drizzle. Repeat.',
  address text,
  phone text,
  gst_number text,
  footer_message text default 'Thank you for visiting!',
  logo_data_url text,
  show_logo boolean not null default true,
  show_tagline boolean not null default true,
  show_address boolean not null default true,
  show_phone boolean not null default true,
  show_gst boolean not null default true,
  show_customer_name boolean not null default true,
  show_customer_phone boolean not null default true,
  show_coupon boolean not null default true,
  show_payment_method boolean not null default true,
  show_item_rate boolean not null default true,
  header_alignment text not null default 'center'
    check (header_alignment in ('left', 'center', 'right')),
  receipt_font_size text not null default 'medium'
    check (receipt_font_size in ('small', 'medium', 'large')),
  divider_style text not null default 'dashed'
    check (divider_style in ('dashed', 'solid', 'none')),
  paper_width integer not null default 80
    check (paper_width in (58, 80)),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

insert into public.bill_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.bill_settings enable row level security;

drop policy if exists "Authenticated users can read bill settings"
  on public.bill_settings;
drop policy if exists "Admins can update bill settings"
  on public.bill_settings;
drop policy if exists "Admins can insert bill settings"
  on public.bill_settings;

create policy "Authenticated users can read bill settings"
on public.bill_settings
for select
to authenticated
using (true);

create policy "Admins can update bill settings"
on public.bill_settings
for update
to authenticated
using ((select public.is_admin_or_super_admin()))
with check ((select public.is_admin_or_super_admin()));

create policy "Admins can insert bill settings"
on public.bill_settings
for insert
to authenticated
with check (
  (select public.is_admin_or_super_admin())
  and updated_by = (select auth.uid())
);
