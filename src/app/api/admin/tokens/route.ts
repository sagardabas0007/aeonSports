import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/tokens
 * Get all tokens
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

    return NextResponse.json({ tokens });
  } catch (error: any) {
    console.error('[Admin Tokens] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}
