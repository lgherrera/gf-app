// app/api/admin/populate-system-prompts/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildSystemPrompt } from '@/lib/prompts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: girlfriends, error } = await supabase
    .from('girlfriends')
    .select('*');

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  const results = [];

  for (const girlfriend of girlfriends) {
    const systemPrompt = buildSystemPrompt(girlfriend);

    const { error: updateError } = await supabase
      .from('girlfriends')
      .update({ system_prompt: systemPrompt })
      .eq('id', girlfriend.id);

    results.push({
      name: girlfriend.name,
      success: !updateError,
      error: updateError?.message ?? null
    });
  }

  return NextResponse.json({ results });
}