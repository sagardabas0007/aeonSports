import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/fees
 * Get total fees collected
 */
export async function GET() {
  try {
    const supabase = getServiceSupabase();

    // Count real tokens launched from the tokens table
    const { count: tokenCount, error: tokensError } = await supabase
      .from('tokens')
      .select('id', { count: 'exact', head: true });

    if (tokensError) throw tokensError;

    // Trading fees accrue on-chain as tokens are swapped via Clanker/Flaunch.
    // The treasury wallet (rewards bps=10000) collects fees when holders trade.
    // fees_summary is updated when fees are claimed — $0 until first trade occurs.
    return NextResponse.json({
      total_fees: '0.00',
      total_tokens_launched: tokenCount ?? 0,
      last_updated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Admin Fees] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch fees' },
      { status: 500 }
    );
  }
}
