// app/api/sessions/route.ts

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { sessionId, source, userId, girlfriendId } = await request.json();

    if (!sessionId || !userId || !girlfriendId) {
      return NextResponse.json(
        { error: 'sessionId, userId, and girlfriendId are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        session_id: sessionId,
        user_id: userId,
        girlfriend_id: girlfriendId,
        source: source || 'unknown',
      })
      .select()
      .single();

    // 23505 = unique violation (session already exists, which is fine)
    if (error && error.code !== '23505') {
      throw error;
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error('Error registering session:', error);
    return NextResponse.json(
      { error: 'Failed to register session' },
      { status: 500 }
    );
  }
}