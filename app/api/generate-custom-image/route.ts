// app/api/generate-custom-image/route.ts

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { uploadToS3 } from '@/lib/s3';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  const ageMap: Record<string, string> = {
    '18-19': 'in her late teens',
    '20s': 'in her 20s',
    '30s': 'in her 30s',
    '40s': 'in her 40s',
    '50+': 'in her 50s',
  };

  const subject = genderMap[config.gender] || 'a beautiful woman';
  const isAnime = config.gender === 'anime';

  const parts = [
    ethnicityMap[config.ethnicity],
    ageMap[config.ageRange],
    config.physicalTrait,
    config.breastSize ? `${config.breastSize} breasts` : null,
    config.hairColor ? `${config.hairColor} hair` : null,
    config.hairStyle ? `${config.hairStyle} hair` : null,
    config.outfit ? `wearing ${config.outfit}` : null,
  ].filter(Boolean).join(', ');

  if (isAnime) {
    return `${subject}, ${parts}, anime art style, detailed, vibrant colors, high quality illustration, portrait, looking at viewer`;
  }

  return `Photorealistic portrait of ${subject}, ${parts}, natural lighting, blurred background, high quality photography, looking at viewer, sluty expression`;
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
        image_size: { width: 1440, height: 2160 },
        enable_safety_checker: false,
      },
    }) as any;

    if (!result.data?.images?.[0]?.url) {
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    const generatedImageUrl = result.data.images[0].url;

    // Download fal.ai image
    const imageResponse = await fetch(generatedImageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Upload to S3 via CloudFront
    const tempSlug = `preview-${Date.now()}`;
    const key = `gf-custom-images/${userId}/${tempSlug}.jpg`;
    const imageUrl = await uploadToS3(imageBuffer, key, 'image/jpeg');

    return NextResponse.json({
      imageUrl,
      storagePath: key,
      imagePrompt: prompt,
    });

  } catch (err) {
    console.error('Error in generate-custom-image:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}