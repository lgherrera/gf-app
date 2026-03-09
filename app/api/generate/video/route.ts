// app/api/generate/video/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export const runtime     = "nodejs";
export const maxDuration = 300;

interface WanI2VOutput {
  video: { url: string };
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

    fal.config({ credentials: FAL_KEY });

    // image_url accepts base64 data URIs directly — no storage upload needed
    const imageDataUri = `data:${imageMime || "image/jpeg"};base64,${imageBase64}`;

    // audio_url must be a public URL — upload via SDK if provided
    let audioUrl: string | undefined;
    if (audioBase64) {
      const audioBuffer = Buffer.from(audioBase64, "base64");
      const audioFile   = new File([audioBuffer], "audio.mp3", { type: audioMime || "audio/mpeg" });
      audioUrl = await fal.storage.upload(audioFile);
    }

    const input: Record<string, unknown> = {
      prompt,
      image_url:             imageDataUri,
      aspect_ratio:          aspectRatio || "16:9",
      resolution:            resolution  || "720p",
      duration:              duration    || "5",
      enable_safety_checker: false,
      enable_prompt_expansion: false, // avoid LLM rewrite altering the prompt
    };

    if (audioUrl) input.audio_url = audioUrl;

    const result = await fal.subscribe("wan/v2.6/image-to-video/flash", { input }) as { data: WanI2VOutput };
    const videoUrl = result?.data?.video?.url;

    if (!videoUrl) {
      console.error("fal.ai unexpected shape:", JSON.stringify(result).slice(0, 500));
      return NextResponse.json(
        { error: `Forma inesperada: ${JSON.stringify(result).slice(0, 300)}` },
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