import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tokens
 * Get all tokens (public endpoint for trading agents)
 */
export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data: tokens, error } = await supabase
      .from('tokens')
      .select('*')
      .order('launched_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ tokens: tokens || [] });
  } catch (error: any) {
    console.error('[Tokens API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}
