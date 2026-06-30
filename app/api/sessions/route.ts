// app/api/sessions/route.ts

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Deployment axis (mi/sexy/polola), stamped server-side — client value is ignored.
const APP_SOURCE = process.env.NEXT_PUBLIC_APP_SOURCE || 'unknown';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, girlfriendId } = await request.json();

    if (!sessionId || !userId || !girlfriendId) {
      return NextResponse.json(
        { error: 'sessionId, userId, and girlfriendId are required' },
        { status: 400 }
      );
    }

    // Look up the girlfriend for the authoritative content_rating.
    const { data: girlfriend } = await supabase
      .from('girlfriends')
      .select('content_rating')
      .eq('id', girlfriendId)
      .single();

    // Try to insert the session
    const { data, error } = await supabase
      .from('chat_sessions')
      .upsert(
        {
          session_id: sessionId,
          user_id: userId,
          girlfriend_id: girlfriendId,
          source: APP_SOURCE,
          content_rating: girlfriend?.content_rating ?? null,
        },
        { onConflict: 'session_id,girlfriend_id' }
      )
      .select()
      .single();

    if (error) {
      // If upsert fails (e.g. no unique constraint yet), fall back to lookup
      const { data: existing, error: lookupError } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .eq('girlfriend_id', girlfriendId)
        .single();

      if (lookupError || !existing) {
        throw error;
      }

      return NextResponse.json({ success: true, id: existing.id });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Error registering session:', error);
    return NextResponse.json(
      { error: 'Failed to register session' },
      { status: 500 }
    );
  }
}