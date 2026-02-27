// app/api/generate-custom-image/route.ts
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
    const { config, userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    if (!config || !config.gender) {
      return NextResponse.json({ error: 'Invalid configuration' }, { status: 400 });
    }

    const prompt = buildImagePrompt(config);
    console.log('Generating image with prompt:', prompt);

    const result = await fal.subscribe('xai/grok-imagine-image', {
      input: {
        prompt,
        aspect_ratio: '2:3',
      },
    }) as any;

    console.log('FAL result:', JSON.stringify(result));

    if (!result.data?.images?.[0]?.url) {
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    const generatedImageUrl = result.data.images[0].url;

    // Upload to Supabase Storage
    const tempSlug = `preview-${Date.now()}`;
    const fileName = `custom/${userId}/${tempSlug}.jpg`;

    const imageResponse = await fetch(generatedImageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from('girlfriends')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Fall back to FAL's temporary URL
      return NextResponse.json({ imageUrl: generatedImageUrl, storagePath: null });
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from('girlfriends')
      .getPublicUrl(fileName);

    return NextResponse.json({
      imageUrl: publicUrl.publicUrl,
      storagePath: fileName,
    });

  } catch (err) {
    console.error('Error in generate-image:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}