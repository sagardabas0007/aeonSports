'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Match, Token, MatchAward } from '@/types/database';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to real-time match updates
 */
export function useMatchesRealtime(status?: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        let query = supabase.from('matches').select('*').order('match_date', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;
        setMatches(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel('matches-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matches',
            filter: status ? `status=eq.${status}` : undefined,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setMatches((prev) => [payload.new as Match, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setMatches((prev) =>
                prev.map((match) =>
                  match.id === payload.new.id ? (payload.new as Match) : match
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setMatches((prev) => prev.filter((match) => match.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    };

    fetchInitialData();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [status]);

  return { matches, loading, error, refetch: () => setLoading(true) };
}

/**
 * Subscribe to real-time token updates for a specific award
 */
export function useTokensRealtime(awardId: string) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tokens')
          .select('*')
          .eq('award_id', awardId)
          .order('launched_at', { ascending: false });

        if (error) throw error;
        setTokens(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel(`tokens-award-${awardId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tokens',
            filter: `award_id=eq.${awardId}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setTokens((prev) => [payload.new as Token, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setTokens((prev) =>
                prev.map((token) =>
                  token.id === payload.new.id ? (payload.new as Token) : token
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setTokens((prev) => prev.filter((token) => token.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    };

    fetchInitialData();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [awardId]);

  return { tokens, loading, error };
}

/**
 * Subscribe to real-time match detail updates including awards and tokens
 */
export function useMatchDetailRealtime(matchId: string) {
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let matchChannel: RealtimeChannel;
    let awardsChannel: RealtimeChannel;
    let tokensChannel: RealtimeChannel;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .eq('id', matchId)
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
          .eq('match_id', matchId);

        if (awardsError) throw awardsError;

        const { data: analysis } = await supabase
          .from('analysis_reports')
          .select('*')
          .eq('match_id', matchId)
          .single();

        setMatchData({
          match,
          awards: awards || [],
          analysis,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const setupRealtimeSubscriptions = () => {
      // Subscribe to match updates
      matchChannel = supabase
        .channel(`match-${matchId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'matches',
            filter: `id=eq.${matchId}`,
          },
          (payload) => {
            setMatchData((prev: any) => ({
              ...prev,
              match: payload.new,
            }));
          }
        )
        .subscribe();

      // Subscribe to match awards updates
      awardsChannel = supabase
        .channel(`awards-${matchId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'match_awards',
            filter: `match_id=eq.${matchId}`,
          },
          async () => {
            // Refetch awards with relations when changes occur
            const { data: awards } = await supabase
              .from('match_awards')
              .select(
                `
                *,
                player:players(*),
                tokens(*)
              `
              )
              .eq('match_id', matchId);

            setMatchData((prev: any) => ({
              ...prev,
              awards: awards || [],
            }));
          }
        )
        .subscribe();

      // Subscribe to tokens updates (for any award in this match)
      tokensChannel = supabase
        .channel(`tokens-match-${matchId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tokens',
          },
          async () => {
            // Refetch awards with updated tokens
            const { data: awards } = await supabase
              .from('match_awards')
              .select(
                `
                *,
                player:players(*),
                tokens(*)
              `
              )
              .eq('match_id', matchId);

            setMatchData((prev: any) => ({
              ...prev,
              awards: awards || [],
            }));
          }
        )
        .subscribe();
    };

    fetchInitialData();
    setupRealtimeSubscriptions();

    return () => {
      if (matchChannel) supabase.removeChannel(matchChannel);
      if (awardsChannel) supabase.removeChannel(awardsChannel);
      if (tokensChannel) supabase.removeChannel(tokensChannel);
    };
  }, [matchId]);

  return { matchData, loading, error };
}
