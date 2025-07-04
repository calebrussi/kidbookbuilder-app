-- Supabase Database Schema for User Progress Management
-- Phase 2: User-Scoped Data Management
-- Created: July 1, 2025

-- Enable Row Level Security on all tables
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- =============================================
-- USER PROFILES TABLE (Already exists from Phase 1)
-- =============================================
-- This table should already exist from Phase 1 implementation
-- Keeping it here for reference and completeness

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- WORKFLOWS TABLE
-- =============================================
-- Store workflow definitions (can be shared across users)
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- JSON column to store the complete workflow structure
  workflow_data JSONB NOT NULL,
  
  -- Metadata for workflow management
  tags TEXT[] DEFAULT '{}',
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_minutes INTEGER,
  
  CONSTRAINT workflows_title_version_unique UNIQUE (title, version)
);

-- Enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflows (publicly readable, admin managed)
CREATE POLICY "Anyone can view active workflows" ON workflows
  FOR SELECT USING (is_active = true);

-- =============================================
-- USER PROGRESS TABLE
-- =============================================
-- Track overall user progress through workflows
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- Unique identifier for this workflow session
  
  -- Current state
  current_step_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned')) DEFAULT 'not_started',
  
  -- Progress tracking
  total_steps INTEGER NOT NULL DEFAULT 0,
  completed_steps INTEGER NOT NULL DEFAULT 0,
  percent_complete DECIMAL(5,2) DEFAULT 0.00 CHECK (percent_complete >= 0 AND percent_complete <= 100),
  
  -- Session metadata
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one active session per user per workflow
  CONSTRAINT user_progress_user_workflow_session UNIQUE (user_id, workflow_id, session_id)
);

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_progress
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" ON user_progress
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP PROGRESS TABLE
-- =============================================
-- Track progress through individual steps within workflows
CREATE TABLE step_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_progress_id UUID NOT NULL REFERENCES user_progress(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  
  -- Step identification
  step_id TEXT NOT NULL,
  section_id TEXT,
  agent_id TEXT,
  
  -- Step state
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'started', 'complete', 'error')) DEFAULT 'not_started',
  attempt_count INTEGER DEFAULT 0,
  
  -- Conversation tracking
  conversation_id TEXT,
  conversation_status TEXT,
  success BOOLEAN,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_modified TIMESTAMPTZ DEFAULT NOW(),
  
  -- User inputs (flexible JSON storage)
  user_inputs JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per user per step per session
  CONSTRAINT step_progress_unique UNIQUE (user_progress_id, step_id)
);

-- Enable RLS
ALTER TABLE step_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for step_progress
CREATE POLICY "Users can view own step progress" ON step_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own step progress" ON step_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own step progress" ON step_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own step progress" ON step_progress
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- CAPTURED DATA TABLE
-- =============================================
-- Store data captured during workflow execution
CREATE TABLE captured_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_progress_id UUID NOT NULL REFERENCES step_progress(id) ON DELETE CASCADE,
  user_progress_id UUID NOT NULL REFERENCES user_progress(id) ON DELETE CASCADE,
  
  -- Data identification
  label TEXT NOT NULL,
  data_collection_id TEXT, -- Links to workflow data collection definitions
  
  -- Data content
  value TEXT NOT NULL,
  json_value JSONB, -- For structured data
  data_type TEXT CHECK (data_type IN ('text', 'number', 'boolean', 'json', 'array')) DEFAULT 'text',
  
  -- Metadata
  rationale TEXT, -- AI reasoning for the captured data
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source TEXT CHECK (source IN ('user_input', 'ai_analysis', 'conversation', 'system')) DEFAULT 'conversation',
  
  -- JSON Schema validation (optional)
  json_schema JSONB,
  
  -- Timestamps
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE captured_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for captured_data
CREATE POLICY "Users can view own captured data" ON captured_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own captured data" ON captured_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own captured data" ON captured_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own captured data" ON captured_data
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- CONVERSATION MESSAGES TABLE
-- =============================================
-- Store conversation messages between users and AI agents
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_progress_id UUID NOT NULL REFERENCES step_progress(id) ON DELETE CASCADE,
  
  -- Message identification
  conversation_id TEXT NOT NULL,
  message_sequence INTEGER NOT NULL, -- Order within conversation
  
  -- Message content
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'ai', 'system')) DEFAULT 'user',
  
  -- Message metadata
  agent_id TEXT, -- Which AI agent generated this message
  message_type TEXT CHECK (message_type IN ('text', 'audio', 'action', 'system')) DEFAULT 'text',
  
  -- Audio-specific fields
  audio_duration_seconds DECIMAL(8,2),
  audio_transcript TEXT,
  audio_url TEXT,
  
  -- Analysis results
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  intent TEXT,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- Timestamps
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure message ordering
  CONSTRAINT conversation_messages_sequence UNIQUE (conversation_id, message_sequence)
);

