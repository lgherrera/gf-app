// app/api/generate/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export const runtime     = "nodejs";
export const maxDuration = 120;

const RATIO_TO_SIZE: Record<string, { width: number; height: number } | string> = {
  "1:1":  "square_hd",
  "16:9": "landscape_16_9",
  "9:16": "portrait_16_9",
  "4:3":  "landscape_4_3",
  "3:4":  "portrait_4_3",
  "3:2":  { width: 2880, height: 1920 },
  "2:3":  { width: 1920, height: 2880 },
  "21:9": { width: 4096, height: 1746 },
};

const MODEL_ENDPOINTS: Record<string, string> = {
  seedream: "fal-ai/bytedance/seedream/v4.5/text-to-image",
  flux2dev: "fal-ai/flux-2/dev",
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

    const endpoint     = MODEL_ENDPOINTS[model ?? "seedream"] ?? MODEL_ENDPOINTS.seedream;
    const isFlux       = model === "flux2dev";
    const imageSize    = RATIO_TO_SIZE[aspectRatio] ?? "square_hd";
    const resolvedSeed = seed ?? Math.floor(Math.random() * 2147483647);

    // Reference images only supported by Seedream
    let referenceImageUrls: string[] = [];
    if (!isFlux && referenceImages?.length) {
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
      image_size: imageSize,
      seed:       resolvedSeed,
      ...(isFlux
        ? { guidance_scale: 3.5 }
        : { enable_safety_checker: false }
      ),
    };

    if (!isFlux && referenceImageUrls.length > 0) {
      input.reference_images = referenceImageUrls.map((url) => ({ url }));
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

    return NextResponse.json({ url: imageUrl, seed: resolvedSeed });

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