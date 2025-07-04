-- Phase 2: User Progress Database Tables
-- Run these commands in your Supabase SQL Editor

-- 1. Create user_progress table
CREATE TABLE user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workflow_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    current_step_id TEXT NOT NULL,
    total_steps INTEGER DEFAULT 0,
    completed_steps INTEGER DEFAULT 0,
    percent_complete DECIMAL(5,2) DEFAULT 0.00,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    time_spent_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one progress record per user per workflow
    UNIQUE(user_id, workflow_id)
);

-- 2. Create step_progress table
CREATE TABLE step_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workflow_id TEXT NOT NULL,
    step_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'complete', 'skipped')),
    conversation_id TEXT,
    last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attempt_count INTEGER DEFAULT 0,
    messages JSONB DEFAULT '[]'::jsonb,
    success BOOLEAN DEFAULT false,
    conversation_status TEXT DEFAULT 'not_started',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one progress record per user per workflow per step
    UNIQUE(user_id, workflow_id, step_id)
);

-- 3. Create indexes for better performance
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_workflow_id ON user_progress(workflow_id);
CREATE INDEX idx_step_progress_user_id ON step_progress(user_id);
CREATE INDEX idx_step_progress_workflow_id ON step_progress(workflow_id);
CREATE INDEX idx_step_progress_step_id ON step_progress(step_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_progress ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for user_progress
CREATE POLICY "Users can view their own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON user_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress" ON user_progress
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Create RLS policies for step_progress
CREATE POLICY "Users can view their own step progress" ON step_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own step progress" ON step_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own step progress" ON step_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own step progress" ON step_progress
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Enable real-time subscriptions for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE step_progress;
