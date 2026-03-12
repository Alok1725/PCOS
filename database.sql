-- Users (handled by Supabase Auth, extend with profiles)
create table if not exists profiles (
  id uuid references auth.users primary key,
  full_name text,
  age integer,
  weight_kg numeric,
  height_cm numeric,
  cycle_regularity text, -- 'regular', 'irregular', 'absent'
  last_period_date date,
  symptoms text[], -- array: ['acne', 'hair_loss', 'weight_gain', 'fatigue', etc.]
  created_at timestamptz default now()
);

-- Reports uploaded by user
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  report_type text, -- 'ultrasound' or 'blood_test'
  file_url text,
  uploaded_at timestamptz default now(),
  ocr_extracted_text text,
  parsed_values jsonb -- { lh: 8.2, fsh: 4.1, amh: 3.5, testosterone: 0.8, insulin: 12 }
);

-- Assessment results
create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  usg_report_id uuid references reports(id),
  blood_report_id uuid references reports(id),
  risk_level text, -- 'none', 'at_risk', 'pcos_positive'
  risk_score numeric, -- 0-100
  ai_summary text,
  created_at timestamptz default now()
);

-- Recommendations
create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references assessments(id),
  category text, -- 'diet', 'exercise', 'lifestyle', 'medical'
  title text,
  description text,
  frequency text -- 'daily', 'weekly', '3x per week', etc.
);
