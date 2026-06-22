import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analysis/{matchId}
 * Get match analysis (public endpoint for trading agents)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const supabase = getServiceSupabase();
    const { matchId } = await params;

    // Get match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError) {
      if (matchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Match not found' },
          { status: 404 }
        );
      }
      throw matchError;
    }

    // Get analysis report
    const { data: report, error: reportError } = await supabase
      .from('analysis_reports')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (reportError) {
      if (reportError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Analysis not found for this match' },
          { status: 404 }
        );
      }
      throw reportError;
    }

    // Get match awards
    const { data: awards, error: awardsError } = await supabase
      .from('match_awards')
      .select('*')
      .eq('match_id', matchId);

    if (awardsError) throw awardsError;

    // Format analysis response
    const matchData = match as any;
    const analysis = {
      match_id: matchId,
      match: {
        home_team: matchData.home_team,
        away_team: matchData.away_team,
        home_score: matchData.home_score,
        away_score: matchData.away_score,
        match_date: matchData.match_date,
      },
      mvp: null as any,
      best_defender: null as any,
      most_assists: null as any,
    };

    // Format awards
    if (awards) {
      for (const award of awards) {
        const awardObj = award as any;
        const awardData = {
          player_name: awardObj.player_name,
          rationale: awardObj.rationale,
          stats: awardObj.stats || {},
        };

        if (awardObj.award_type === 'mvp') {
          analysis.mvp = awardData;
        } else if (awardObj.award_type === 'best_defender') {
          analysis.best_defender = awardData;
        } else if (awardObj.award_type === 'most_assists') {
          analysis.most_assists = awardData;
        }
      }
    }

    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error('[Analysis API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}
