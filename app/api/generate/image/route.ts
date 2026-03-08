// app/api/generate/image/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime    = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const formData    = await req.formData();
    const prompt      = formData.get("prompt") as string;
    const aspect_ratio = (formData.get("aspect_ratio") as string) || "1:1";

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

    // Build Seedream 4.5 request body
    const body: Record<string, unknown> = {
      prompt,
      aspect_ratio,
      num_images: 1,
      enable_safety_checker: false,
    };

    if (referenceUrls.length > 0) {
      body.image_url = referenceUrls[0];
      if (referenceUrls.length > 1) {
        body.reference_image_urls = referenceUrls;
      }
    }

    const falRes = await fetch("https://fal.run/fal-ai/seedream-4-5", {
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