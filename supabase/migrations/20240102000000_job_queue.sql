-- Job Queue System for AeonSports

-- Job status enum
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'retrying');

-- Job type enum
CREATE TYPE job_type AS ENUM ('match_analysis', 'token_launch', 'match_workflow');

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type job_type NOT NULL,
  status job_status DEFAULT 'pending',
  priority INTEGER DEFAULT 0, -- Higher priority = processed first
  payload JSONB NOT NULL,
  result JSONB,
  error TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow executions table
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  current_step VARCHAR(100),
  steps_completed JSONB DEFAULT '[]'::jsonb,
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table for frontend notifications
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'match', 'token', 'workflow'
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_scheduled ON jobs(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_jobs_priority ON jobs(priority DESC) WHERE status = 'pending';

CREATE INDEX idx_workflow_executions_match_id ON workflow_executions(match_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);

CREATE INDEX idx_events_published ON events(published);
CREATE INDEX idx_events_created ON events(created_at);
CREATE INDEX idx_events_entity ON events(entity_type, entity_id);

-- Updated timestamp triggers
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_executions_updated_at BEFORE UPDATE ON workflow_executions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Public read access for events (for frontend)
CREATE POLICY "Public read access for events" ON events
  FOR SELECT USING (true);

-- Public read access for workflow executions
CREATE POLICY "Public read access for workflow_executions" ON workflow_executions
  FOR SELECT USING (true);

-- Service role has full access (handled by service role key)
