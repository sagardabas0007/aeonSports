import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/token/{symbol}
 * Get token by symbol (public endpoint for trading agents)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const supabase = getServiceSupabase();
    const symbol = params.symbol;

    const { data: token, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('token_symbol', symbol)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Token not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error('[Token API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch token' },
      { status: 500 }
    );
  }
}
