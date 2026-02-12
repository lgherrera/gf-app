// app/api/scenarios/[girlfriendId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getScenariosByGirlfriend } from '@/lib/scenarios';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ girlfriendId: string }> }
) {
  try {
    const { girlfriendId } = await params; // Added await here
    const scenarios = await getScenariosByGirlfriend(girlfriendId);

    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error('Error in scenarios API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}