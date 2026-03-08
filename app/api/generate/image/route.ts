// app/api/generate/image/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime     = "nodejs";
export const maxDuration = 120;

const RATIO_TO_PROMPT: Record<string, string> = {
  "1:1":  "Generate this image in a perfectly square 1:1 aspect ratio.",
  "16:9": "Generate this image in a wide 16:9 landscape aspect ratio.",
  "9:16": "Generate this image in a tall 9:16 portrait aspect ratio.",
  "4:3":  "Generate this image in a 4:3 landscape aspect ratio.",
  "3:4":  "Generate this image in a 3:4 portrait aspect ratio.",
  "3:2":  "Generate this image in a 3:2 landscape aspect ratio.",
  "2:3":  "Generate this image in a 2:3 portrait aspect ratio.",
  "21:9": "Generate this image in an ultrawide 21:9 cinematic aspect ratio.",
};

export async function POST(req: NextRequest) {
  try {
    const { prompt, aspectRatio, referenceImages } = await req.json() as {
      prompt: string;
      aspectRatio: string;
      referenceImages: string[]; // raw base64 strings (no data: prefix)
    };

    if (!prompt) {
      return NextResponse.json({ error: "Prompt requerido" }, { status: 400 });
    }

    const OR_KEY = process.env.OPENROUTER_API_KEY;
    if (!OR_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY no configurada" },
        { status: 500 }
      );
    }

    type ContentPart =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } };

    const content: ContentPart[] = [];

    // Add reference images as data URLs
    (referenceImages ?? []).forEach((b64: string) => {
      content.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${b64}` },
      });
    });

    // Aspect ratio instruction FIRST, then the user prompt
    const ratioHint  = RATIO_TO_PROMPT[aspectRatio] ?? "Generate this image in a perfectly square 1:1 aspect ratio.";
    const fullPrompt = `${ratioHint} ${prompt}`;
    content.push({ type: "text", text: fullPrompt });

    const body = {
      model:      "bytedance-seed/seedream-4.5",
      modalities: ["image"],
      messages:   [{ role: "user", content }],
    };

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization:  `Bearer ${OR_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer":  "https://www.charlare.com",
        "X-Title":       "Charlare",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("OpenRouter error:", text);
      return NextResponse.json(
        { error: `OpenRouter ${res.status}: ${text.slice(0, 300)}` },
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

    const choices = data?.choices as { message?: Record<string, unknown> }[] | undefined;
    const msg     = choices?.[0]?.message;

    let imageUrl: string | undefined;

    // Shape 1: message.images[]
    const images = msg?.images as { image_url?: { url?: string } }[] | undefined;
    if (images?.[0]?.image_url?.url) {
      imageUrl = images[0].image_url.url;
    }

    // Shape 2: message.content string
    if (!imageUrl && typeof msg?.content === "string") {
      const c = msg.content as string;
      if (c.startsWith("data:") || c.startsWith("http")) imageUrl = c;
    }

    // Shape 3: message.content array
    if (!imageUrl && Array.isArray(msg?.content)) {
      for (const part of msg.content as Record<string, unknown>[]) {
        if (part?.type === "image_url") {
          const u = (part.image_url as { url?: string })?.url;
          if (u) { imageUrl = u; break; }
        }
      }
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: `Forma inesperada. Raw: ${JSON.stringify(data).slice(0, 500)}` },
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