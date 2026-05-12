// app/api/track-visit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { msisdn, page, userId } = await req.json();

    if (!msisdn) {
      return NextResponse.json({ error: 'Missing msisdn' }, { status: 400 });
    }

    const { error } = await supabase.from('homepage_visits').insert({
      msisdn,
      page: page || '/',
      supabase_auth_id: userId || null,
    });

    if (error) {
      console.error('track-visit error:', error);
      return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('track-visit error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}