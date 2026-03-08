// app/api/generate/image/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime     = "nodejs";
export const maxDuration = 120;

// Map ratio labels to width x height strings OpenRouter accepts
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
        { error: "OPENROUTER_API_KEY no configurada en variables de entorno" },
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

    // Build content array — images first, then the text prompt
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
      messages: [{ role: "user", content }],
      // Pass size as a generation parameter
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
        { error: `OpenRouter ${res.status}: ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    let data: { choices?: { message?: { content?: string | { type: string; image_url?: { url: string } }[] } }[] };
    try {
      data = JSON.parse(text);
    } catch {
      console.error("OpenRouter non-JSON:", text);
      return NextResponse.json(
        { error: `Respuesta inesperada: ${text.slice(0, 120)}` },
        { status: 502 }
      );
    }

    // Extract the image URL/data-URL from the response
    const messageContent = data?.choices?.[0]?.message?.content;
    let imageUrl: string | undefined;

    if (typeof messageContent === "string") {
      // Sometimes returned as a plain data URL string
      imageUrl = messageContent;
    } else if (Array.isArray(messageContent)) {
      const imgPart = messageContent.find(
        (p): p is { type: string; image_url: { url: string } } =>
          p.type === "image_url" && !!p.image_url?.url
      );
      imageUrl = imgPart?.image_url?.url;
    }

    if (!imageUrl) {
      console.error("OpenRouter unexpected shape:", JSON.stringify(data));
      return NextResponse.json(
        { error: "No se recibió imagen de OpenRouter" },
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