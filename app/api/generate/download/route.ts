// app/api/generate/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");
  const format   = (searchParams.get("format") as "jpeg" | "png") || "jpeg";

  if (!imageUrl) {
    return NextResponse.json({ error: "URL requerida" }, { status: 400 });
  }

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error("No se pudo obtener la imagen");

    const buffer = Buffer.from(await res.arrayBuffer());

    let output: Buffer;
    let contentType: string;

    if (format === "png") {
      output      = await sharp(buffer).png({ compressionLevel: 0 }).toBuffer();
      contentType = "image/png";
    } else {
      output      = await sharp(buffer).jpeg({ quality: 100 }).toBuffer();
      contentType = "image/jpeg";
    }

    return new NextResponse(output, {
      headers: {
        "Content-Type":        contentType,
        "Content-Disposition": `attachment; filename="generado-${Date.now()}.${format}"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    return NextResponse.json(
      { error: "No se pudo descargar la imagen" },
      { status: 500 }
    );
  }
}