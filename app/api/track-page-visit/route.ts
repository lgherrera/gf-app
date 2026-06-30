// app/api/track-page-visit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Content axis (sfw/nsfw)
const CONTENT_MODE = process.env.NEXT_PUBLIC_CONTENT_MODE || 'nsfw';
// Deployment axis (mi/sexy/polola)
const APP_SOURCE = process.env.NEXT_PUBLIC_APP_SOURCE || 'unknown';

export async function POST(req: NextRequest) {
  try {
    const { msisdn, userId, page, girlfriendSlug } = await req.json();

    if (!page) {
      return NextResponse.json({ error: 'Missing page' }, { status: 400 });
    }

    const { error } = await supabase.from('page_visits').insert({
      msisdn: msisdn || null,
      supabase_auth_id: userId || null,
      page,
      girlfriend_slug: girlfriendSlug || null,
      content_rating: CONTENT_MODE,
      source: APP_SOURCE,
    });

    if (error) {
      console.error('track-page-visit error:', error);
      return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('track-page-visit error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}