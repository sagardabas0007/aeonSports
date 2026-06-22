import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/matches/[id]
 * Get match details with awards and tokens
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceSupabase();
    const matchId = params.id;

    // Get match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get match awards with player and token details
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

    if (awardsError) {
      throw awardsError;
    }

    // Get analysis report
    const { data: analysis } = await supabase
      .from('analysis_reports')
      .select('*')
      .eq('match_id', matchId)
      .single();

    return NextResponse.json({
      match: {
        ...match,
        awards: awards || [],
        analysis,
      },
    });
  } catch (error: any) {
    console.error('Error fetching match details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch match details' },
      { status: 500 }
    );
  }
}
