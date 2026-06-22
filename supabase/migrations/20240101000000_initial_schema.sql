-- Enable UUID extension

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255) UNIQUE NOT NULL,
  home_team VARCHAR(255) NOT NULL,
  away_team VARCHAR(255) NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  status VARCHAR(50) NOT NULL, -- 'live', 'upcoming', 'finished'
  match_date TIMESTAMPTZ NOT NULL,
  league VARCHAR(255) NOT NULL,
  season VARCHAR(50),
  venue VARCHAR(255),
  match_data JSONB, -- Store full match data from API
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  team VARCHAR(255) NOT NULL,
  position VARCHAR(100),
  nationality VARCHAR(100),
  photo_url TEXT,
  player_data JSONB, -- Store full player data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match awards table (MVP, Best Defender, Most Assists)
CREATE TABLE match_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  award_type VARCHAR(50) NOT NULL, -- 'mvp', 'best_defender', 'most_assists'
  analysis TEXT NOT NULL, -- AI-generated analysis
  statistics JSONB, -- Player statistics for this match
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, award_type) -- Each match can only have one award of each type
);

-- Tokens table
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id UUID NOT NULL REFERENCES match_awards(id) ON DELETE CASCADE,
  token_name VARCHAR(255) NOT NULL,
  token_symbol VARCHAR(50) NOT NULL,
  contract_address VARCHAR(255) UNIQUE NOT NULL,
  launch_platform VARCHAR(50) NOT NULL, -- 'clanker', 'flaunch'
  description TEXT NOT NULL,
  token_metadata JSONB, -- Additional token metadata
  transaction_hash VARCHAR(255),
  launched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis reports table (full match analysis)
CREATE TABLE analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  full_analysis JSONB NOT NULL, -- Complete AI analysis
  model_version VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id) -- One analysis per match
);

-- Create indexes for better query performance
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_external_id ON matches(external_id);
CREATE INDEX idx_match_awards_match_id ON match_awards(match_id);
CREATE INDEX idx_match_awards_player_id ON match_awards(player_id);
CREATE INDEX idx_match_awards_award_type ON match_awards(award_type);
CREATE INDEX idx_tokens_award_id ON tokens(award_id);
CREATE INDEX idx_tokens_launch_platform ON tokens(launch_platform);
CREATE INDEX idx_analysis_reports_match_id ON analysis_reports(match_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access for matches" ON matches
  FOR SELECT USING (true);

CREATE POLICY "Public read access for players" ON players
  FOR SELECT USING (true);

CREATE POLICY "Public read access for match_awards" ON match_awards
  FOR SELECT USING (true);

CREATE POLICY "Public read access for tokens" ON tokens
  FOR SELECT USING (true);

CREATE POLICY "Public read access for analysis_reports" ON analysis_reports
  FOR SELECT USING (true);

-- Note: Write policies should be configured based on your authentication setup
-- For now, service role key will be used for writes from the backend
