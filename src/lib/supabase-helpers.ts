import { supabase } from './supabase';
import { getServiceSupabase } from './supabase';
import { Match, Player, MatchAward, Token, MatchStatus, AwardType } from '@/types/database';

/**
 * Match API Helpers
 */
export const matchHelpers = {
  /**
   * Get all matches
   */
  async getAll(status?: MatchStatus) {
    let query = supabase.from('matches').select('*').order('match_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Match[];
  },

  /**
   * Get match by ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Match;
  },

  /**
   * Get match with awards and tokens
   */
  async getWithDetails(id: string) {
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();

    if (matchError) throw matchError;

    const { data: awards, error: awardsError } = await supabase
      .from('match_awards')
      .select(
        `
        *,
        player:players(*),
        tokens(*)
      `
      )
      .eq('match_id', id);

    if (awardsError) throw awardsError;

    const { data: analysis } = await supabase
      .from('analysis_reports')
      .select('*')
      .eq('match_id', id)
      .single();

    return {
      ...match,
      awards: awards || [],
      analysis,
    };
  },

  /**
   * Create or update match (server-side only)
   */
  async upsert(match: Partial<Match>) {
    const supabaseService = getServiceSupabase();
    const { data, error } = await supabaseService
      .from('matches')
      .upsert(match, { onConflict: 'external_id' })
      .select()
      .single();

    if (error) throw error;
    return data as Match;
  },
};

/**
 * Player API Helpers
 */
export const playerHelpers = {
  /**
   * Get player by ID
   */
  async getById(id: string) {
    const { data, error } = await supabase.from('players').select('*').eq('id', id).single();

    if (error) throw error;
    return data as Player;
  },

  /**
   * Get player by external ID
   */
  async getByExternalId(externalId: string) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('external_id', externalId)
      .single();

    if (error) throw error;
    return data as Player;
  },

  /**
   * Create or update player (server-side only)
   */
  async upsert(player: Partial<Player>) {
    const supabaseService = getServiceSupabase();
    const { data, error } = await supabaseService
      .from('players')
      .upsert(player, { onConflict: 'external_id' })
      .select()
      .single();

    if (error) throw error;
    return data as Player;
  },
};

/**
 * Match Award API Helpers
 */
export const matchAwardHelpers = {
  /**
   * Get awards for a match
   */
  async getByMatchId(matchId: string) {
    const { data, error } = await supabase
      .from('match_awards')
      .select(
        `
        *,
        player:players(*),
        tokens(*)
      `
      )
      .eq('match_id', matchId);

    if (error) throw error;
    return data as (MatchAward & { player: Player; tokens: Token[] })[];
  },

  /**
   * Get award by type for a match
   */
  async getByMatchAndType(matchId: string, awardType: AwardType) {
    const { data, error } = await supabase
      .from('match_awards')
      .select(
        `
        *,
        player:players(*),
        tokens(*)
      `
      )
      .eq('match_id', matchId)
      .eq('award_type', awardType)
      .single();

    if (error) throw error;
    return data as MatchAward & { player: Player; tokens: Token[] };
  },

  /**
   * Create or update match award (server-side only)
   */
  async upsert(award: Partial<MatchAward>) {
    const supabaseService = getServiceSupabase();
    const { data, error } = await supabaseService
      .from('match_awards')
      .upsert(award, { onConflict: 'match_id,award_type' })
      .select()
      .single();

    if (error) throw error;
    return data as MatchAward;
  },
};

/**
 * Token API Helpers
 */
export const tokenHelpers = {
  /**
   * Get all tokens for an award
   */
  async getByAwardId(awardId: string) {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('award_id', awardId)
      .order('launched_at', { ascending: false });

    if (error) throw error;
    return data as Token[];
  },

  /**
   * Get token by contract address
   */
  async getByContractAddress(contractAddress: string) {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('contract_address', contractAddress)
      .single();

    if (error) throw error;
    return data as Token;
  },

  /**
   * Get all tokens for a match
   */
  async getByMatchId(matchId: string) {
    const { data, error } = await supabase
      .from('tokens')
      .select(
        `
        *,
        award:match_awards!inner(
          match_id
        )
      `
      )
      .eq('award.match_id', matchId);

    if (error) throw error;
    return data as Token[];
  },

  /**
   * Create token (server-side only)
   */
  async create(token: Partial<Token>) {
    const supabaseService = getServiceSupabase();
    const { data, error } = await supabaseService
      .from('tokens')
      .insert(token)
      .select()
      .single();

    if (error) throw error;
    return data as Token;
  },
};

/**
 * Analysis Report Helpers
 */
export const analysisHelpers = {
  /**
   * Get analysis report for a match
   */
  async getByMatchId(matchId: string) {
    const { data, error } = await supabase
      .from('analysis_reports')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create or update analysis report (server-side only)
   */
  async upsert(report: any) {
    const supabaseService = getServiceSupabase();
    const { data, error } = await supabaseService
      .from('analysis_reports')
      .upsert(report, { onConflict: 'match_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
