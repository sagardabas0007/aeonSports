import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tokens
 * Get all tokens with player and award info joined
 */
export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data: tokens, error } = await supabase
      .from('tokens')
      .select(`
        *,
        award:match_awards(
          award_type,
          player:players(name, team)
        )
      `)
      .order('launched_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Reshape to include flat player_name, award_type, platform fields
    const shaped = (tokens || []).map((t: any) => ({
      id: t.id,
      token_name: t.token_name,
      token_symbol: t.token_symbol,
      contract_address: t.contract_address,
      platform: t.launch_platform,
      description: t.description,
      token_metadata: t.token_metadata,
      transaction_hash: t.transaction_hash,
      launched_at: t.launched_at,
      created_at: t.created_at,
      player_name: t.award?.player?.name ?? null,
      player_team: t.award?.player?.team ?? null,
      award_type: t.award?.award_type ?? null,
    }));

    return NextResponse.json({ tokens: shaped });
  } catch (error: any) {
    console.error('[Tokens API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}
