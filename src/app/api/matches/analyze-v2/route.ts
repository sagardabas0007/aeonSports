import { NextRequest, NextResponse } from 'next/server';
import { fifaApiService } from '@/services/fifa-api.service';
import { aiAnalysisPipelineService } from '@/services/ai-analysis-pipeline.service';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/matches/analyze-v2
 * Production-ready AI analysis pipeline
 *
 * Body: { matchId: string }
 *
 * Returns: Complete analysis with MVP, Best Defender, Most Assists
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { matchId } = await request.json();

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    console.log(`[Analyze V2] Starting analysis for match ${matchId}`);

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

    if (match.status !== 'finished') {
      return NextResponse.json(
        { error: 'Can only analyze finished matches' },
        { status: 400 }
      );
    }

    // Fetch complete match data from FIFA API
    const fixtureId = parseInt(match.external_id);
    console.log(`[Analyze V2] Fetching FIFA data for fixture ${fixtureId}`);

    const { fixture, players } = await fifaApiService.getCompleteMatchData(fixtureId);

    if (!fixture) {
      return NextResponse.json({ error: 'Fixture not found in FIFA API' }, { status: 404 });
    }

    // Convert to pipeline input
    const input = aiAnalysisPipelineService.convertFifaDataToInput(
      matchId,
      fixture,
      players
    );

    console.log(`[Analyze V2] Converted data: ${input.players.length} players`);

    // Run AI analysis pipeline
    const analysis = await aiAnalysisPipelineService.analyzeMatch(input);

    const duration = Date.now() - startTime;
    console.log(`[Analyze V2] Analysis completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        duration,
        playersAnalyzed: input.players.length,
        modelVersion: analysis.modelVersion,
      },
    });
  } catch (error: any) {
    console.error('[Analyze V2] Error:', error);

    const duration = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze match',
        duration,
      },
      { status: 500 }
    );
  }
}
