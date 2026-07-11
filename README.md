# House of Drizzle POS

## Current milestone

This version includes:

- Supabase email/password login
- Cookie-based server-side session handling
- Protected POS, report and administration routes
- Biller, admin and super-admin role checks
- Products loaded directly from Supabase
- Admin category creation and enable/disable controls
- Admin product creation and enable/disable controls
- Super-admin staff listing
- Sign out
- Role-aware navigation

Bill completion, customer saving, bill editing/voiding, reports and WhatsApp
receipts are the next development milestones.

## Environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

Restart `npm run dev` after changing environment variables.

## Install and run

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Applying this update to an existing project

Back up your existing `.env.local`, then copy the files from this ZIP over the
existing project and allow replacement. Do not replace your `.env.local`.

Run:

```powershell
npm install
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

## Login

Use the email and password created in Supabase Authentication. Your matching
`profiles` row must be active and have one of these roles:

- `biller`
- `admin`
- `super_admin`

## Logo update

- The sidebar text branding has been replaced with the House of Drizzle logo.
- The logo is stored at `public/house-of-drizzle-logo.png`.

## Staff role management

Add the server-only key to `.env.local`:

```env
SUPABASE_SECRET_KEY=your-secret-key
```

The Super Admin can create Biller/Admin accounts, change roles, activate/deactivate staff, and reset passwords. Never prefix this variable with `NEXT_PUBLIC_`.


## Coupons and redesigned billing

Before starting the updated app, run this SQL file in Supabase SQL Editor:

```text
supabase/coupons_and_billing.sql
```

This update adds:

- Admin/Super Admin coupon creation and activation
- Biller coupon selection during checkout
- Required customer name and 10-digit mobile number
- Server-side coupon validation
- Customer creation/update
- Order and order-item saving
- Improved billing layout
- Transparent logo area without the sidebar background panel


## 3-inch thermal printing

After a bill is saved, the POS asks whether to print. The receipt is formatted for 80 mm paper. Install the Windows printer driver, select 80 mm paper, disable headers/footers, and use 100% scale.


## Bill settings and receipt designer

Run this SQL file in Supabase SQL Editor:

```text
supabase/bill_settings.sql
```

Admins and Super Admins can then open **Bill Settings** to configure:

- Business name, tagline, address, phone and GSTIN
- Bill logo upload
- Footer message
- 58 mm or 80 mm paper
- Header alignment
- Receipt font size
- Divider style
- Visibility of customer, coupon, payment and item-rate fields
- Live thermal receipt preview

The designer is intentionally settings-based rather than free-form drag-and-drop,
which keeps receipt output stable across thermal printer drivers.


## Linked topping builder

Run this SQL in Supabase SQL Editor:

```text
supabase/linked_toppings.sql
```

This update adds:

- Product-level topping flag
- Main product selection in the cart
- Touch-friendly topping cards
- Toppings linked to a specific main item
- Nested topping display in cart and printed receipt
- Automatic topping removal when the parent item is removed
- Parent-child order item storage using `parent_order_item_id`

Existing products under a category named **Toppings** are automatically marked
as topping products by the migration.

## GST taxation
Run `supabase/gst_taxation.sql` in Supabase SQL Editor. Adds 5% inclusive GST, CGST/SGST, HOD invoice numbering, receipt tax breakup, Tax Settings and GST Reports.
