// app/api/create-girlfriend/route.ts
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Map age range to a default age
const ageMap: Record<string, number> = {
  '18-19': 18,
  '20s': 25,
  '30s': 30,
  '40s': 40,
  '50+': 50,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { config, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    if (!config || !config.name || !config.gender) {
      return NextResponse.json({ error: 'Invalid configuration' }, { status: 400 });
    }

    // Build appearance JSON (snake_case for Postgres)
    const appearance = {
      gender: config.gender,
      ethnicity: config.ethnicity,
      age_range: config.ageRange,
      personality: config.personality,
      body_type: config.physicalTrait,
      hair_color: config.hairColor,
      hair_style: config.hairStyle,
    };

    // Generate slug from name
    const baseSlug = config.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${Date.now()}`;

    // Map age range to default age
    const age = ageMap[config.ageRange] || 25;

    // Build the row
    const newGirlfriend = {
      name: config.name,
      slug,
      age,
      appearance: JSON.stringify(appearance),
      voice_id: config.voiceId || null,
      voice_provider: config.voiceId ? 'elevenlabs' : null,
      voice_model: config.voiceId ? 'eleven_turbo_v2_5' : null,
      girlfriend_type: 'custom',
      created_by: userId,
      content_rating: process.env.NEXT_PUBLIC_CONTENT_FILTER || 'sfw',
      personality: config.personality,
      is_active: true,
      model_provider: 'Grok',
      model_name: 'x-ai/grok-4.1-fast',
      temperature: 0.8,
      max_tokens: 400,
      description: `Custom AI companion - ${config.name}`,
      image_url: 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/placeholder.jpg',
    };

    const { data, error } = await supabase
      .from('girlfriends')
      .insert(newGirlfriend)
      .select('id, slug')
      .single();

    if (error) {
      console.error('Error creating girlfriend:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      slug: data.slug,
      message: 'Girlfriend created successfully',
    });

  } catch (err) {
    console.error('Error in create-girlfriend:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}