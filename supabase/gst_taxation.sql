create table if not exists public.tax_settings (
  id integer primary key default 1 check (id = 1),
  gst_enabled boolean not null default true,
  gst_rate numeric(5,2) not null default 5.00 check (gst_rate >= 0 and gst_rate <= 100),
  prices_include_tax boolean not null default true,
  invoice_prefix text not null default 'HOD',
  state_name text not null default 'Telangana',
  place_of_supply text not null default 'Telangana',
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
insert into public.tax_settings (id) values (1) on conflict (id) do nothing;
alter table public.orders add column if not exists invoice_number text;
alter table public.orders add column if not exists taxable_value numeric(10,2) not null default 0;
alter table public.orders add column if not exists cgst numeric(10,2) not null default 0;
alter table public.orders add column if not exists sgst numeric(10,2) not null default 0;
alter table public.orders add column if not exists igst numeric(10,2) not null default 0;
alter table public.orders add column if not exists gst_rate numeric(5,2) not null default 0;
alter table public.orders add column if not exists prices_include_tax boolean not null default true;
create unique index if not exists orders_invoice_number_unique_idx on public.orders(invoice_number) where invoice_number is not null;
alter table public.tax_settings enable row level security;
drop policy if exists "Authenticated users can read tax settings" on public.tax_settings;
drop policy if exists "Admins can update tax settings" on public.tax_settings;
drop policy if exists "Admins can insert tax settings" on public.tax_settings;
create policy "Authenticated users can read tax settings" on public.tax_settings for select to authenticated using (true);
create policy "Admins can update tax settings" on public.tax_settings for update to authenticated using ((select public.is_admin_or_super_admin())) with check ((select public.is_admin_or_super_admin()));
create policy "Admins can insert tax settings" on public.tax_settings for insert to authenticated with check ((select public.is_admin_or_super_admin()) and updated_by = (select auth.uid()));
