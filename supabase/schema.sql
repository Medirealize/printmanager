-- プリマネ: Supabase スキーマ
-- Supabase SQL Editor で実行してください

create extension if not exists "pgcrypto";

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'わが家',
  created_at timestamptz not null default now()
);

create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  grade text not null,
  color text not null default 'bg-chart-1',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists printouts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  title text not null,
  category text not null check (category in ('todo', 'event', 'info')),
  submission_item text,
  deadline date,
  event_date date,
  event_time text,
  parent_preparation text,
  summary text,
  pinned boolean not null default false,
  created_at date not null default current_date,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  notes text,
  image_url text,
  updated_at timestamptz not null default now()
);

create index if not exists printouts_household_idx on printouts (household_id);
create index if not exists printouts_child_idx on printouts (child_id);
create index if not exists printouts_deadline_idx on printouts (deadline);
create index if not exists children_household_idx on children (household_id);

-- デモ世帯（環境変数 DEFAULT_HOUSEHOLD_ID と一致させる）
insert into households (id, name)
values ('00000000-0000-0000-0000-000000000001', 'わが家')
on conflict (id) do nothing;

insert into children (id, household_id, name, grade, color, sort_order) values
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'はるか', '小学3年生', 'bg-chart-1', 1),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'そうた', '小学5年生', 'bg-chart-2', 2),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'ゆい', '小学1年生', 'bg-chart-3', 3)
on conflict (id) do nothing;

-- サンプルプリント（任意）
insert into printouts (
  id, household_id, child_id, title, category,
  submission_item, deadline, created_at, status, notes
) values (
  '00000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000011',
  '遠足参加同意書', 'todo',
  '参加同意書 + 1,500円',
  (current_date + interval '2 days')::date,
  current_date,
  'pending',
  'おつりのないように準備'
) on conflict (id) do nothing;
