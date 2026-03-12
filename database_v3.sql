-- Phase 2 Database Migration
-- Run this in Supabase SQL Editor

-- Chat history for AI memory
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  page text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_chat_history_user ON chat_history(user_id, created_at DESC);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own chat" ON chat_history FOR ALL USING (auth.uid() = user_id);

-- User settings for reminders/preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  remind_symptoms boolean DEFAULT true,
  remind_water boolean DEFAULT true,
  remind_mood boolean DEFAULT true,
  reminder_time text DEFAULT '09:00',
  email_digest boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
