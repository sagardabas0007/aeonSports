import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/tokens/[id]
 * Delete a token
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceSupabase();

    const { error } = await supabase.from('tokens').delete().eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Token deleted' });
  } catch (error: any) {
    console.error('[Admin Delete Token] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete token' },
      { status: 500 }
    );
  }
}
