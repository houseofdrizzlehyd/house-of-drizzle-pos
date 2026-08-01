-- House of Drizzle — Supabase schema
-- Run this once in the Supabase SQL editor for a new project.
-- Hierarchy: categories -> products -> toppings

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Menu
-- ---------------------------------------------------------------------------

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  description text,
  price numeric(10,2) not null,           -- tax-inclusive price, in Rs
  gst_rate numeric(5,2) not null default 5, -- GST %, used only to back-calculate the tax breakup for reports
  image_url text,
  is_available boolean not null default true,
  is_todays_special boolean not null default false,
  is_must_try boolean not null default false,
  is_reward_dish boolean not null default false, -- the dish auto-given free on every Nth order
  created_at timestamptz not null default now()
);

create index if not exists products_category_id_idx on products(category_id);

create table if not exists toppings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists toppings_product_id_idx on toppings(product_id);

-- ---------------------------------------------------------------------------
-- Business settings (key/value so rules like the reward milestone can change
-- without a code deploy)
-- ---------------------------------------------------------------------------

create table if not exists settings (
  key text primary key,
  value jsonb not null
);

insert into settings (key, value)
values ('reward_milestone_every_n_orders', '6')
on conflict (key) do nothing;

insert into settings (key, value)
values ('delivery_minimum_order_amount', '200')
on conflict (key) do nothing;

insert into settings (key, value)
values ('delivery_charge_amount', '0')
on conflict (key) do nothing;

insert into settings (key, value)
values ('delivery_radius_km', '5')
on conflict (key) do nothing;

insert into settings (key, value)
values ('accepting_orders', 'true')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Customers (recognized by mobile number, tracked for the loyalty milestone)
-- ---------------------------------------------------------------------------

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  mobile_number text not null unique,
  name text not null,
  order_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Coupons (percentage-off, admin controls whether shown on POS, web, or both)
-- ---------------------------------------------------------------------------

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  discount_percent numeric(5,2) not null,
  is_active boolean not null default true,
  show_on_pos boolean not null default false,
  show_on_web boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create sequence if not exists order_number_seq start 1;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint not null unique default nextval('order_number_seq'),
  customer_id uuid not null references customers(id) on delete restrict,
  customer_name text not null,
  customer_mobile text not null,
  status text not null default 'placed' check (status in ('placed','preparing','ready','completed')),
  is_paid boolean not null default false,
  subtotal numeric(10,2) not null,        -- final amount to collect, post-discount (reward items counted as 0)
  reward_applied text not null default 'none' check (reward_applied in ('none','free_dish')),
  reward_product_id uuid references products(id),
  source text not null default 'web' check (source in ('web','pos')),
  coupon_id uuid references coupons(id),
  discount_amount numeric(10,2) not null default 0,
  order_type text not null default 'dine_in' check (order_type in ('dine_in','delivery')),
  delivery_address text,           -- required when order_type = 'delivery'; staff calls to confirm it's within range
  delivery_charge numeric(10,2) not null default 0, -- snapshot of settings.delivery_charge_amount at order time
  delivery_lat double precision,   -- customer-dropped pin, for radius enforcement + staff "view on map"
  delivery_lng double precision,
  is_invalid boolean not null default false, -- staff-flagged test/junk order; excluded from the live queue and reports, but kept for the day history view
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz
);

create index if not exists orders_status_idx on orders(status);
create index if not exists orders_created_at_idx on orders(created_at);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  product_name text not null,
  category_name text,              -- snapshot of the product's category at order time, for bills/reports
  quantity int not null default 1,
  unit_price numeric(10,2) not null,      -- tax-inclusive price per unit, before toppings
  topping_names text[] not null default '{}',
  topping_price numeric(10,2) not null default 0,
  line_total numeric(10,2) not null,      -- (unit_price + topping_price) * quantity, or 0 if is_free_reward
  gst_rate numeric(5,2) not null default 5,
  is_free_reward boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on order_items(order_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Menu tables (categories/products/toppings) are readable by anyone so the
-- customer-facing site can query them with the public anon key. All writes
-- to every table go through server-side API routes using the Supabase
-- service role key (which bypasses RLS), after the route checks the admin's
-- Supabase Auth session — so no INSERT/UPDATE/DELETE policies are defined
-- here for anon/authenticated roles, and customers/orders/order_items have
-- no anon/authenticated policies at all (service role only).
-- ---------------------------------------------------------------------------

alter table categories enable row level security;
alter table products enable row level security;
alter table toppings enable row level security;
alter table settings enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table coupons enable row level security;

create policy "public can read categories" on categories
  for select using (true);

create policy "public can read products" on products
  for select using (true);

create policy "public can read toppings" on toppings
  for select using (true);

-- settings, customers, orders, order_items, coupons: intentionally no
-- policies, so only the service role (used exclusively in trusted server
-- code) can touch them. Coupons are fetched for display via a server-side
-- API route (/api/coupons) that filters by channel and active status before
-- returning anything to the browser — never expose this table to anon.
-- Do not add anon/authenticated policies to these tables.
