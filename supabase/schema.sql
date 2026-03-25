-- People synced from Linear teams
create table people (
  id uuid primary key default gen_random_uuid(),
  linear_id text unique not null,
  name text not null,
  email text,
  display_name text,
  avatar_url text,
  org_slug text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Weekly voting periods (auto-created by sync cron)
create table voting_periods (
  id uuid primary key default gen_random_uuid(),
  week_label text not null,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  status text not null default 'open',
  created_at timestamptz default now()
);

-- Demo/learning submissions scraped from Linear
create table submissions (
  id uuid primary key default gen_random_uuid(),
  loom_url text not null,
  title text not null,
  submitter_name text not null,
  submitter_linear_id text references people(linear_id),
  org_slug text not null,
  source_type text not null,
  source_id text not null,
  source_project_name text,
  voting_period_id uuid references voting_periods(id),
  posted_at timestamptz not null,
  created_at timestamptz default now(),
  unique(loom_url, source_id)
);

-- Individual votes
create table votes (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  user_name text not null,
  submission_id uuid references submissions(id) not null,
  category text not null,
  voting_period_id uuid references voting_periods(id) not null,
  created_at timestamptz default now(),
  unique(user_email, category, voting_period_id)
);

-- Winner records
create table awards (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) not null,
  voting_period_id uuid references voting_periods(id) not null,
  category text not null,
  vote_count integer not null,
  winner_name text not null,
  goat_name text,
  created_at timestamptz default now(),
  unique(voting_period_id, category)
);

-- Mountain progress ledger
create table progress (
  id uuid primary key default gen_random_uuid(),
  week_label text not null,
  estimated_hours integer not null,
  cumulative_hours integer not null,
  note text,
  updated_by text not null,
  created_at timestamptz default now()
);

-- Configurable key-value store
create table config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Default config
insert into config (key, value) values
  ('camp_tiers', '[{"name":"Base Camper","emoji":"🏕️","threshold":1},{"name":"Ridge Runner","emoji":"🏔️","threshold":3},{"name":"Summit Seeker","emoji":"⛰️","threshold":5},{"name":"Peak Performer","emoji":"🗻","threshold":8},{"name":"GOAT of GOATs","emoji":"🐐👑","threshold":12}]'),
  ('voting_window', '{"open_day":"monday","close_day":"friday","close_time":"09:00","timezone":"America/New_York"}'),
  ('hours_target', '501000'),
  ('hours_label', '"Estimated cumulative hours — updated weekly"'),
  ('admin_emails', '["drew.kull@klaviyo.com"]'),
  ('last_demo_sync', '"2026-01-01T00:00:00Z"');

-- Per-team hours saved (manual entry from admin)
create table hours_saved (
  id uuid primary key default gen_random_uuid(),
  org_slug text not null,
  week_label text not null,
  hours integer not null,
  note text,
  updated_by text not null,
  created_at timestamptz default now(),
  unique(org_slug, week_label)
);

-- Enable RLS
alter table people enable row level security;
alter table voting_periods enable row level security;
alter table submissions enable row level security;
alter table votes enable row level security;
alter table awards enable row level security;
alter table progress enable row level security;
alter table config enable row level security;
alter table hours_saved enable row level security;

-- RLS policies: public read access for all
create policy "Public read" on people for select using (true);
create policy "Public read" on voting_periods for select using (true);
create policy "Public read" on submissions for select using (true);
create policy "Public read" on votes for select using (true);
create policy "Public read" on awards for select using (true);
create policy "Public read" on progress for select using (true);
create policy "Public read" on config for select using (true);
create policy "Public read" on hours_saved for select using (true);
