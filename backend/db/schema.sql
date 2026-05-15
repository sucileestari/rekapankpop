-- Jalankan file ini di Supabase SQL Editor.
-- Password demo disimpan sebagai SHA-256 agar cocok dengan backend Node.js.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  username varchar(60) not null unique,
  password_hash varchar(255) not null,
  role varchar(20) not null default 'guest',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_role_check check (role in ('guest', 'admin', 'super_admin'))
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  whatsapp_number varchar(30) not null,
  created_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_members_name on public.members using gin (name gin_trgm_ops);
create index if not exists idx_members_whatsapp_number on public.members using gin (whatsapp_number gin_trgm_ops);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'members_whatsapp_number_unique'
  ) then
    alter table public.members
      add constraint members_whatsapp_number_unique unique (whatsapp_number);
  end if;
end $$;

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  permission_key varchar(100) not null unique,
  label varchar(140) not null,
  description text not null,
  guest_enabled boolean not null default false,
  admin_enabled boolean not null default false,
  created_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint role_permissions_key_check check (permission_key ~ '^[a-z0-9_]+$')
);

create index if not exists idx_role_permissions_key on public.role_permissions(permission_key);

create table if not exists public.co_proofs (
  id uuid primary key default gen_random_uuid(),
  batch varchar(80) not null,
  country varchar(20) not null,
  image_path text not null,
  storage_path text not null,
  original_filename varchar(255) not null,
  uploaded_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint co_proofs_country_check check (country in ('korea', 'jepang', 'china', 'thailand'))
);

create index if not exists idx_co_proofs_country on public.co_proofs(country);
create index if not exists idx_co_proofs_batch on public.co_proofs(batch);

create table if not exists public.recap_categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  slug varchar(100) not null unique,
  image_path text null,
  storage_path text null,
  original_filename varchar(255) null,
  created_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_recap_categories_slug on public.recap_categories(slug);

create table if not exists public.recap_batches (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  country varchar(20) not null,
  start_date date null,
  end_date date null,
  created_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recap_batches add column if not exists start_date date null;
alter table public.recap_batches add column if not exists end_date date null;
alter table public.recap_batches drop constraint if exists recap_batches_country_check;
alter table public.recap_batches add constraint recap_batches_country_check check (country ~ '^[a-z0-9-]+$');
alter table public.recap_batches drop constraint if exists recap_batches_date_range_check;
alter table public.recap_batches add constraint recap_batches_date_range_check check (start_date is null or end_date is null or start_date <= end_date);
create index if not exists idx_recap_batches_country on public.recap_batches(country);

create table if not exists public.member_transactions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  batch_id uuid null references public.recap_batches(id) on delete set null,
  product_type varchar(40) not null default 'photocard',
  product_name varchar(140) not null,
  country varchar(20) not null,
  quantity integer not null default 1,
  unit_price numeric(14, 2) not null default 0,
  payment_status varchar(20) not null default 'dp',
  dp_amount numeric(14, 2) null,
  dp_date date null,
  dp_proof_path text null,
  dp_proof_storage_path text null,
  dp_payment_status varchar(20) null,
  settlement_amount numeric(14, 2) null,
  settlement_proof_path text null,
  settlement_proof_storage_path text null,
  settlement_payment_status varchar(20) null,
  due_days integer null,
  settlement_due_date date null,
  settled_at timestamptz null,
  notes text null,
  created_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_transactions_quantity_check check (quantity > 0),
  constraint member_transactions_unit_price_check check (unit_price >= 0)
);

alter table public.member_transactions add column if not exists batch_id uuid null references public.recap_batches(id) on delete set null;
alter table public.member_transactions add column if not exists payment_status varchar(20) not null default 'dp';
alter table public.member_transactions add column if not exists dp_amount numeric(14, 2) null;
alter table public.member_transactions add column if not exists dp_date date null;
alter table public.member_transactions add column if not exists dp_proof_path text null;
alter table public.member_transactions add column if not exists dp_proof_storage_path text null;
alter table public.member_transactions add column if not exists dp_payment_status varchar(20) null;
alter table public.member_transactions add column if not exists settlement_amount numeric(14, 2) null;
alter table public.member_transactions add column if not exists settlement_proof_path text null;
alter table public.member_transactions add column if not exists settlement_proof_storage_path text null;
alter table public.member_transactions add column if not exists settlement_payment_status varchar(20) null;
alter table public.member_transactions add column if not exists due_days integer null;
alter table public.member_transactions add column if not exists settlement_due_date date null;
alter table public.member_transactions add column if not exists settled_at timestamptz null;
alter table public.member_transactions alter column country drop default;
alter table public.member_transactions alter column product_type set default 'photocard';
update public.member_transactions set product_type = 'photocard' where product_type <> 'photocard';
update public.member_transactions set payment_status = 'dp' where payment_status is null;
alter table public.member_transactions drop constraint if exists member_transactions_product_type_check;
alter table public.member_transactions add constraint member_transactions_product_type_check check (product_type in ('photocard'));
alter table public.member_transactions drop constraint if exists member_transactions_country_check;
alter table public.member_transactions add constraint member_transactions_country_check check (country ~ '^[a-z0-9-]+$');
alter table public.member_transactions drop constraint if exists member_transactions_payment_status_check;
alter table public.member_transactions add constraint member_transactions_payment_status_check check (payment_status in ('dp', 'pelunasan'));
alter table public.member_transactions drop constraint if exists member_transactions_due_days_check;
alter table public.member_transactions add constraint member_transactions_due_days_check check (due_days is null or due_days > 0);
alter table public.member_transactions drop constraint if exists member_transactions_dp_amount_check;
alter table public.member_transactions add constraint member_transactions_dp_amount_check check (dp_amount is null or dp_amount >= 0);
alter table public.member_transactions drop constraint if exists member_transactions_settlement_amount_check;
alter table public.member_transactions add constraint member_transactions_settlement_amount_check check (settlement_amount is null or settlement_amount >= 0);
alter table public.member_transactions drop constraint if exists member_transactions_dp_payment_status_check;
alter table public.member_transactions add constraint member_transactions_dp_payment_status_check check (dp_payment_status is null or dp_payment_status in ('pending', 'approved', 'rejected'));
alter table public.member_transactions drop constraint if exists member_transactions_settlement_payment_status_check;
alter table public.member_transactions add constraint member_transactions_settlement_payment_status_check check (settlement_payment_status is null or settlement_payment_status in ('pending', 'approved', 'rejected'));

