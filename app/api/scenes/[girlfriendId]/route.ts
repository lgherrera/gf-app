// app/api/scenes/[girlfriendId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getScenesByGirlfriend } from '@/lib/scenes';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ girlfriendId: string }> }
) {
  try {
    const { girlfriendId } = await params;
    const { searchParams } = new URL(request.url);
    const stage = parseInt(searchParams.get('stage') || '1');

    const scenes = await getScenesByGirlfriend(girlfriendId, stage);

    return NextResponse.json({ scenes });
  } catch (error) {
    console.error('Error in scenes API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenes' },
      { status: 500 }
    );
  }
}