-- ============================================================================
-- AXKN07 Crochet — Migration v3
-- Adds: multi-image products (up to 4), "colors" renamed to "types", and the
-- Pricing Studio data model (materials, orders/receipts, due-date queue) so
-- the standalone calculator app's features live in this Admin panel instead.
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query → paste all → Run.
-- Safe to re-run: guarded with IF NOT EXISTS / IF EXISTS throughout.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Products: multiple images (max 4 enforced in the app UI) + rename colors→types
-- ----------------------------------------------------------------------------
alter table products
  add column if not exists image_paths text[] not null default '{}';

-- Backfill: move any existing single image_path into the new array so nothing
-- already uploaded is lost. Only runs where image_paths is still empty.
update products
set image_paths = array[image_path]
where image_path is not null and image_path <> '' and coalesce(array_length(image_paths, 1), 0) = 0;

-- image_path stays (unused going forward, kept so nothing errors on old data/rollback).

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'products' and column_name = 'colors'
  ) then
    alter table products rename column colors to types;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- TABLE: materials  (yarn/supply costs used by the Calculator)
-- ----------------------------------------------------------------------------
create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cost_per_unit numeric(10, 2) not null default 0,
  unit text not null default 'pc',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_materials_updated_at on materials;
create trigger trg_materials_updated_at
  before update on materials
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- TABLE: orders  (order builder + receipts, replaces the localStorage version)
-- ----------------------------------------------------------------------------
create sequence if not exists orders_order_no_seq start 1;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique default ('ORD-' || lpad(nextval('orders_order_no_seq')::text, 4, '0')),
  customer text not null,
  contact text,
  order_date date not null default current_date,
  due_date date,
  items jsonb not null default '[]',       -- [{ name, qty, price }]
  discount_type text not null default 'none' check (discount_type in ('none', 'percent', 'flat', 'bulk')),
  discount_value numeric(10, 2) not null default 0,
  fees jsonb not null default '[]',        -- [{ label, amount }]
  downpayment numeric(10, 2) not null default 0,
  received numeric(10, 2) not null default 0,
  notes text,
  subtotal numeric(10, 2) not null default 0,
  discount_amount numeric(10, 2) not null default 0,
  fees_total numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  total_paid numeric(10, 2) not null default 0,
  balance numeric(10, 2) not null default 0,
  status text not null default 'unpaid' check (status in ('unpaid', 'partial', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

create index if not exists idx_orders_created_at on orders (created_at desc);
create index if not exists idx_orders_status on orders (status);

-- ----------------------------------------------------------------------------
-- TABLE: queue  (upcoming/due-soon requests)
-- ----------------------------------------------------------------------------
create table if not exists queue_items (
  id uuid primary key default gen_random_uuid(),
  customer text not null,
  item text not null,
  due_date date,
  priority text not null default 'normal' check (priority in ('normal', 'high')),
  status text not null default 'queued' check (status in ('queued', 'in-progress', 'completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_queue_items_updated_at on queue_items;
create trigger trg_queue_items_updated_at
  before update on queue_items
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- site_settings: Calculator defaults + receipt footer (mirrors the standalone
-- Pricing Studio's Settings tab)
-- ----------------------------------------------------------------------------
alter table site_settings
  add column if not exists default_hourly_rate numeric(10, 2) not null default 60,
  add column if not exists default_margin_pct numeric(5, 2) not null default 35,
  add column if not exists bulk_discount_qty integer not null default 5,
  add column if not exists bulk_discount_pct numeric(5, 2) not null default 10,
  add column if not exists receipt_footer_text text not null default 'Thank you so much for supporting a small business! 🌸';

-- ============================================================================
-- Row Level Security — materials, orders, queue_items are admin-only in every
-- direction (unlike products/categories, these are internal business data,
-- never shown to customers).
-- ============================================================================
alter table materials enable row level security;
alter table orders enable row level security;
alter table queue_items enable row level security;

drop policy if exists "materials_admin_all" on materials;
create policy "materials_admin_all"
  on materials for all
  using (is_admin())
  with check (is_admin());

drop policy if exists "orders_admin_all" on orders;
create policy "orders_admin_all"
  on orders for all
  using (is_admin())
  with check (is_admin());

drop policy if exists "queue_items_admin_all" on queue_items;
create policy "queue_items_admin_all"
  on queue_items for all
  using (is_admin())
  with check (is_admin());

-- ============================================================================
-- Done. After running this, product images/types code and the new Admin
-- Calculator/Materials/Orders/Queue pages will work against these tables.
-- ============================================================================
