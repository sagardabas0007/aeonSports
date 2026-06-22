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

    // Get fees summary
    const { data: feesSummary, error: feesError } = await supabase
      .from('fees_summary')
      .select('*')
      .single();

    if (feesError && feesError.code !== 'PGRST116') {
      throw feesError;
    }

    // If no fees_summary exists, calculate from tokens
    if (!feesSummary) {
      const { data: tokens, error: tokensError } = await supabase
        .from('tokens')
        .select('launch_fee');

      if (tokensError) throw tokensError;

      const totalFees = tokens?.reduce((sum, token) => sum + (Number(token.launch_fee) || 10), 0) || 0;
      const totalTokens = tokens?.length || 0;

      return NextResponse.json({
        total_fees: totalFees.toFixed(2),
        total_tokens_launched: totalTokens,
        last_updated: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      total_fees: Number(feesSummary.total_fees).toFixed(2),
      total_tokens_launched: feesSummary.total_tokens_launched,
      last_updated: feesSummary.last_updated,
    });
  } catch (error: any) {
    console.error('[Admin Fees] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch fees' },
      { status: 500 }
    );
  }
}