create index if not exists idx_member_transactions_member_id on public.member_transactions(member_id);
create index if not exists idx_member_transactions_country on public.member_transactions(country);
create index if not exists idx_member_transactions_batch_id on public.member_transactions(batch_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_members_updated_at on public.members;
create trigger set_members_updated_at
before update on public.members
for each row execute function public.set_updated_at();

drop trigger if exists set_role_permissions_updated_at on public.role_permissions;
create trigger set_role_permissions_updated_at
before update on public.role_permissions
for each row execute function public.set_updated_at();

drop trigger if exists set_co_proofs_updated_at on public.co_proofs;
create trigger set_co_proofs_updated_at
before update on public.co_proofs
for each row execute function public.set_updated_at();

drop trigger if exists set_member_transactions_updated_at on public.member_transactions;
create trigger set_member_transactions_updated_at
before update on public.member_transactions
for each row execute function public.set_updated_at();

drop trigger if exists set_recap_batches_updated_at on public.recap_batches;
create trigger set_recap_batches_updated_at
before update on public.recap_batches
for each row execute function public.set_updated_at();

drop trigger if exists set_recap_categories_updated_at on public.recap_categories;
create trigger set_recap_categories_updated_at
before update on public.recap_categories
for each row execute function public.set_updated_at();

insert into public.users (name, username, password_hash, role)
values
  ('Guest User', 'guest', '6b93ccba414ac1d0ae1e77f3fac560c748a6701ed6946735a49d463351518e16', 'guest'),
  ('Admin User', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin'),
  ('Super Admin', 'superadmin', '4e4c56e4a15f89f05c2f4c72613da2a18c9665d4f0d6acce16415eb06f9be776', 'super_admin')
on conflict (username) do update set
  name = excluded.name,
  password_hash = excluded.password_hash,
  role = excluded.role;

insert into public.role_permissions (permission_key, label, description, guest_enabled, admin_enabled)
values
  ('view_dashboard', 'Akses dashboard', 'Melihat category, batch, dan rekapan transaksi.', true, true),
  ('payment_upload', 'Upload bukti pembayaran', 'Input nominal dan upload bukti transfer Down Payment atau Pelunasan.', true, true),
  ('manage_master_data', 'Kelola data operasional', 'Tambah, edit, dan hapus anggota, category, batch, dan rekapan.', false, true),
  ('review_payment', 'Approve / reject payment', 'Review bukti transfer dan menentukan status pembayaran.', false, false),
  ('manage_users_roles', 'Kelola users & roles', 'Tambah user, ubah role, dan mengatur permission.', false, false),
  ('clean_database', 'Bersihkan database', 'Menghapus data operasional dari aplikasi.', false, false)
on conflict (permission_key) do update set
  label = excluded.label,
  description = excluded.description,
  guest_enabled = excluded.guest_enabled,
  admin_enabled = excluded.admin_enabled;

insert into public.recap_categories (name, slug)
values
  ('Korea', 'korea'),
  ('Jepang', 'jepang'),
  ('Thailand', 'thailand'),
  ('China', 'china')
on conflict (slug) do update set
  name = excluded.name;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('co-proofs', 'co-proofs', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recap-categories', 'recap-categories', true, 5242880, array['image/jpeg', 'image/png', 'image/svg+xml'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Query referensi:
-- select id, name, whatsapp_number, created_at from public.members order by created_at desc;
-- select id, name, whatsapp_number, created_at from public.members
-- where name ilike '%keyword%' or whatsapp_number ilike '%keyword%'
-- order by created_at desc;
-- insert into public.members (name, whatsapp_number, created_by) values ('Nama', '08xxxxxxxxxx', 'USER_UUID');
-- select id, batch, country, image_path, original_filename, created_at from public.co_proofs order by created_at desc;
-- select id, batch, country, image_path, original_filename, created_at from public.co_proofs where country = 'korea';
-- insert into public.co_proofs (batch, country, image_path, storage_path, original_filename, uploaded_by)
-- values ('Batch 1', 'korea', 'PUBLIC_URL', 'korea/file.jpg', 'file.jpg', 'USER_UUID');
-- insert into public.recap_batches (name, country, start_date, end_date, created_by)
-- values ('Batch 1', 'korea', '2026-05-01', '2026-05-14', 'USER_UUID');
-- select mt.id, m.name as anggota, mt.product_name, mt.quantity, mt.unit_price, mt.payment_status
-- from public.member_transactions mt
-- join public.members m on m.id = mt.member_id
-- where mt.country = 'korea'
-- order by mt.created_at desc;
-- insert into public.member_transactions (member_id, batch_id, product_name, country, quantity, unit_price, payment_status, dp_amount, dp_date, due_days, settlement_due_date, created_by)
-- values ('MEMBER_UUID', 'BATCH_UUID', 'Photocard Korea', 'korea', 1, 25000, 'dp', 10000, '2026-05-14', 7, '2026-05-21', 'USER_UUID');