-- Enable RLS
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_messages
CREATE POLICY "Users can view own messages" ON conversation_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON conversation_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" ON conversation_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- CONVERSATION ANALYSIS TABLE
-- =============================================
-- Store AI analysis results from conversations
CREATE TABLE conversation_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_progress_id UUID NOT NULL REFERENCES step_progress(id) ON DELETE CASCADE,
  
  -- Analysis identification
  conversation_id TEXT NOT NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('evaluation', 'data_collection', 'sentiment', 'completion')) DEFAULT 'evaluation',
  
  -- Analysis results
  call_successful TEXT,
  transcript_summary TEXT,
  
  -- Evaluation criteria results (JSONB for flexibility)
  evaluation_criteria_results JSONB DEFAULT '{}',
  data_collection_results JSONB DEFAULT '{}',
  
  -- Overall analysis metadata
  analysis_confidence DECIMAL(3,2) CHECK (analysis_confidence >= 0 AND analysis_confidence <= 1),
  processing_duration_ms INTEGER,
  model_version TEXT,
  
  -- Timestamps
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one analysis per conversation per type
  CONSTRAINT conversation_analysis_unique UNIQUE (conversation_id, analysis_type)
);

-- Enable RLS
ALTER TABLE conversation_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_analysis
CREATE POLICY "Users can view own analysis" ON conversation_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis" ON conversation_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis" ON conversation_analysis
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User progress indexes
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_workflow_id ON user_progress(workflow_id);
CREATE INDEX idx_user_progress_session_id ON user_progress(session_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);
CREATE INDEX idx_user_progress_last_activity ON user_progress(last_activity_at DESC);

-- Step progress indexes
CREATE INDEX idx_step_progress_user_id ON step_progress(user_id);
CREATE INDEX idx_step_progress_user_progress_id ON step_progress(user_progress_id);
CREATE INDEX idx_step_progress_step_id ON step_progress(step_id);
CREATE INDEX idx_step_progress_status ON step_progress(status);
CREATE INDEX idx_step_progress_conversation_id ON step_progress(conversation_id);

-- Captured data indexes
CREATE INDEX idx_captured_data_user_id ON captured_data(user_id);
CREATE INDEX idx_captured_data_step_progress_id ON captured_data(step_progress_id);
CREATE INDEX idx_captured_data_label ON captured_data(label);
CREATE INDEX idx_captured_data_timestamp ON captured_data(timestamp DESC);

-- Conversation messages indexes
CREATE INDEX idx_conversation_messages_user_id ON conversation_messages(user_id);
CREATE INDEX idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_sequence ON conversation_messages(conversation_id, message_sequence);
CREATE INDEX idx_conversation_messages_timestamp ON conversation_messages(timestamp DESC);

-- Conversation analysis indexes
CREATE INDEX idx_conversation_analysis_user_id ON conversation_analysis(user_id);
CREATE INDEX idx_conversation_analysis_conversation_id ON conversation_analysis(conversation_id);
CREATE INDEX idx_conversation_analysis_type ON conversation_analysis(analysis_type);

