// app/api/create-girlfriend/route.ts
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

fal.config({
  credentials: process.env.FAL_KEY,
});

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

// Build image prompt from appearance config
function buildImagePrompt(config: any): string {
  const genderMap: Record<string, string> = {
    female: 'a beautiful woman',
    anime: 'an anime-style girl',
  };

  const ethnicityMap: Record<string, string> = {
    latin: 'latina',
    european: 'european',
    asian: 'asian',
  };

  const ageRangeMap: Record<string, string> = {
    '18-19': 'young, around 18-19 years old',
    '20s': 'in her 20s',
    '30s': 'in her 30s',
    '40s': 'in her 40s',
    '50+': 'mature, in her 50s',
  };

  const bodyMap: Record<string, string> = {
    athletic: 'athletic body',
    curvy: 'curvy body',
    slim: 'slim body',
  };

  const hairColorMap: Record<string, string> = {
    redhead: 'red hair',
    blonde: 'blonde hair',
    brunette: 'brunette hair',
    pink: 'pink hair',
  };

  const hairStyleMap: Record<string, string> = {
    straight: 'straight hair',
    short: 'short hair',
    curly: 'curly hair',
    wavy: 'wavy hair',
  };

  const subject = genderMap[config.gender] || 'a beautiful woman';
  const ethnicity = ethnicityMap[config.ethnicity] || '';
  const age = ageRangeMap[config.ageRange] || '';
  const body = bodyMap[config.physicalTrait] || '';
  const hairColor = hairColorMap[config.hairColor] || '';
  const hairStyle = hairStyleMap[config.hairStyle] || '';

  const isAnime = config.gender === 'anime';

  if (isAnime) {
    return `${subject}, ${ethnicity}, ${age}, ${body}, ${hairColor}, ${hairStyle}, anime art style, detailed, vibrant colors, high quality illustration, portrait, looking at viewer`;
  }

  return `Photorealistic portrait of ${subject}, ${ethnicity}, ${age}, ${body}, ${hairColor}, ${hairStyle}, natural lighting, soft focus background, high quality photography, looking at viewer, warm expression`;
}

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

    // Generate image with FAL.ai
    let imageUrl = 'https://awmewvzgyaylxmxsptcz.supabase.co/storage/v1/object/public/create-gf/placeholder.jpg';

    try {
      const prompt = buildImagePrompt(config);
      console.log('Generating image with prompt:', prompt);

      const result = await fal.subscribe('xai/grok-imagine-image', {
        input: {
          prompt,
        },
      }) as any;

      console.log('FAL result:', JSON.stringify(result));

      if (result.data?.images?.[0]?.url) {
        const generatedImageUrl = result.data.images[0].url;

        // Upload to Supabase Storage using admin client
        const imageResponse = await fetch(generatedImageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const fileName = `custom/${userId}/${slug}.jpg`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('girlfriends')
          .upload(fileName, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrl } = supabaseAdmin.storage
            .from('girlfriends')
            .getPublicUrl(fileName);
          imageUrl = publicUrl.publicUrl;
        } else {
          console.error('Upload error:', uploadError);
          // Fall back to FAL's temporary URL
          imageUrl = generatedImageUrl;
        }
      }
    } catch (imgErr) {
      console.error('Image generation error:', imgErr);
      // Continue with placeholder if image generation fails
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