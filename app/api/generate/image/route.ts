// app/api/generate/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export const runtime     = "nodejs";
export const maxDuration = 120;

const RATIO_MAP: Record<string, string> = {
  "1:1":  "square",
  "16:9": "landscape_16_9",
  "9:16": "portrait_9_16",
  "4:3":  "landscape_4_3",
  "3:4":  "portrait_3_4",
  "3:2":  "landscape_3_2",
  "2:3":  "portrait_2_3",
  "21:9": "landscape_21_9",
};

export async function POST(req: NextRequest) {
  try {
    const { prompt, aspectRatio, referenceImages } = await req.json() as {
      prompt: string;
      aspectRatio: string;
      referenceImages?: string[];
    };

    if (!prompt) {
      return NextResponse.json({ error: "Prompt requerido" }, { status: 400 });
    }

    const FAL_KEY = process.env.FAL_KEY;
    if (!FAL_KEY) {
      return NextResponse.json({ error: "FAL_KEY no configurada" }, { status: 500 });
    }

    fal.config({ credentials: FAL_KEY });

    const imageSize = RATIO_MAP[aspectRatio] ?? "square";

    // Upload reference images to fal storage if provided
    let referenceImageUrls: string[] = [];
    if (referenceImages?.length) {
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
      image_size:             imageSize,
      enable_safety_checker:  false,
    };

    if (referenceImageUrls.length > 0) {
      input.reference_images = referenceImageUrls.map((url) => ({ url }));
    }

    const result = await fal.subscribe("fal-ai/bytedance/seedream/v4.5/text-to-image", {
      input,
    });

    const images = (result.data as { images?: { url: string }[] })?.images;
    const imageUrl = images?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: `Respuesta inesperada: ${JSON.stringify(result.data).slice(0, 300)}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: imageUrl });

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