-- Workflow indexes
CREATE INDEX idx_workflows_active ON workflows(is_active);
CREATE INDEX idx_workflows_created_by ON workflows(created_by);
CREATE INDEX idx_workflows_tags ON workflows USING GIN(tags);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_step_progress_updated_at BEFORE UPDATE ON step_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_captured_data_updated_at BEFORE UPDATE ON captured_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversation_messages_updated_at BEFORE UPDATE ON conversation_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversation_analysis_updated_at BEFORE UPDATE ON conversation_analysis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update user_progress stats when step_progress changes
CREATE OR REPLACE FUNCTION update_user_progress_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent user_progress record with current stats
  UPDATE user_progress 
  SET 
    completed_steps = (
      SELECT COUNT(*) 
      FROM step_progress 
      WHERE user_progress_id = COALESCE(NEW.user_progress_id, OLD.user_progress_id) 
      AND status = 'complete'
    ),
    percent_complete = CASE 
      WHEN total_steps > 0 THEN 
        ROUND((SELECT COUNT(*) 
               FROM step_progress 
               WHERE user_progress_id = COALESCE(NEW.user_progress_id, OLD.user_progress_id) 
               AND status = 'complete'
              ) * 100.0 / total_steps, 2)
      ELSE 0
    END,
    last_activity_at = NOW()
  WHERE id = COALESCE(NEW.user_progress_id, OLD.user_progress_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger to update user progress stats
CREATE TRIGGER update_user_progress_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON step_progress
  FOR EACH ROW EXECUTE FUNCTION update_user_progress_stats();

-- Function to auto-update last_activity on user_progress when related data changes
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_progress 
  SET last_activity_at = NOW()
  WHERE id = NEW.user_progress_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for activity tracking
CREATE TRIGGER update_last_activity_captured_data
  AFTER INSERT OR UPDATE ON captured_data
  FOR EACH ROW EXECUTE FUNCTION update_last_activity();

CREATE TRIGGER update_last_activity_messages
  AFTER INSERT OR UPDATE ON conversation_messages
  FOR EACH ROW EXECUTE FUNCTION update_last_activity();

-- =============================================
-- INITIAL DATA AND VIEWS
-- =============================================

-- Create a view for easy user progress querying
CREATE VIEW user_progress_summary AS
SELECT 
  up.id,
  up.user_id,
  up.workflow_id,
  up.session_id,
  w.title as workflow_title,
  w.description as workflow_description,
  up.current_step_id,
  up.status,
  up.total_steps,
  up.completed_steps,
  up.percent_complete,
  up.started_at,
  up.last_activity_at,
  up.completed_at,
  up.time_spent_minutes,
  prof.full_name as user_name
FROM user_progress up
JOIN workflows w ON up.workflow_id = w.id
LEFT JOIN user_profiles prof ON up.user_id = prof.id;

-- Create a view for detailed step progress with analysis
CREATE VIEW step_progress_detailed AS
SELECT 
  sp.id,
  sp.user_id,
  sp.user_progress_id,
  sp.workflow_id,
  sp.step_id,
  sp.section_id,
  sp.agent_id,
  sp.status,
  sp.attempt_count,
  sp.conversation_id,
  sp.conversation_status,
  sp.success,
  sp.started_at,
  sp.completed_at,
  sp.last_modified,
  sp.user_inputs,
  -- Aggregate captured data
  COALESCE(cd.captured_count, 0) as captured_data_count,
  -- Aggregate messages
  COALESCE(cm.message_count, 0) as message_count,
  -- Latest analysis
  ca.transcript_summary,
  ca.call_successful
FROM step_progress sp
LEFT JOIN (
  SELECT step_progress_id, COUNT(*) as captured_count
  FROM captured_data
  GROUP BY step_progress_id
) cd ON sp.id = cd.step_progress_id
LEFT JOIN (
  SELECT step_progress_id, COUNT(*) as message_count
  FROM conversation_messages
  GROUP BY step_progress_id
) cm ON sp.id = cm.step_progress_id
LEFT JOIN conversation_analysis ca ON sp.conversation_id = ca.conversation_id 
  AND ca.analysis_type = 'evaluation';

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Sample workflow (uncomment to add test data)
/*
INSERT INTO workflows (id, title, description, workflow_data, difficulty_level, estimated_duration_minutes) VALUES 
(
  gen_random_uuid(),
  'Character Creation Quiz',
  'Interactive quiz to help kids create their story characters',
  '{
    "id": "character-creation-quiz",
    "title": "Character Creation Quiz",
    "description": "Interactive quiz to help kids create their story characters",
    "sections": [
      {
        "id": "character-basics",
        "title": "Character Basics",
        "order": 1,
        "steps": [
          {
            "id": "character-name",
            "title": "Choose Character Name",
            "order": 1,
            "sectionId": "character-basics",
            "agentId": "character-guide"
          }
        ]
      }
    ]
  }',
  'beginner',
  15
);
*/

-- =============================================
-- DOCUMENTATION
-- =============================================

COMMENT ON TABLE user_profiles IS 'User profile information linked to Supabase auth users';
COMMENT ON TABLE workflows IS 'Workflow definitions that can be shared across users';
COMMENT ON TABLE user_progress IS 'Overall progress tracking for users through workflows';
COMMENT ON TABLE step_progress IS 'Detailed progress tracking for individual workflow steps';
COMMENT ON TABLE captured_data IS 'Data captured during workflow execution (character traits, story elements, etc.)';
COMMENT ON TABLE conversation_messages IS 'Individual messages in conversations between users and AI agents';
COMMENT ON TABLE conversation_analysis IS 'AI analysis results from conversations including evaluations and data extraction';

COMMENT ON COLUMN user_progress.session_id IS 'Unique identifier for this workflow session - allows multiple attempts';
COMMENT ON COLUMN step_progress.conversation_id IS 'Links to external conversation system (ElevenLabs, etc.)';
COMMENT ON COLUMN captured_data.json_value IS 'Structured data version of value field for complex data types';
COMMENT ON COLUMN conversation_messages.message_sequence IS 'Order of messages within a conversation for proper threading';
COMMENT ON COLUMN conversation_analysis.evaluation_criteria_results IS 'JSON object containing evaluation results keyed by criteria_id';
COMMENT ON COLUMN conversation_analysis.data_collection_results IS 'JSON object containing data collection results keyed by data_collection_id';
