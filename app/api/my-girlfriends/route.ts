// app/api/my-girlfriends/route.ts
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

const CONTENT_MODE = process.env.NEXT_PUBLIC_CONTENT_MODE as string;

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from('girlfriends')
    .select('id, slug, name, age, description, image_url')
    .eq('girlfriend_type', 'custom')
    .eq('created_by', userId)
    .eq('content_rating', CONTENT_MODE)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching custom girlfriends:', error);
    return NextResponse.json([]);
  }

  return NextResponse.json(data);
}