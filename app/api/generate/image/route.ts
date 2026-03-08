// app/api/generate/image/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime     = "nodejs";
export const maxDuration = 120;

const RATIO_TO_SIZE: Record<string, string> = {
  "1:1":  "1024x1024",
  "16:9": "1820x1024",
  "9:16": "1024x1820",
  "4:3":  "1365x1024",
  "3:4":  "1024x1365",
  "3:2":  "1536x1024",
  "2:3":  "1024x1536",
  "21:9": "2048x878",
};

export async function POST(req: NextRequest) {
  try {
    const formData    = await req.formData();
    const prompt      = formData.get("prompt") as string;
    const aspectRatio = (formData.get("aspect_ratio") as string) || "1:1";

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

    // Collect reference images as base64 data URLs
    const refDataUrls: string[] = [];
    let i = 0;
    while (formData.get(`reference_${i}`)) {
      const file   = formData.get(`reference_${i}`) as File;
      const bytes  = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const mime   = file.type || "image/jpeg";
      refDataUrls.push(`data:${mime};base64,${base64}`);
      i++;
    }

    type ContentPart =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } };

    const content: ContentPart[] = [];
    refDataUrls.forEach((url) => {
      content.push({ type: "image_url", image_url: { url } });
    });
    content.push({ type: "text", text: prompt });

    const size = RATIO_TO_SIZE[aspectRatio] ?? "1024x1024";

    const body = {
      model:      "bytedance-seed/seedream-4.5",
      modalities: ["image"],
      messages:   [{ role: "user", content }],
      image_generation_config: { size },
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

    // Log full response so we can debug the shape
    console.log("OpenRouter raw response:", text.slice(0, 1000));

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: `Respuesta no-JSON: ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    // Try every known shape OpenRouter returns for image models
    const choices = data?.choices as { message?: { content?: unknown } }[] | undefined;
    const msgContent = choices?.[0]?.message?.content;

    let imageUrl: string | undefined;

    if (typeof msgContent === "string") {
      // Plain data URL or https URL
      if (msgContent.startsWith("data:") || msgContent.startsWith("http")) {
        imageUrl = msgContent;
      }
    } else if (Array.isArray(msgContent)) {
      for (const part of msgContent) {
        if (part?.type === "image_url" && part?.image_url?.url) {
          imageUrl = part.image_url.url;
          break;
        }
        // Some providers return type: "image"
        if (part?.type === "image" && part?.source?.url) {
          imageUrl = part.source.url;
          break;
        }
        if (part?.type === "image" && part?.url) {
          imageUrl = part.url;
          break;
        }
      }
    }

    // OpenRouter Seedream returns images in message.images array
    if (!imageUrl) {
      const images = choices?.[0]?.message?.images as { type?: string; image_url?: { url?: string } }[] | undefined;
      if (images?.[0]?.image_url?.url) {
        imageUrl = images[0].image_url.url;
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