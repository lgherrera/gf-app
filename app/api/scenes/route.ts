// app/api/scenes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getScenes } from '@/lib/scenes';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = parseInt(searchParams.get('stage') || '1');
    const contentRating = searchParams.get('contentRating') || 'sfw';

    const scenes = await getScenes(stage, contentRating);

    return NextResponse.json({ scenes });
  } catch (error) {
    console.error('Error in scenes API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenes' },
      { status: 500 }
    );
  }
}