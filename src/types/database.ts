export type MatchStatus = 'live' | 'upcoming' | 'finished';
export type AwardType = 'mvp' | 'best_defender' | 'most_assists';
export type LaunchPlatform = 'clanker' | 'flaunch';

export interface Match {
  id: string;
  external_id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  match_date: string;
  league: string;
  season: string | null;
  venue: string | null;
  match_data: any;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  external_id: string;
  name: string;
  team: string;
  position: string | null;
  nationality: string | null;
  photo_url: string | null;
  player_data: any;
  created_at: string;
  updated_at: string;
}

export interface MatchAward {
  id: string;
  match_id: string;
  player_id: string;
  award_type: AwardType;
  analysis: string;
  statistics: any;
  created_at: string;
  // Relations
  player?: Player;
  match?: Match;
  tokens?: Token[];
}

export interface Token {
  id: string;
  award_id: string;
  token_name: string;
  token_symbol: string;
  contract_address: string;
  launch_platform: LaunchPlatform;
  description: string;
  token_metadata: any;
  transaction_hash: string | null;
  launched_at: string;
  created_at: string;
  // Relations
  award?: MatchAward;
}

export interface AnalysisReport {
  id: string;
  match_id: string;
  full_analysis: any;
  model_version: string | null;
  created_at: string;
  // Relations
  match?: Match;
}

// Extended types with relations for frontend use
export interface MatchWithDetails extends Match {
  awards: (MatchAward & { player: Player; tokens: Token[] })[];
  analysis?: AnalysisReport;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
export type JobType = 'match_analysis' | 'token_launch' | 'match_workflow';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: number;
  payload: any;
  result: any;
  error: string | null;
  attempts: number;
  max_attempts: number;
  scheduled_for: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  match_id: string;
  status: string;
  current_step: string | null;
  steps_completed: any;
  error: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  payload: any;
  published: boolean;
  created_at: string;
}

export interface FeesSummary {
  id: string;
  total_fees: number;
  total_tokens_launched: number;
  last_updated: string;
  created_at: string;
}

// Pure DB row types (no relation fields) used in the Database generic
type MatchRow = Omit<Match, never>;
type PlayerRow = Omit<Player, never>;
type MatchAwardRow = Omit<MatchAward, 'player' | 'match' | 'tokens'>;
type TokenRow = Omit<Token, 'award'>;
type AnalysisReportRow = Omit<AnalysisReport, 'match'>;

export interface Database {
  public: {
    Tables: {
      matches: {
        Row: MatchRow;
        Insert: Omit<MatchRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MatchRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      players: {
        Row: PlayerRow;
        Insert: Omit<PlayerRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PlayerRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      match_awards: {
        Row: MatchAwardRow;
        Insert: Omit<MatchAwardRow, 'id' | 'created_at'>;
        Update: Partial<Omit<MatchAwardRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      tokens: {
        Row: TokenRow;
        Insert: Omit<TokenRow, 'id' | 'created_at' | 'launched_at'>;
        Update: Partial<Omit<TokenRow, 'id' | 'created_at' | 'launched_at'>>;
        Relationships: [];
      };
      analysis_reports: {
        Row: AnalysisReportRow;
        Insert: Omit<AnalysisReportRow, 'id' | 'created_at'>;
        Update: Partial<Omit<AnalysisReportRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      jobs: {
        Row: Job;
        Insert: Omit<Job, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Job, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      workflow_executions: {
        Row: WorkflowExecution;
        Insert: Omit<WorkflowExecution, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<WorkflowExecution, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at'>;
        Update: Partial<Omit<Event, 'id' | 'created_at'>>;
        Relationships: [];
      };
      fees_summary: {
        Row: FeesSummary;
        Insert: Omit<FeesSummary, 'id' | 'created_at'>;
        Update: Partial<Omit<FeesSummary, 'id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
