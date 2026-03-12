-- ═══════════════════════════════════════════════════════════════
-- CycleSync v2 — New tables for enhanced features
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Cycle/Period tracking
create table if not exists cycle_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  start_date date not null,
  end_date date,
  flow_intensity text default 'medium', -- 'light', 'medium', 'heavy'
  notes text,
  created_at timestamptz default now()
);

-- Daily symptom logging
create table if not exists symptom_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  log_date date not null default current_date,
  symptoms text[] not null, -- ['acne','bloating','fatigue','mood_swings','hair_loss','cramps','headache','insomnia']
  severity integer default 5, -- 1-10
  notes text,
  created_at timestamptz default now()
);

-- Water intake tracking
create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  log_date date not null default current_date,
  glasses integer not null default 0, -- 0-12
  created_at timestamptz default now(),
  unique(user_id, log_date)
);

-- Mood journal
create table if not exists mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  log_date date not null default current_date,
  mood text not null, -- 'happy','neutral','sad','angry','tired'
  notes text,
  created_at timestamptz default now()
);

-- Community posts (anonymous)
create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  display_name text default 'Anonymous Warrior',
  content text not null,
  tags text[], -- ['diet','exercise','mental_health','success_story','tips','question']
  likes integer default 0,
  created_at timestamptz default now()
);

-- Doctor reviews
create table if not exists doctor_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  doctor_name text not null,
  specialty text,
  location text,
  rating integer not null check (rating >= 1 and rating <= 5),
  review_text text,
  visit_date date,
  created_at timestamptz default now()
);

-- Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info', -- 'info','reminder','alert','tip'
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS on all new tables
alter table cycle_logs enable row level security;
alter table symptom_logs enable row level security;
alter table water_logs enable row level security;
alter table mood_logs enable row level security;
alter table community_posts enable row level security;
alter table doctor_reviews enable row level security;
alter table notifications enable row level security;

-- RLS policies — users can only access their own data
create policy "Users can manage own cycle_logs" on cycle_logs for all using (auth.uid() = user_id);
create policy "Users can manage own symptom_logs" on symptom_logs for all using (auth.uid() = user_id);
create policy "Users can manage own water_logs" on water_logs for all using (auth.uid() = user_id);
create policy "Users can manage own mood_logs" on mood_logs for all using (auth.uid() = user_id);
create policy "Users can manage own notifications" on notifications for all using (auth.uid() = user_id);

-- Community posts and reviews are readable by all authenticated users
create policy "Authenticated users can read community_posts" on community_posts for select using (auth.role() = 'authenticated');
create policy "Users can insert own community_posts" on community_posts for insert with check (auth.uid() = user_id);
create policy "Users can delete own community_posts" on community_posts for delete using (auth.uid() = user_id);

create policy "Authenticated users can read doctor_reviews" on doctor_reviews for select using (auth.role() = 'authenticated');
create policy "Users can insert own doctor_reviews" on doctor_reviews for insert with check (auth.uid() = user_id);
