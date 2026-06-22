import { AwardType } from './database';

export interface PlayerAnalysis {
  playerId: number;
  playerName: string;
  team: string;
  awardType: AwardType;
  analysis: string;
  score: number;
  keyStats: {
    [key: string]: number | string;
  };
}

export interface MatchAnalysis {
  matchId: number;
  matchSummary: string;
  mvp: PlayerAnalysis | null;
  bestDefender: PlayerAnalysis | null;
  mostAssists: PlayerAnalysis | null;
  analysisTimestamp: string;
}

export interface TokenMetadata {
  playerName: string;
  awardType: AwardType;
  tokenName: string;
  tokenSymbol: string;
  description: string;
  matchInfo: {
    homeTeam: string;
    awayTeam: string;
    score: string;
    date: string;
  };
}
