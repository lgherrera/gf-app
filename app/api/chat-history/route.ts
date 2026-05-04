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

export async function DELETE(req: Request) {
  try {
    const { userId, girlfriendId } = await req.json();

    if (!userId || !girlfriendId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, girlfriendId' },
        { status: 400 }
      );
    }

    const { error, count } = await supabase
      .from('chat_messages')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
      .eq('girlfriend_id', girlfriendId);

    if (error) {
      console.error('Error deleting chat messages:', error);
      return NextResponse.json({ error: 'Failed to delete chat messages' }, { status: 500 });
    }

    console.log(`✅ Deleted ${count} chat messages for user ${userId} + girlfriend ${girlfriendId}`);

    return NextResponse.json({ success: true, deleted: count });
  } catch (error) {
    console.error('Delete chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}