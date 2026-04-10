// app/api/generate/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export const runtime     = "nodejs";
export const maxDuration = 120;

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

export async function POST(req: NextRequest) {
  try {
    const { prompt, aspectRatio, referenceImages, seed, model } = await req.json() as {
      prompt: string;
      aspectRatio: string;
      referenceImages?: string[];
      seed?: number;
      model?: string;
    };

    if (!prompt) {
      return NextResponse.json({ error: "Prompt requerido" }, { status: 400 });
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json({ error: "FAL_KEY no configurada" }, { status: 500 });
    }

    const isFlux    = model === "flux2dev" || model === "flux2max";
    const isFluxMax = model === "flux2max";
    const isFluxDev = model === "flux2dev";
    const isV5      = model === "seedream5";
    const isWan     = model === "wan25";
    const isHunyuan = model === "hunyuan3";
    const isSeedream = model === "seedream" || !model;

    const imageSize = isV5
      ? (RATIO_TO_SIZE_V5[aspectRatio] ?? "portrait_16_9")
      : (RATIO_TO_SIZE_V4[aspectRatio] ?? "portrait_16_9");
    const resolvedSeed = seed ?? Math.floor(Math.random() * 2147483647);

    // Check if we have reference images for Seedream 4.5
    const hasRefs = isSeedream && referenceImages && referenceImages.length > 0;

    // Build data URIs from raw base64 strings for the edit endpoint
    const imageUrls: string[] = [];
    if (hasRefs) {
      for (const b64 of referenceImages) {
        imageUrls.push(`data:image/jpeg;base64,${b64}`);
      }
    }

    // Switch to /edit endpoint when reference images are provided
    let endpoint: string;
    let finalPrompt = prompt;

    if (hasRefs) {
      endpoint = "fal-ai/bytedance/seedream/v4.5/edit";
      // The edit endpoint requires images to be referenced as "Figure N" in the prompt
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
      // Edit endpoint input
      input = {
        prompt:                finalPrompt,
        image_urls:            imageUrls,
        image_size:            imageSize,
        num_images:            1,
        enable_safety_checker: false,
      };
    } else {
      // Text-to-image input for all models
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

    const images   = (result.data as { images?: { url: string }[] })?.images;
    const imageUrl = images?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: `Respuesta inesperada: ${JSON.stringify(result.data).slice(0, 300)}` },
        { status: 502 }
      );
    }

    const resultSeed = (result.data as { seed?: number })?.seed ?? resolvedSeed;
    return NextResponse.json({ url: imageUrl, seed: resultSeed });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("Generate image error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}