-- ============================================================================
-- AXKN07 Crochet — Migration v2
-- Adds columns needed for: category icons, "How to Pay" section (QR image),
-- and lead-time notes for Made to Order / Limited items.
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query → paste all → Run.
-- Safe to re-run: every statement uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- ============================================================================

-- Category icon (a single emoji, e.g. 🔑 🧸 👜) shown on filter chips and in admin.
alter table categories
  add column if not exists icon text;

-- "How to Pay" section: a short instructions block plus an optional QR code image
-- (GCash / Maya) stored in the same product-images bucket, under the "branding" folder.
alter table site_settings
  add column if not exists how_to_pay_text text,
  add column if not exists payment_qr_path text;

-- Default lead-time notes shown under the availability badge for Made to Order /
-- Limited items. Editable in Admin → Settings; blank means "don't show a note".
alter table site_settings
  add column if not exists made_to_order_note text,
  add column if not exists limited_stock_note text;

-- Seed sensible defaults for the two note fields on the existing settings row,
-- but only if they're still empty (won't overwrite anything you've already set).
update site_settings
set
  made_to_order_note = coalesce(made_to_order_note, 'Made to order — please allow 3–5 days before shipping.'),
  limited_stock_note = coalesce(limited_stock_note, 'Limited stock — order soon before it''s gone.'),
  how_to_pay_text = coalesce(
    how_to_pay_text,
    'Pay via GCash or Maya using the QR code below, or send payment directly to the number on the receipt after you message us your order.'
  )
where true;
