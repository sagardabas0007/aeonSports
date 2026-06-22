import { NextRequest, NextResponse } from 'next/server';
import { fifaApiService } from '@/services/fifa-api.service';
import { getServiceSupabase } from '@/lib/supabase';
import { MatchStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/matches
 * Fetch matches from database or sync from FIFA API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as MatchStatus | null;
    const sync = searchParams.get('sync') === 'true';

    const supabase = getServiceSupabase();

    // If sync is requested, fetch from FIFA API and update database
    if (sync) {
      await syncMatches();
    }

    // Query matches from database
    let query = supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: matches, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ matches });
  } catch (error: any) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

/**
 * Sync matches from FIFA API to database
 */
async function syncMatches() {
  const supabase = getServiceSupabase();

  try {
    // Fetch matches from FIFA API
    const [liveMatches, upcomingMatches, finishedMatches] = await Promise.all([
      fifaApiService.getLiveFixtures(),
      fifaApiService.getUpcomingFixtures(),
      fifaApiService.getFinishedFixtures(),
    ]);

    const allMatches = [...liveMatches, ...upcomingMatches, ...finishedMatches];

    // Upsert matches to database
    for (const fixture of allMatches) {
      const matchStatus: MatchStatus =
        fixture.fixture.status.short === 'FT'
          ? 'finished'
          : fixture.fixture.status.short === 'LIVE' ||
            fixture.fixture.status.short === '1H' ||
            fixture.fixture.status.short === '2H'
          ? 'live'
          : 'upcoming';

      await supabase
        .from('matches')
        .upsert(
          {
            external_id: fixture.fixture.id.toString(),
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
          },
          { onConflict: 'external_id' }
        );
    }

    console.log(`Synced ${allMatches.length} matches from FIFA API`);
  } catch (error) {
    console.error('Error syncing matches:', error);
    throw error;
  }
}
