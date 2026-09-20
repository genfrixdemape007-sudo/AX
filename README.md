# AXKN07 Crochet — Customer Price List

A customer-facing companion app for AXKN07 Crochet — Pricing Studio. Customers browse a read-only
price list and message you to order; you manage products, categories, and settings from a
password-protected admin dashboard. Built with React + Vite on the frontend and Supabase
(Postgres, Auth, Storage, Row Level Security) on the backend — no traditional server to run.

## 1. Local development

```bash
npm install
npm run dev
```

This starts a local dev server (usually at `http://localhost:5173`). You'll need a Supabase
project connected first — see the next section — or the app will show load errors since there's
no database to talk to yet.

## 2. Supabase setup

### 2.1 Create the project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Wait for it to finish provisioning.

### 2.2 Run the schema

1. Open **SQL Editor** in the Supabase dashboard.
2. Open `supabase/migration.sql` from this project, copy all of it, and paste it into a new query.
3. Click **Run**.

This creates the `categories`, `products`, `site_settings`, and `admin_users` tables, enables Row
Level Security on all of them, creates the policies that enforce read-only access for customers
and full access for admins, and creates the `product-images` storage bucket with matching storage
policies. It also seeds one default row into `site_settings`.

### 2.3 Enable email/password login

In **Authentication → Providers**, make sure **Email** is enabled.

### 2.4 Create your admin account

There is no public "sign up as admin" page anywhere in this app, on purpose — that's a deliberate
security decision, not a missing feature. Create your own account directly in Supabase instead:

1. Go to **Authentication → Users → Add user**.
2. Enter your email and a password. You can toggle "Auto Confirm User" so you don't need to
   verify an email.
3. Copy the new user's **UID** (shown in the users table).
4. Back in **SQL Editor**, run:
   ```sql
   insert into admin_users (user_id) values ('paste-the-uuid-here');
   ```
5. Log in at `/admin/login` with that email and password.

Only rows in `admin_users` can write to products, categories, or settings — this is enforced by
the RLS policies from the migration, at the database level, not just hidden in the frontend.

### 2.5 Verify the storage bucket

In **Storage**, confirm a `product-images` bucket exists (the migration creates it) and that it's
marked **Public** so customers can view product photos.

## 3. Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in the two values from **Project Settings → API** in your Supabase dashboard:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Use the **anon / public** key only — never the `service_role` key. The anon key is safe to expose
in frontend code because every table it touches is locked down by RLS; the service-role key
bypasses RLS entirely and must never appear in this project, in GitHub, or in any frontend
environment variable on Netlify.

`.env` is already in `.gitignore` — never commit it with real values.

## 4. Deploying to Netlify

1. Push this project to a GitHub repository.
2. In Netlify, click **Add new site → Import an existing project** and connect that repo.
3. Build settings (Netlify should detect these automatically from `netlify.toml`, but confirm):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. In **Site configuration → Environment variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**.

`netlify.toml` already includes the SPA redirect rule so that routes like `/prices`,
`/product/123`, and `/admin` work correctly on direct load and on browser refresh — you don't need
to configure this separately in the Netlify UI.

### QR codes

`/prices` works as a direct entry point on its own — point a QR code straight at
`https://your-site.netlify.app/prices` and customers can browse without visiting the homepage
first.

## 5. Project structure

```
src/
  components/    Reusable UI: ProductCard, SearchBar, CategoryFilter, ImageUploader, etc.
  contexts/      AuthContext (session + admin check), SettingsContext (site_settings cache)
  hooks/         useAuth, useProducts, useCategories, useSettings
  layouts/       CustomerLayout (public header/footer), AdminLayout (sidebar nav)
  lib/           Supabase client
  pages/
    customer/    Home (tutorial), PriceList, ProductDetails
    admin/       AdminLogin, AdminDashboard, AdminProducts, AdminProductForm,
                 AdminCategories, AdminSettings
  services/      All Supabase queries — productService, categoryService,
                 settingsService, storageService. UI components never call
                 Supabase directly; they go through these.
supabase/
  migration.sql  Full schema + RLS policies + storage bucket setup
```

## 6. Security model (how customer vs. admin access actually works)

- Customers never authenticate. Every table they can read (`products`, `categories`,
  `site_settings`) has an RLS policy allowing `SELECT` to everyone — but no `INSERT`, `UPDATE`, or
  `DELETE` policy exists for them, so those operations are rejected by Postgres itself, even if
  someone opens the browser console and calls the Supabase client directly.
- `/admin/*` routes are wrapped in a `ProtectedRoute` component that checks for a logged-in
  session **and** a matching row in `admin_users`. This is a UX convenience — it prevents a logged
  out visitor from ever seeing the admin screens — but it is not the actual security boundary.
- The actual boundary is the `is_admin()` SQL function used in every write policy on `products`,
  `categories`, and `site_settings`. A request only succeeds if the authenticated user's ID exists
  in `admin_users`.
- `admin_users` itself has no INSERT/UPDATE/DELETE policy for any role reachable through the app's
  anon or authenticated keys — the only way to add an admin is to run SQL directly in the Supabase
  dashboard. This closes off the obvious self-promotion loophole ("what stops a logged-in customer
  from just inserting themselves into admin_users?").

## 7. What customers never see

Nothing in this app exposes material costs, labor rates, margins, internal calculations, orders,
payments, revenue, or receipts — those stay in your separate Pricing Studio. This app only ever
reads and displays the customer-facing fields: name, image, final price, description, category,
availability, colors, size, and customer-facing notes.

## 8. Connecting this to Pricing Studio later

The `products` table here is meant to eventually be written to by your Pricing Studio, so a
product you finalize there could appear here automatically. To wire that up later, point Pricing
Studio's product-save action at the same Supabase project (or sync into it) using the final
customer-facing price — this app doesn't duplicate any pricing/calculation logic itself, so there's
nothing to reconcile.

## 9. Testing checklist

Before considering this live, walk through:

**Customer:** homepage loads, tutorial reads correctly, `/prices` loads directly (no need to visit
`/` first), search and category filters work, product details load, images display, prices show
with ₱, Message to Order opens your configured link, refreshing any route works.

**Admin:** login rejects bad credentials, dashboard stats are correct, add/edit/delete product
works end to end including image upload and replacement, category add/rename/delete/reorder
works, settings save and immediately reflect on the public pages, logout works.

**Security:** open the site in an incognito window (no admin session) and, from the browser
console, try calling `supabase.from('products').insert(...)` directly against your project URL —
it should be rejected. Confirm `/admin` redirects to `/admin/login` when logged out.
