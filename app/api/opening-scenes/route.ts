// app/api/opening-scenes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getOpeningScenes } from '@/lib/opening-scenes';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentRating = searchParams.get('contentRating') || 'sfw';

    const scenes = await getOpeningScenes(contentRating);

    return NextResponse.json({ scenes });
  } catch (error) {
    console.error('Error in opening scenes API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opening scenes' },
      { status: 500 }
    );
  }
}