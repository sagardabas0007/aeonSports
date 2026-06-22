import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
export async function GET() {
  try {
    const supabase = getServiceSupabase();

    // Get counts in parallel
    const [matchesResult, finishedResult, tokensResult, jobsResult] = await Promise.all([
      supabase.from('matches').select('id', { count: 'exact', head: true }),
      supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'finished'),
      supabase.from('tokens').select('id', { count: 'exact', head: true }),
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);

    return NextResponse.json({
      totalMatches: matchesResult.count || 0,
      finishedMatches: finishedResult.count || 0,
      totalTokens: tokensResult.count || 0,
      pendingJobs: jobsResult.count || 0,
    });
  } catch (error: any) {
    console.error('[Admin Stats] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
