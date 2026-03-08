// app/api/generate/image/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime    = "nodejs";
export const maxDuration = 120;

// Map our ratio labels to fal.ai image_size presets
const RATIO_TO_SIZE: Record<string, { width: number; height: number }> = {
  "1:1":  { width: 1024, height: 1024 },
  "16:9": { width: 1820, height: 1024 },
  "9:16": { width: 1024, height: 1820 },
  "4:3":  { width: 1365, height: 1024 },
  "3:4":  { width: 1024, height: 1365 },
  "3:2":  { width: 1536, height: 1024 },
  "2:3":  { width: 1024, height: 1536 },
  "21:9": { width: 2048, height: 878  },
};

export async function POST(req: NextRequest) {
  try {
    const formData    = await req.formData();
    const prompt      = formData.get("prompt") as string;
    const aspectRatio = (formData.get("aspect_ratio") as string) || "1:1";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt requerido" }, { status: 400 });
    }

    const FAL_KEY = process.env.FAL_KEY;
    if (!FAL_KEY) {
      return NextResponse.json(
        { error: "FAL_KEY no configurada en variables de entorno" },
        { status: 500 }
      );
    }

    // Upload reference images to fal storage
    const referenceUrls: string[] = [];
    let i = 0;
    while (formData.get(`reference_${i}`)) {
      const file   = formData.get(`reference_${i}`) as File;
      const bytes  = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadRes = await fetch("https://fal.run/fal-ai/storage/upload", {
        method: "POST",
        headers: {
          Authorization: `Key ${FAL_KEY}`,
          "Content-Type": file.type || "image/jpeg",
        },
        body: buffer,
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        if (uploadData.url) referenceUrls.push(uploadData.url);
      }
      i++;
    }

    const imageSize = RATIO_TO_SIZE[aspectRatio] ?? { width: 1024, height: 1024 };

    // Use text-to-image endpoint, or edit endpoint when reference images provided
    const endpoint = referenceUrls.length > 0
      ? "https://fal.run/fal-ai/bytedance/seedream/v4.5/edit"
      : "https://fal.run/fal-ai/bytedance/seedream/v4.5/text-to-image";

    const body: Record<string, unknown> = {
      prompt,
      image_size: imageSize,
      num_images: 1,
      enable_safety_checker: false,
    };

    if (referenceUrls.length > 0) {
      body.image_urls = referenceUrls;
    }

    const falRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!falRes.ok) {
      const errText = await falRes.text();
      console.error("fal.ai error:", errText);
      return NextResponse.json(
        { error: `Error de fal.ai: ${falRes.status}` },
        { status: 502 }
      );
    }

    const falData = await falRes.json();

    const imageUrl =
      falData?.images?.[0]?.url ||
      falData?.image?.url ||
      falData?.output?.images?.[0]?.url;

    if (!imageUrl) {
      console.error("fal.ai unexpected response:", JSON.stringify(falData));
      return NextResponse.json(
        { error: "No se recibió imagen de fal.ai" },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: imageUrl });
  } catch (err) {
    console.error("Generate image error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}