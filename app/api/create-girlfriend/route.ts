// app/api/create-girlfriend/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

// Admin client for storage uploads (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map age range to a default age
const ageMap: Record<string, number> = {
  '18-19': 18,
  '20s': 25,
  '30s': 30,
  '40s': 40,
  '50+': 50,
};

async function generateAvatar(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  const buffer = Buffer.from(await response.arrayBuffer());

  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 1024;
  const height = metadata.height || 1536;

  // Crop top-center square (face area)
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
    const { config, userId, imageUrl } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    if (!config || !config.name || !config.gender) {
      return NextResponse.json({ error: 'Invalid configuration' }, { status: 400 });
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    // Build appearance JSON (snake_case for Postgres)
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

    // Generate slug from name
    const baseSlug = config.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${Date.now()}`;

    // Map age range to default age
    const age = ageMap[config.ageRange] || 25;

    // Generate avatar from the approved image
    let avatarUrl: string | null = null;
    try {
      const avatarBuffer = await generateAvatar(imageUrl);
      const avatarFileName = `custom/${userId}/${slug}-avatar.jpg`;

      const { error: avatarUploadError } = await supabaseAdmin.storage
        .from('girlfriends')
        .upload(avatarFileName, avatarBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (!avatarUploadError) {
        const { data: avatarPublicUrl } = supabaseAdmin.storage
          .from('girlfriends')
          .getPublicUrl(avatarFileName);
        avatarUrl = avatarPublicUrl.publicUrl;
      } else {
        console.error('Avatar upload error:', avatarUploadError);
      }
    } catch (avatarErr) {
      console.error('Avatar generation error:', avatarErr);
    }

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
      temperature: 0.7,
      max_tokens: 400,
      description: `Custom AI companion - ${config.name}`,
      image_url: imageUrl,
      avatar: avatarUrl,
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