// app/api/chat-history/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const girlfriendId = searchParams.get('girlfriendId');
  const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100);

  if (!userId || !girlfriendId) {
    return NextResponse.json(
      { error: 'Missing required params: userId, girlfriendId' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .eq('girlfriend_id', girlfriendId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }

  // Reverse so oldest is first (chronological order)
  const messages = (data || []).reverse();

  return NextResponse.json({ messages });
}