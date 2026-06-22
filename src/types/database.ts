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

export interface Database {
  public: {
    Tables: {
      matches: {
        Row: Match;
        Insert: Omit<Match, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Match, 'id' | 'created_at' | 'updated_at'>>;
      };
      players: {
        Row: Player;
        Insert: Omit<Player, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Player, 'id' | 'created_at' | 'updated_at'>>;
      };
      match_awards: {
        Row: MatchAward;
        Insert: Omit<MatchAward, 'id' | 'created_at'>;
        Update: Partial<Omit<MatchAward, 'id' | 'created_at'>>;
      };
      tokens: {
        Row: Token;
        Insert: Omit<Token, 'id' | 'created_at' | 'launched_at'>;
        Update: Partial<Omit<Token, 'id' | 'created_at' | 'launched_at'>>;
      };
      analysis_reports: {
        Row: AnalysisReport;
        Insert: Omit<AnalysisReport, 'id' | 'created_at'>;
        Update: Partial<Omit<AnalysisReport, 'id' | 'created_at'>>;
      };
    };
  };
}
