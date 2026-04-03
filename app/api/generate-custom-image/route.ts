// app/api/generate-custom-image/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function buildImagePrompt(config: any): string {
  const genderMap: Record<string, string> = {
    female: 'a beautiful woman',
    anime:  'an anime-style girl',
  };

  const ethnicityMap: Record<string, string> = {
    latin:    'latina',
    european: 'european',
    asian:    'asian',
  };

  const ageRangeMap: Record<string, string> = {
    '18-19': 'young, around 18-19 years old',
    '20s':   'in her 20s',
    '30s':   'in her 30s',
    '40s':   'in her 40s',
    '50+':   'mature, in her 50s',
  };

  const bodyMap: Record<string, string> = {
    athletic: 'athletic body',
    curvy:    'curvy body',
    slim:     'slim body',
  };

  const breastSizeMap: Record<string, string> = {
    small:       'small breasts',
    medium:      'medium breasts',
    large:       'large breasts',
    'very-large': 'very large breasts',
  };

  const hairColorMap: Record<string, string> = {
    redhead:  'red hair',
    blonde:   'blonde hair',
    brunette: 'brunette hair',
    pink:     'pink hair',
  };

  const hairStyleMap: Record<string, string> = {
    straight: 'straight hair',
    short:    'short hair',
    curly:    'curly hair',
    wavy:     'wavy hair',
  };

  const outfitMap: Record<string, string> = {
    'strapless-dress':    'wearing a strapless dress',
    'bikini':             'wearing a bikini',
    'yoga-outfit':        'wearing a yoga outfit',
    'deep-cleavage-dress': 'wearing a dress with deep cleavage',
    'underwear':          'wearing underwear',
  };

  const parts = [
    ethnicityMap[config.ethnicity],
    ageRangeMap[config.ageRange],
    bodyMap[config.physicalTrait],
    breastSizeMap[config.breastSize],
    hairColorMap[config.hairColor],
    hairStyleMap[config.hairStyle],
    outfitMap[config.outfit],
  ].filter(Boolean).join(', ');

  const subject = genderMap[config.gender] ?? 'a beautiful woman';
  const isAnime = config.gender === 'anime';

  if (isAnime) {
    return `${subject}, ${parts}, anime art style, detailed, vibrant colors, high quality illustration, portrait, looking at viewer`;
  }

  return `Photorealistic portrait of ${subject}, ${parts}, natural lighting, soft focus background, high quality photography, looking at viewer, warm expression`;
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

    const result = await fal.subscribe('fal-ai/bytedance/seedream/v4.5/text-to-image', {
      input: {
        prompt,
        image_size:            { width: 832, height: 1248 }, // ~2:3
        enable_safety_checker: false,
      },
    }) as any;

    console.log('FAL result:', JSON.stringify(result));

    if (!result.data?.images?.[0]?.url) {
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    const generatedImageUrl = result.data.images[0].url;

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
      return NextResponse.json({
        imageUrl: generatedImageUrl,
        storagePath: null,
        imagePrompt: prompt,
      });
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from('girlfriends')
      .getPublicUrl(fileName);

    return NextResponse.json({
      imageUrl: publicUrl.publicUrl,
      storagePath: fileName,
      imagePrompt: prompt,
    });

  } catch (err) {
    console.error('Error in generate-custom-image:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}