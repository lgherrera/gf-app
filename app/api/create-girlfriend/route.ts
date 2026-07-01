// app/api/create-girlfriend/route.ts

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/prompts';
import { uploadToS3 } from '@/lib/s3';
import sharp from 'sharp';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Deployment axis (mi/sexy/polola). Currently still holds sfw/nsfw until env flip.
const APP_SOURCE = process.env.NEXT_PUBLIC_APP_SOURCE || 'unknown';

const ageMap: Record<string, number> = {
  '18-19': 18,
  '20s': 25,
  '30s': 30,
  '40s': 40,
  '50+': 50,
};

const PERSONALITY_TRAIT_MAP: Record<string, string[]> = {
  shy:          ['reservada', 'observadora', 'sensible'],
  flirty:       ['coqueta', 'juguetona', 'seductora'],
  intellectual: ['curiosa', 'culta', 'reflexiva'],
  rebellious:   ['independiente', 'impulsiva', 'desafiante'],
  romantic:     ['soñadora', 'cariñosa', 'apasionada'],
  jealous:      ['posesiva', 'intensa', 'apasionada'],
  dominant:     ['autoritaria', 'decidida', 'controladora'],
  submissive:   ['complaciente', 'dócil', 'entregada'],
};

async function generateAvatar(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  const buffer = Buffer.from(await response.arrayBuffer());

  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 1024;
  const height = metadata.height || 1536;

  const size = Math.min(width, Math.floor(height * 0.65));
  const left = Math.floor((width - size) / 2);
  const top = 0;

  return sharp(buffer)
    .extract({ left, top, width: size, height: size })
    .resize(512, 512)
    .jpeg({ quality: 85 })
    .toBuffer();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { config, userId, imageUrl, imagePrompt } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    if (!config || !config.name || !config.gender) {
      return NextResponse.json({ error: 'Invalid configuration' }, { status: 400 });
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    const appearance = {
      gender: config.gender,
      ethnicity: config.ethnicity,
      age_range: config.ageRange,
      personality: config.personality,
      body_type: config.physicalTrait,
      breast_size: config.breastSize,
      hair_color: config.hairColor,
      hair_style: config.hairStyle,
      outfit: config.outfit,
    };

    const baseSlug = config.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${Date.now()}`;

    const age = ageMap[config.ageRange] || 25;
    const personalityTraits = config.personality ? PERSONALITY_TRAIT_MAP[config.personality] || null : null;

    // Generate and upload avatar to S3
    let avatarUrl: string | null = null;
    try {
      const avatarBuffer = await generateAvatar(imageUrl);
      const avatarKey = `gf-custom-images/${userId}/${slug}-avatar.jpg`;
      avatarUrl = await uploadToS3(avatarBuffer, avatarKey, 'image/jpeg');
    } catch (avatarErr) {
      console.error('Avatar generation/upload error:', avatarErr);
    }

    const partialGirlfriend = {
      id: '',
      name: config.name,
      age,
      appearance: JSON.stringify(appearance),
      backstory: '',
      occupation: 'companion',
      nationality: null,
      content_rating: process.env.NEXT_PUBLIC_CONTENT_MODE || 'sfw',
      personality: config.personality,
      personality_traits: personalityTraits,
      core_motivations: '',
      fears: null,
      likes: null,
      dislikes: null,
      hobbies: null,
      boundaries: '',
      speech_style: '',
      kinks: null,
      model_provider: 'Grok',
      model_name: 'x-ai/grok-4.3',
      temperature: 0.7,
      max_tokens: 400,
      personality_document: null,
    };

    const systemPrompt = buildSystemPrompt(partialGirlfriend);

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
      content_rating: process.env.NEXT_PUBLIC_CONTENT_MODE || 'sfw',
      source: APP_SOURCE,
      personality: config.personality,
      personality_traits: personalityTraits,
      is_active: true,
      model_provider: 'Grok',
      model_name: 'x-ai/grok-4.3',
      temperature: 0.7,
      max_tokens: 400,
      description: config.description || 'Una amiga con beneficios, caliente y siempre dispuesta a hacer todo lo que sea necesario para satisfacer tus deseos.',
      image_url: imageUrl,
      hello_poster_url: imageUrl,
      avatar: avatarUrl,
      image_prompt: imagePrompt || null,
      system_prompt: systemPrompt,
    };

    const { data, error } = await supabaseAdmin
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