'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Match, Token, MatchAward, Event } from '@/types/database';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Real-time matches hook with optimistic updates
 */
export function useRealtimeMatches(status?: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Optimistic update function
  const optimisticUpdate = useCallback((matchId: string, updates: Partial<Match>) => {
    setMatches((prev) =>
      prev.map((match) =>
        match.id === matchId ? { ...match, ...updates } : match
      )
    );
  }, []);

  // Optimistic add function
  const optimisticAdd = useCallback((match: Match) => {
    setMatches((prev) => [match, ...prev]);
  }, []);

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
        .channel('matches-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'matches',
            filter: status ? `status=eq.${status}` : undefined,
          },
          (payload) => {
            console.log('[Realtime] Match inserted:', payload.new);
            setMatches((prev) => {
              // Check if already exists (prevent duplicates)
              if (prev.some((m) => m.id === payload.new.id)) {
                return prev;
              }
              return [payload.new as Match, ...prev];
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'matches',
            filter: status ? `status=eq.${status}` : undefined,
          },
          (payload) => {
            console.log('[Realtime] Match updated:', payload.new);
            setMatches((prev) =>
              prev.map((match) =>
                match.id === payload.new.id ? (payload.new as Match) : match
              )
            );
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'matches',
          },
          (payload) => {
            console.log('[Realtime] Match deleted:', payload.old);
            setMatches((prev) => prev.filter((match) => match.id !== payload.old.id));
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Matches subscription status:', status);
        });
    };

    fetchInitialData();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [status]);

  return { matches, loading, error, optimisticUpdate, optimisticAdd };
}

/**
 * Real-time match detail hook
 */
export function useRealtimeMatchDetail(matchId: string) {
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
        .channel(`match-detail-${matchId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'matches',
            filter: `id=eq.${matchId}`,
          },
          (payload) => {
            console.log('[Realtime] Match detail updated:', payload.new);
            setMatchData((prev: any) => ({
              ...prev,
              match: payload.new,
            }));
          }
        )
        .subscribe();

      // Subscribe to match awards
      awardsChannel = supabase
        .channel(`awards-detail-${matchId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'match_awards',
            filter: `match_id=eq.${matchId}`,
          },
          async () => {
            console.log('[Realtime] Awards changed for match');
            // Refetch awards with relations
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

      // Subscribe to tokens (for any award in this match)
      tokensChannel = supabase
        .channel(`tokens-detail-${matchId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tokens',
          },
          async (payload) => {
            console.log('[Realtime] New token added:', payload.new);
            // Refetch to get complete data with relations
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

/**
 * Real-time events hook
 */
export function useRealtimeEvents(onEvent?: (event: Event) => void) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    let channel: RealtimeChannel;

    const fetchRecentEvents = async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setEvents(data || []);
    };

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel('events-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'events',
          },
          (payload) => {
            const newEvent = payload.new as Event;
            console.log('[Realtime] New event:', newEvent.event_type);

            setEvents((prev) => [newEvent, ...prev.slice(0, 49)]);

            // Call callback if provided
            if (onEvent) {
              onEvent(newEvent);
            }
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Events subscription status:', status);
        });
    };

    fetchRecentEvents();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [onEvent]);

  return { events };
}

/**
 * Real-time workflow execution hook
 */
export function useRealtimeWorkflow(matchId: string) {
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: RealtimeChannel;

    const fetchWorkflow = async () => {
      const { data } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setWorkflow(data);
      setLoading(false);
    };

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel(`workflow-${matchId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'workflow_executions',
            filter: `match_id=eq.${matchId}`,
          },
          (payload) => {
            console.log('[Realtime] Workflow updated:', payload.new);
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              setWorkflow(payload.new);
            }
          }
        )
        .subscribe();
    };

    fetchWorkflow();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [matchId]);

  return { workflow, loading };
}
