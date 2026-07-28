# House of Drizzle — online ordering

Mobile-friendly QR ordering for dine-in customers, plus an admin dashboard for
orders, menu management, and sales reporting.

Stack: Next.js (App Router) on Vercel, Supabase (Postgres + Auth).

## How it works

Customers scan a table QR code, which opens the site. They browse the menu
(search, today's special, must try, categories), build a cart with topping
customizations, and check out with just their name and mobile number — no
payment online. They get an order number and walk to the counter to pay.

Staff use the admin dashboard (works on laptop or tablet) to:
- see incoming orders, mark them paid at the counter, then move them through
  preparing → ready → completed
- manage the menu: items, prices, toppings, availability, and which items are
  flagged as today's special / must try / the loyalty reward dish
- view sales reports with a CGST/SGST tax breakup, since all menu prices are
  tax-inclusive

Returning customers (recognized by mobile number) get a free reward dish
automatically applied on every 6th order.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL Editor**, paste the contents of `supabase/schema.sql`, and
   run it. This creates all tables, the order-number sequence, and row-level
   security policies.
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` key (keep this secret — never expose it in the browser)
4. Go to **Authentication → Users → Add user** and create the single shared
   admin login (an email + password the staff will use to sign in to
   `/admin`). This project uses one shared account, not per-staff logins.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the three values from step 1:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 3. Run locally

```
npm install
npm run dev
```

Visit `http://localhost:3000` for the customer site and
`http://localhost:3000/admin/login` for the admin dashboard.

## 4. Bulk-import the menu

Once you've reviewed `house_of_drizzle_menu_import.xlsx` (edit descriptions,
fill in the yellow columns — today's special, must try, reward dish, GST %),
run:

```
node --env-file=.env.local scripts/import-menu.mjs /path/to/house_of_drizzle_menu_import.xlsx
```

This creates all categories and products, and automatically attaches the
"Extra scoop" topping to every ice cream item at the right tier price
(regular/premium/signature), based on the "Add-ons" tab. Set exactly one
product's "Reward dish" toggle in the yellow column (or later in the admin
menu manager) — that's the dish given free on every 6th order.

Product photos aren't part of the spreadsheet. After importing, upload
photos to Supabase Storage (create a public bucket, e.g. `menu-images`) and
paste each image's public URL into the product's "Image URL" field in the
admin menu manager.

## 5. Deploy to Vercel

1. Push this project to a Git repository (GitHub/GitLab/Bitbucket).
2. In Vercel, import the repository.
3. Add the same three environment variables from step 2 in the Vercel
   project's **Settings → Environment Variables**.
4. Deploy, then attach your existing domain under **Settings → Domains**.

## Project structure

```
src/app/                customer pages: home, category, product, cart, order status
src/app/admin/          admin pages: login, orders, menu, reports
src/app/api/            order placement + admin API routes (all writes go through
                        these, using the Supabase service role key server-side)
src/lib/supabase/       browser client, server client, service-role client
src/lib/tax.ts          tax-inclusive → CGST/SGST breakup calculation
src/lib/cart-context.tsx client-side cart state (persisted to localStorage)
supabase/schema.sql     full database schema + RLS policies
scripts/import-menu.mjs bulk menu import from the reviewed spreadsheet
```

## Notes and assumptions

- **Single shared admin login.** Anyone with the credentials can manage
  orders, menu, and reports. There's no per-staff attribution.
- **No online payment.** Every order is pay-at-counter; admin marks it paid
  manually, which also moves it into "preparing".
- **Loyalty reward:** every 6th order (per mobile number) gets one specific
  admin-configured dish for free, applied automatically at checkout.
- **Tax breakup** assumes intra-state GST (CGST + SGST split evenly from the
  product's GST %). If you also sell inter-state, this would need an IGST
  variant — flag it if that becomes relevant.
- **Report date ranges** (today/week/month) use the server's clock at
  midnight; if Vercel's server timezone doesn't match yours, the "today"
  boundary may be off by a few hours. Easy to adjust in
  `src/app/api/admin/reports/route.ts` if it matters.
