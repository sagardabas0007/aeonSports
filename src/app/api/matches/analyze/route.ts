import { NextRequest, NextResponse } from 'next/server';
import { fifaApiService } from '@/services/fifa-api.service';
import { aiAnalysisService } from '@/services/ai-analysis.service';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/matches/analyze
 * Analyze a finished match and store results
 */
export async function POST(request: NextRequest) {
  try {
    const { matchId } = await request.json();

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get match from database
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const matchData = match as any;
    if (matchData.status !== 'finished') {
      return NextResponse.json(
        { error: 'Can only analyze finished matches' },
        { status: 400 }
      );
    }

    // Fetch complete match data from FIFA API
    const fixtureId = parseInt(matchData.external_id);
    const { fixture, players, statistics } = await fifaApiService.getCompleteMatchData(
      fixtureId
    );

    if (!fixture) {
      return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
    }

    // Analyze match with AI
    const analysis = await aiAnalysisService.analyzeMatch(fixture, players);

    // Store analysis report
    await supabase.from('analysis_reports').upsert(
      [{
        match_id: matchId,
        full_analysis: analysis as any,
        model_version: 'gpt-4',
      }] as any,
      { onConflict: 'match_id' }
    );

    // Store match awards and create/update players
    const awards = [analysis.mvp, analysis.bestDefender, analysis.mostAssists].filter(
      Boolean
    );

    for (const award of awards) {
      if (!award) continue;

      // Create or update player
      const { data: player } = await supabase
        .from('players')
        .upsert(
          [{
            external_id: award.playerId.toString(),
            name: award.playerName,
            team: award.team,
            player_data: {} as any,
          }] as any,
          { onConflict: 'external_id' }
        )
        .select()
        .single();

      if (player) {
        // Create match award
        const playerData = player as any;
        await supabase.from('match_awards').upsert(
          [{
            match_id: matchId,
            player_id: playerData.id,
            award_type: award.awardType,
            analysis: award.analysis,
            statistics: award.keyStats as any,
          }] as any,
          { onConflict: 'match_id,award_type' }
        );
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Error analyzing match:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze match' },
      { status: 500 }
    );
  }
}
