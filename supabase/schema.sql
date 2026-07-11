create extension if not exists pgcrypto;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id),
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text not null unique,
  birthday date,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  bill_number bigint generated always as identity unique,
  customer_id uuid references public.customers(id),
  subtotal numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  payment_method text not null check (payment_method in ('cash','upi','card')),
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity integer not null check (quantity > 0),
  line_total numeric(10,2) not null
);

create index orders_created_at_idx on public.orders(created_at);
create index customers_phone_idx on public.customers(phone);
create index order_items_order_id_idx on public.order_items(order_id);
