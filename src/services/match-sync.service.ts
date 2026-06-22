import { fifaApiService } from './fifa-api.service';
import { getServiceSupabase } from '@/lib/supabase';
import { MatchStatus } from '@/types/database';
import { queueService } from './queue.service';

interface MatchStatusChange {
  matchId: string;
  oldStatus: MatchStatus;
  newStatus: MatchStatus;
  externalId: string;
}

class MatchSyncService {
  private isPolling = false;
  private pollInterval: NodeJS.Timeout | null = null;

  /**
   * Start polling for match updates
   */
  startPolling(intervalMs: number = 60000) {
    if (this.isPolling) {
      console.log('Match polling already running');
      return;
    }

    console.log(`Starting match polling every ${intervalMs}ms`);
    this.isPolling = true;

    // Run immediately
    this.syncMatches();

    // Then run on interval
    this.pollInterval = setInterval(() => {
      this.syncMatches();
    }, intervalMs);
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
    console.log('Match polling stopped');
  }

  /**
   * Sync matches from FIFA API to database
   */
  async syncMatches(): Promise<MatchStatusChange[]> {
    console.log('[MatchSync] Starting sync...');
    const statusChanges: MatchStatusChange[] = [];

    try {
      const supabase = getServiceSupabase();

      // Fetch matches from FIFA API
      const [liveMatches, upcomingMatches, finishedMatches] = await Promise.all([
        fifaApiService.getLiveFixtures().catch(() => []),
        fifaApiService.getUpcomingFixtures().catch(() => []),
        fifaApiService.getFinishedFixtures().catch(() => []),
      ]);

      const allMatches = [...liveMatches, ...upcomingMatches, ...finishedMatches];
      console.log(`[MatchSync] Fetched ${allMatches.length} matches from API`);

      // Process each match
      for (const fixture of allMatches) {
        const externalId = fixture.fixture.id.toString();

        // Determine match status
        const matchStatus: MatchStatus = this.determineMatchStatus(
          fixture.fixture.status.short
        );

        // Check if match exists in database
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id, status, home_score, away_score')
          .eq('external_id', externalId)
          .single();

        const matchData = {
          external_id: externalId,
          home_team: fixture.teams.home.name,
          away_team: fixture.teams.away.name,
          home_score: fixture.goals.home,
          away_score: fixture.goals.away,
          status: matchStatus,
          match_date: fixture.fixture.date,
          league: fixture.league.name,
          season: fixture.league.season.toString(),
          venue: fixture.fixture.venue.name,
          match_data: fixture as any,
        };

        // Detect status change
        if (existingMatch && existingMatch.status !== matchStatus) {
          console.log(
            `[MatchSync] Status change detected: ${externalId} ${existingMatch.status} -> ${matchStatus}`
          );

          statusChanges.push({
            matchId: existingMatch.id,
            oldStatus: existingMatch.status as MatchStatus,
            newStatus: matchStatus,
            externalId,
          });
        }

        // Upsert match to database
        const { error } = await supabase
          .from('matches')
          .upsert(matchData, { onConflict: 'external_id' });

        if (error) {
          console.error(`[MatchSync] Error upserting match ${externalId}:`, error);
        }
      }

      console.log(`[MatchSync] Sync complete. ${statusChanges.length} status changes detected.`);

      // Handle status changes
      await this.handleStatusChanges(statusChanges);

      return statusChanges;
    } catch (error) {
      console.error('[MatchSync] Error during sync:', error);
      throw error;
    }
  }

  /**
   * Determine match status from FIFA API status code
   */
  private determineMatchStatus(statusCode: string): MatchStatus {
    // Finished statuses
    if (['FT', 'AET', 'PEN', 'FT_PEN'].includes(statusCode)) {
      return 'finished';
    }

    // Live statuses
    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT'].includes(statusCode)) {
      return 'live';
    }

    // Upcoming statuses
    return 'upcoming';
  }

  /**
   * Handle status changes and trigger workflows
   */
  private async handleStatusChanges(changes: MatchStatusChange[]): Promise<void> {
    for (const change of changes) {
      // If match just finished, trigger analysis workflow
      if (change.newStatus === 'finished' && change.oldStatus !== 'finished') {
        console.log(
          `[MatchSync] Match ${change.externalId} finished. Triggering analysis...`
        );

        try {
          await this.triggerMatchAnalysis(change.matchId);
        } catch (error) {
          console.error(
            `[MatchSync] Error triggering analysis for match ${change.matchId}:`,
            error
          );
        }
      }
    }
  }

  /**
   * Trigger match analysis workflow (via queue)
   */
  private async triggerMatchAnalysis(matchId: string): Promise<void> {
    try {
      console.log(`[MatchSync] Queueing workflow for match ${matchId}`);

      // Add workflow job to queue with high priority
      const job = await queueService.addJob(
        'match_workflow',
        { matchId },
        { priority: 10 } // High priority for finished matches
      );

      console.log(`[MatchSync] Workflow job queued: ${job.id}`);
    } catch (error) {
      console.error(`[MatchSync] Error queueing workflow:`, error);
      throw error;
    }
  }

  /**
   * Manual sync trigger (for API endpoint)
   */
  async manualSync(): Promise<{
    success: boolean;
    matchesProcessed: number;
    statusChanges: MatchStatusChange[];
    error?: string;
  }> {
    try {
      const statusChanges = await this.syncMatches();

      return {
        success: true,
        matchesProcessed: statusChanges.length,
        statusChanges,
      };
    } catch (error: any) {
      return {
        success: false,
        matchesProcessed: 0,
        statusChanges: [],
        error: error.message,
      };
    }
  }
}

export const matchSyncService = new MatchSyncService();
