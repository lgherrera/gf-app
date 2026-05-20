// app/api/track-chat-visit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { msisdn, userId, girlfriendSlug } = await req.json();

    if (!msisdn || !girlfriendSlug) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { error } = await supabase.from('chat_visits').insert({
      msisdn,
      supabase_auth_id: userId || null,
      girlfriend_slug: girlfriendSlug,
    });

    if (error) {
      console.error('track-chat-visit error:', error);
      return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('track-chat-visit error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}