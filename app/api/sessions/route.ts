// app/api/sessions/route.ts

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }
    
    // Insert new session (ignore if already exists due to UNIQUE constraint)
    const { error } = await supabase
      .from('sessions')
      .insert({ session_id: sessionId })
      .select()
      .single();
    
    // Error code 23505 = unique violation (session already exists, which is fine)
    if (error && error.code !== '23505') {
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registering session:', error);
    return NextResponse.json({ error: 'Failed to register session' }, { status: 500 });
  }
}