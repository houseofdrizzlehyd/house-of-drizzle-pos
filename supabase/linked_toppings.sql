-- Run this file once in Supabase SQL Editor.

alter table public.products
  add column if not exists is_topping boolean not null default false;

alter table public.order_items
  add column if not exists parent_order_item_id uuid
  references public.order_items(id)
  on delete cascade;

create index if not exists order_items_parent_idx
  on public.order_items(parent_order_item_id);

-- Existing products in a category named "Toppings" are marked automatically.
update public.products p
set is_topping = true
from public.categories c
where p.category_id = c.id
  and lower(c.name) = 'toppings';
