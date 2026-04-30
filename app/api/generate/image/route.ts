// app/api/generate/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { supabase } from "@/lib/supabase";
import { uploadToS3 } from "@/lib/s3";

export const runtime     = "nodejs";
export const maxDuration = 120;

const MONTHLY_LIMIT = 50;

const RATIO_TO_SIZE_V4: Record<string, { width: number; height: number } | string> = {
  "16:9": "landscape_16_9",
  "9:16": "portrait_16_9",
  "2:3":  { width: 960, height: 1440 },
};

const RATIO_TO_SIZE_V5: Record<string, string> = {
  "16:9": "landscape_16_9",
  "9:16": "portrait_16_9",
  "2:3":  "portrait_4_3",
};

const MODEL_ENDPOINTS: Record<string, string> = {
  seedream:  "fal-ai/bytedance/seedream/v4.5/text-to-image",
  seedream5: "fal-ai/bytedance/seedream/v5/lite/text-to-image",
  flux2dev:  "fal-ai/flux-2",
  flux2max:  "fal-ai/flux-2-max",
  wan25:     "fal-ai/wan-25-preview/text-to-image",
  hunyuan3:  "fal-ai/hunyuan-image/v3/text-to-image",
};

/** Fetch a remote image and return it as a base64 data URI */
async function urlToDataUri(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/jpeg";
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

/** Check how many images a user has generated this month */
async function getMonthlyCount(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("generated_images")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  if (error) {
    console.error("Error checking monthly count:", error);
    return 0;
  }

  return count ?? 0;
}

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      aspectRatio,
      referenceImages,
      referenceImageUrls,
      seed,
      model,
      userId,
      girlfriendId,
    } = await req.json() as {
      prompt: string;
      aspectRatio: string;
      referenceImages?: string[];
      referenceImageUrls?: string[];
      seed?: number;
      model?: string;
      userId?: string;
      girlfriendId?: string;
    };

    if (!prompt) {
      return NextResponse.json({ error: "Prompt requerido" }, { status: 400 });
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json({ error: "FAL_KEY no configurada" }, { status: 500 });
    }

    // Rate limiting: check monthly count if userId is provided
    if (userId) {
      const monthlyCount = await getMonthlyCount(userId);
      if (monthlyCount >= MONTHLY_LIMIT) {
        return NextResponse.json(
          { error: `Has alcanzado el límite de ${MONTHLY_LIMIT} imágenes por mes. Vuelve el próximo mes.` },
          { status: 429 }
        );
      }
    }

    const isFluxMax  = model === "flux2max";
    const isFluxDev  = model === "flux2dev";
    const isV5       = model === "seedream5";
    const isHunyuan  = model === "hunyuan3";
    const isSeedream = model === "seedream" || !model;

    const imageSize = isV5
      ? (RATIO_TO_SIZE_V5[aspectRatio] ?? "portrait_16_9")
      : (RATIO_TO_SIZE_V4[aspectRatio] ?? "portrait_16_9");
    const resolvedSeed = seed ?? Math.floor(Math.random() * 2147483647);

    // Build image data URIs from base64 strings (client-side upload)
    const imageUrls: string[] = [];
    if (isSeedream && referenceImages && referenceImages.length > 0) {
      for (const b64 of referenceImages) {
        imageUrls.push(`data:image/jpeg;base64,${b64}`);
      }
    }

    // Fetch and convert URL-based references (server-side fetch)
    if (isSeedream && referenceImageUrls && referenceImageUrls.length > 0) {
      for (const url of referenceImageUrls) {
        const dataUri = await urlToDataUri(url);
        imageUrls.push(dataUri);
      }
    }

    const hasRefs = isSeedream && imageUrls.length > 0;

    // Switch to /edit endpoint when reference images are provided
    let endpoint: string;
    let finalPrompt = prompt;

    if (hasRefs) {
      endpoint = "fal-ai/bytedance/seedream/v4.5/edit";
      const figureLabels = imageUrls
        .map((_, idx) => `Figure ${idx + 1} is a reference image.`)
        .join(" ");
      finalPrompt = `${figureLabels} Using the style, appearance and features from the reference image(s): ${prompt}`;
    } else {
      endpoint = MODEL_ENDPOINTS[model ?? "seedream"] ?? MODEL_ENDPOINTS.seedream;
    }

    // Build input based on endpoint
    let input: Record<string, unknown>;

    if (hasRefs) {
      input = {
        prompt:                finalPrompt,
        image_urls:            imageUrls,
        image_size:            imageSize,
        num_images:            1,
        enable_safety_checker: false,
      };
    } else {
      input = {
        prompt:                finalPrompt,
        image_size:            imageSize,
        seed:                  resolvedSeed,
        enable_safety_checker: false,
        ...(isFluxMax  && { safety_tolerance: "5" }),
        ...(isFluxDev  && { guidance_scale: 3.5 }),
        ...(isHunyuan  && { guidance_scale: 7.5, enable_prompt_expansion: false }),
      };
    }

    const result = await fal.subscribe(endpoint, { input });

    const images      = (result.data as { images?: { url: string }[] })?.images;
    const falImageUrl = images?.[0]?.url;

    if (!falImageUrl) {
      return NextResponse.json(
        { error: `Respuesta inesperada: ${JSON.stringify(result.data).slice(0, 300)}` },
        { status: 502 }
      );
    }

    const resultSeed    = (result.data as { seed?: number })?.seed ?? resolvedSeed;
    const contentRating = process.env.NEXT_PUBLIC_APP_SOURCE || "sfw";

    // Upload to S3 and save to DB if userId is provided
    let finalImageUrl = falImageUrl;

    if (userId) {
      try {
        // Fetch the fal.ai image and upload to S3
        const imageResponse = await fetch(falImageUrl);
        const buffer = Buffer.from(await imageResponse.arrayBuffer());
        const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
        const timestamp = Date.now();
        const s3Key = `generated-images/${userId}/${timestamp}.jpg`;
        finalImageUrl = await uploadToS3(buffer, s3Key, contentType);

        // Save to database
        await supabase.from("generated_images").insert({
          user_id: userId,
          girlfriend_id: girlfriendId || null,
          prompt,
          image_url: finalImageUrl,
          aspect_ratio: aspectRatio,
          model: model || "seedream",
          seed: resultSeed,
          content_rating: contentRating,
        });
      } catch (s3Err) {
        // Log but don't fail — still return the fal.ai URL
        console.error("S3 upload or DB save error:", s3Err);
      }
    }

    return NextResponse.json({ url: finalImageUrl, seed: resultSeed });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("Generate image error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}