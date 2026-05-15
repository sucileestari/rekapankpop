# Aplikasi Rekap Transaksi

Aplikasi full-stack untuk rekap transaksi anggota. Frontend memakai Vue.js + Vite, backend memakai Node.js + Express, dan database memakai Supabase PostgreSQL.

## Fitur

- Login sebagai `guest`, `admin`, dan `super admin`.
- Guest bisa melihat data, admin dan super admin bisa menambah data.
- Menu Anggota berisi list anggota, search nama/nomor WA, Add Anggota, Edit, dan Delete.
- Menu Rekap berisi category Korea, Jepang, Thailand, dan China.
- Category Rekap bisa ditambah, diedit, dan dihapus dengan field Nama Rekapan dan Image.
- Upload image Category Rekap dibatasi ke format JPG, JPEG, PNG, dan SVG.
- Saat edit Category Rekap, image bisa diganti dengan upload baru.
- Klik category untuk masuk ke halaman detail category.
- Halaman detail category punya button Add Batch dan Add Rekapan.
- Batch dikembalikan ke flow From-To, memakai prefix otomatis `Batch`, dan bisa dijadikan filter.
- Card Batch bisa diklik sebagai filter rekapan.
- Popup Add/Edit Rekapan berisi pilih batch, pilih anggota, nama barang, qty, harga, jatuh tempo 3/7 hari, last payment DP otomatis, last payment pelunasan opsional, dan catatan.
- Tabel Rekap berisi kolom Batch, Anggota, Nama Barang, QTY, Harga, Jatuh Tempo, Last Payment DP, Last Payment Pelunasan, Catatan, dan Action.
- Kolom Last Payment DP punya label DP untuk input total DP dan upload proof transfer.
- Setelah DP disimpan, label DP menjadi disabled dan tombol Pelunasan aktif untuk input nominal kurang bayar serta upload proof transfer.
- Proof transfer otomatis diberi watermark nama anggota dan nomor WhatsApp sebelum diupload.
- Super admin melakukan approval payment. Status proof bisa `pending`, `approved`, atau `rejected`.
- Jika Down Payment approved, tombol Down Payment hilang dan tombol Pelunasan tetap aktif.
- Jika Pelunasan langsung approved, tombol Down Payment dan Pelunasan tidak perlu input lagi.
- Jika payment rejected, tombol payment aktif kembali agar bukti transfer bisa diupload ulang.
- Last Payment DP otomatis dihitung dari tanggal input + jatuh tempo 3/7 hari.
- Tombol `Lunas` tersedia di kolom Action agar admin/super admin bisa langsung menandai pembayaran lunas tanpa membuka Edit.
- Menu Database tersedia untuk super admin untuk membersihkan data anggota, batch, dan rekapan tanpa membuka Supabase.
- Menu Users tersedia untuk super admin untuk tambah user, edit data user, dan mengatur role `guest`, `admin`, atau `super_admin`.
- Alert konfirmasi dan notifikasi memakai modal SweetAlert-style di dalam aplikasi.
- Action Edit dan Delete hanya tampil untuk admin dan super admin.

## Struktur Database Supabase

Query lengkap ada di [backend/db/schema.sql](/Users/andika/Documents/New project 2/backend/db/schema.sql).

Tabel utama:

- `users`: `id`, `name`, `username`, `password_hash`, `role`, `created_at`, `updated_at`
- `members`: `id`, `name`, `whatsapp_number`, `created_by`, `created_at`, `updated_at`
- `recap_categories`: `id`, `name`, `slug`, `image_path`, `storage_path`, `original_filename`, `created_by`, `created_at`, `updated_at`
- `recap_batches`: `id`, `name`, `country`, `start_date`, `end_date`, `created_by`, `created_at`, `updated_at`
- `member_transactions`: `id`, `member_id`, `batch_id`, `product_type`, `product_name`, `country`, `quantity`, `unit_price`, `payment_status`, `dp_amount`, `dp_date`, `due_days`, `settlement_due_date`, `settled_at`, `notes`, `created_by`, `created_at`, `updated_at`
- Kolom proof pembayaran di `member_transactions`: `dp_proof_path`, `dp_proof_storage_path`, `settlement_amount`, `settlement_proof_path`, `settlement_proof_storage_path`
- Kolom approval pembayaran di `member_transactions`: `dp_payment_status`, `settlement_payment_status`

## Setup Supabase

1. Buka [Supabase](https://supabase.com), buat project baru.
2. Masuk ke `SQL Editor`.
3. Copy seluruh isi [backend/db/schema.sql](/Users/andika/Documents/New project 2/backend/db/schema.sql), lalu jalankan.
4. Buka `Project Settings > API`.
5. Copy `Project URL` ke `SUPABASE_URL`.
6. Copy `service_role secret` ke `SUPABASE_SERVICE_ROLE_KEY`.

Jangan expose `service_role` ke frontend. Key ini hanya dipakai backend.

## Setup Local

1. Install dependency:

   ```bash
   npm run install:all
   ```

2. Copy env backend:

   ```bash
   cp backend/.env.example backend/.env
   ```

3. Isi [backend/.env](/Users/andika/Documents/New project 2/backend/.env):

   ```env
   PORT=4000
   SUPABASE_URL=https://PROJECT_ID.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=isi-service-role-key-dari-supabase
   SUPABASE_RECAP_CATEGORY_BUCKET=recap-categories
   SUPABASE_PAYMENT_PROOF_BUCKET=payment-proofs
   JWT_SECRET=ganti-dengan-random-string-panjang
   FRONTEND_URL=http://localhost:5173
   ```

4. Jalankan aplikasi:

   ```bash
   npm run dev
   ```

5. Buka frontend:

   ```text
   http://localhost:5173
   ```

Backend berjalan di:

```text
http://localhost:4000
```

## Akun Demo

- Guest: `guest` / `guest123`
- Admin: `admin` / `admin123`
- Super Admin: `superadmin` / `super123`

## Catatan Integrasi

- Frontend memakai proxy Vite untuk request `/api` ke backend.
- Backend membuat JWT sendiri setelah mencocokkan username/password dari tabel `users`.
- Jika ingin production, set `FRONTEND_URL` ke domain frontend dan pakai `JWT_SECRET` yang kuat.
