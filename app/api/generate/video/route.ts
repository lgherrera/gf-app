// app/api/generate/video/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime     = "nodejs";
export const maxDuration = 300; // video generation can take up to 2 min

async function uploadToFal(base64: string, mime: string, falKey: string): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const res = await fetch("https://fal.run/fal-ai/storage/upload", {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": mime,
    },
    body: buffer,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`fal storage upload failed: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!data.url) throw new Error("fal storage returned no URL");
  return data.url as string;
}

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      aspectRatio,
      duration,
      resolution,
      imageBase64,
      imageMime,
      audioBase64,
      audioMime,
    } = await req.json() as {
      prompt:      string;
      aspectRatio: string;
      duration:    string;
      resolution:  string;
      imageBase64: string;
      imageMime:   string;
      audioBase64: string | null;
      audioMime:   string;
    };

    if (!prompt)      return NextResponse.json({ error: "Prompt requerido" }, { status: 400 });
    if (!imageBase64) return NextResponse.json({ error: "Imagen requerida" }, { status: 400 });

    const FAL_KEY = process.env.FAL_KEY;
    if (!FAL_KEY) {
      return NextResponse.json({ error: "FAL_KEY no configurada" }, { status: 500 });
    }

    // Upload image to fal storage — must be a public URL, not base64
    const imageUrl = await uploadToFal(imageBase64, imageMime || "image/jpeg", FAL_KEY);

    // Upload audio if provided
    let audioUrl: string | undefined;
    if (audioBase64) {
      audioUrl = await uploadToFal(audioBase64, audioMime || "audio/mpeg", FAL_KEY);
    }

    // Build fal.ai Wan 2.6 image-to-video request body
    const body: Record<string, unknown> = {
      prompt,
      image_url:             imageUrl,
      aspect_ratio:          aspectRatio || "16:9",
      resolution:            resolution  || "720p",
      duration:              duration    || "5",
      enable_safety_checker: false, // must be explicitly false — default is true
    };

    if (audioUrl) {
      body.audio_url = audioUrl;
    }

    const falRes = await fetch("https://fal.run/wan/v2.6/image-to-video/flash", {
      method: "POST",
      headers: {
        Authorization:  `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await falRes.text();

    if (!falRes.ok) {
      console.error("fal.ai video error:", text);
      return NextResponse.json(
        { error: `fal.ai ${falRes.status}: ${text.slice(0, 300)}` },
        { status: 502 }
      );
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: `Respuesta no-JSON: ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    // fal.ai returns { video: { url: "..." } }
    const videoUrl = (data?.video as { url?: string })?.url;

    if (!videoUrl) {
      console.error("fal.ai unexpected video shape:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json(
        { error: `Forma inesperada: ${JSON.stringify(data).slice(0, 300)}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: videoUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("Generate video error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}