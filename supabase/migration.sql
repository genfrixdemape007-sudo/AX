-- ============================================================================
-- AXKN07 Crochet — Customer Price List
-- Supabase schema + Row Level Security migration
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query → paste all → Run.
-- Safe to re-run: most statements use IF NOT EXISTS / OR REPLACE guards, but
-- policies are dropped and recreated so you can re-run this after edits.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Helper: shared updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- TABLE: categories
-- ============================================================================
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_categories_updated_at on categories;
create trigger trg_categories_updated_at
  before update on categories
  for each row execute function set_updated_at();

create index if not exists idx_categories_display_order on categories (display_order);

-- ============================================================================
-- TABLE: products
-- ============================================================================
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  short_description text,
  description text,
  category_id uuid references categories (id) on delete set null,
  image_path text,
  colors text[] not null default '{}',
  size text,
  availability text not null default 'Available'
    check (availability in ('Available', 'Limited', 'Sold Out', 'Made to Order')),
  note text,
  featured boolean not null default false,
  is_new boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

create index if not exists idx_products_category_id on products (category_id);
create index if not exists idx_products_availability on products (availability);
create index if not exists idx_products_display_order on products (display_order);

-- gin_trgm_ops needs pg_trgm for fast ILIKE search.
create extension if not exists pg_trgm;
create index if not exists idx_products_name_trgm on products using gin (name gin_trgm_ops);

-- ============================================================================
-- TABLE: site_settings  (expected to hold exactly one row)
-- ============================================================================
create table if not exists site_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'AXKN07 Crochet',
  tagline text,
  welcome_message text,
  tutorial_content text,
  price_disclaimer text,
  contact_url text,
  logo_path text,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_site_settings_updated_at on site_settings;
create trigger trg_site_settings_updated_at
  before update on site_settings
  for each row execute function set_updated_at();

-- Seed the single settings row if the table is empty.
insert into site_settings (business_name, tagline, welcome_message, price_disclaimer)
select
  'AXKN07 Crochet',
  'Handmade with love',
  'Browse our handmade crochet pieces, check their prices, and find something special for yourself or someone you love.',
  'Prices may vary slightly depending on size, materials, and customization.'
where not exists (select 1 from site_settings);

-- ============================================================================
-- TABLE: admin_users
-- ============================================================================
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table categories enable row level security;
alter table products enable row level security;
alter table site_settings enable row level security;
alter table admin_users enable row level security;

-- Helper: is the current auth session an admin? Defined as a function so every
-- policy below shares the exact same check (and it's easy to audit in one place).
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from admin_users where user_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- categories policies
-- ---------------------------------------------------------------------------
drop policy if exists "categories_public_select" on categories;
create policy "categories_public_select"
  on categories for select
  using (true);

drop policy if exists "categories_admin_insert" on categories;
create policy "categories_admin_insert"
  on categories for insert
  with check (is_admin());

drop policy if exists "categories_admin_update" on categories;
create policy "categories_admin_update"
  on categories for update
  using (is_admin())
  with check (is_admin());

drop policy if exists "categories_admin_delete" on categories;
create policy "categories_admin_delete"
  on categories for delete
  using (is_admin());

-- ---------------------------------------------------------------------------
-- products policies
-- ---------------------------------------------------------------------------
drop policy if exists "products_public_select" on products;
create policy "products_public_select"
  on products for select
  using (true);

drop policy if exists "products_admin_insert" on products;
create policy "products_admin_insert"
  on products for insert
  with check (is_admin());

drop policy if exists "products_admin_update" on products;
create policy "products_admin_update"
  on products for update
  using (is_admin())
  with check (is_admin());

drop policy if exists "products_admin_delete" on products;
create policy "products_admin_delete"
  on products for delete
  using (is_admin());

-- ---------------------------------------------------------------------------
-- site_settings policies
-- ---------------------------------------------------------------------------
drop policy if exists "site_settings_public_select" on site_settings;
create policy "site_settings_public_select"
  on site_settings for select
  using (true);

drop policy if exists "site_settings_admin_insert" on site_settings;
create policy "site_settings_admin_insert"
  on site_settings for insert
  with check (is_admin());

drop policy if exists "site_settings_admin_update" on site_settings;
create policy "site_settings_admin_update"
  on site_settings for update
  using (is_admin())
  with check (is_admin());

drop policy if exists "site_settings_admin_delete" on site_settings;
create policy "site_settings_admin_delete"
  on site_settings for delete
  using (is_admin());

-- ---------------------------------------------------------------------------
-- admin_users policies
-- No INSERT/UPDATE/DELETE policy is created for any role here — this table is
-- only ever written to from the Supabase SQL Editor (or by a service-role key
-- you control), so it is impossible for anyone, including an existing admin
-- acting through the app, to grant themselves or anyone else admin access via
-- the public API. Only SELECT is exposed, and only to admins, purely so the
-- admin UI can check "am I an admin" for the logged-in user.
-- ---------------------------------------------------------------------------
drop policy if exists "admin_users_self_select" on admin_users;
create policy "admin_users_self_select"
  on admin_users for select
  using (user_id = auth.uid());

-- ============================================================================
-- Storage: product-images bucket
-- ============================================================================
insert into storage.buckets (id, name, public)
select 'product-images', 'product-images', true
where not exists (select 1 from storage.buckets where id = 'product-images');

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());

-- ============================================================================
-- Done.
-- Next steps (see README.md "Supabase Setup"):
--   1. Enable Email/Password auth in Authentication → Providers.
--   2. Create your owner account in Authentication → Users → Add user.
--   3. Copy that user's UUID.
--   4. Run:  insert into admin_users (user_id) values ('paste-uuid-here');
-- ============================================================================
