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

    const isFlux      = model === "flux2dev" || model === "flux2max";
    const isFluxMax   = model === "flux2max";
    const isFluxDev   = model === "flux2dev";
    const isV5        = model === "seedream5";
    const isWan       = model === "wan25";
    const endpoint    = MODEL_ENDPOINTS[model ?? "seedream"] ?? MODEL_ENDPOINTS.seedream;
    const imageSize   = isV5
      ? (RATIO_TO_SIZE_V5[aspectRatio] ?? "portrait_16_9")
      : (RATIO_TO_SIZE_V4[aspectRatio] ?? "portrait_16_9");
    const resolvedSeed = seed ?? Math.floor(Math.random() * 2147483647);

    // Reference images only supported by Seedream 4.5
    let referenceImageUrls: string[] = [];
    if (!isFlux && !isV5 && !isWan && referenceImages?.length) {
      referenceImageUrls = await Promise.all(
        referenceImages.map(async (b64) => {
          const blob = base64ToBlob(b64, "image/jpeg");
          const url  = await fal.storage.upload(blob);
          return url;
        })
      );
    }

    const input: Record<string, unknown> = {
      prompt,
      image_size:            imageSize,
      seed:                  resolvedSeed,
      enable_safety_checker: false,
      ...(isFluxMax && { safety_tolerance: "5" }),
      ...(isFluxDev && { guidance_scale: 3.5 }),
      ...(isWan     && { enable_prompt_expansion: false }),
    };

    if (!isFlux && !isV5 && !isWan && referenceImageUrls.length > 0) {
      input.reference_images = referenceImageUrls.map((url) => ({ url }));
    }

    const result = await fal.subscribe(endpoint, { input });

    const data     = result.data as { images?: { url: string }[]; seeds?: number[] };
    const imageUrl = data?.images?.[0]?.url;

    // Wan returns `seeds` (array), others return `seed`
    const returnedSeed = isWan
      ? (data?.seeds?.[0] ?? resolvedSeed)
      : resolvedSeed;

    if (!imageUrl) {
      return NextResponse.json(
        { error: `Respuesta inesperada: ${JSON.stringify(result.data).slice(0, 300)}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: imageUrl, seed: returnedSeed });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("Generate image error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function base64ToBlob(b64: string, mimeType: string): Blob {
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}