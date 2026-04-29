// app/render/image/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./render.module.css";

const ASPECT_RATIOS = [
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "2:3",  value: "2:3"  },
];

const RATIO_W: Record<string, number> = { "16:9": 16, "9:16": 9, "2:3": 2 };
const RATIO_H: Record<string, number> = { "16:9": 9, "9:16": 16, "2:3": 3 };

interface GirlfriendData {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  image_url: string | null;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  ratio: string;
  seed: number | null;
}

function RenderImageContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("gf") || "";

  const [girlfriend, setGirlfriend] = useState<GirlfriendData | null>(null);
  const [gfLoading, setGfLoading]   = useState(true);
  const [prompt, setPrompt]         = useState("");
  const [ratio, setRatio]           = useState("9:16");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [result, setResult]         = useState<GeneratedImage | null>(null);
  const [refBase64, setRefBase64]   = useState<string | null>(null);
  const [refLoading, setRefLoading] = useState(false);

  // Fetch girlfriend data by slug
  useEffect(() => {
    if (!slug) {
      setGfLoading(false);
      setError("No girlfriend specified.");
      return;
    }

    fetch(`/api/girlfriend/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Girlfriend not found");
        return res.json();
      })
      .then((data: GirlfriendData) => setGirlfriend(data))
      .catch((err) => {
        console.error("Error fetching girlfriend:", err);
        setError("Could not load girlfriend data.");
      })
      .finally(() => setGfLoading(false));
  }, [slug]);

  // Fetch and convert the reference image to base64 once girlfriend data is loaded
  useEffect(() => {
    if (!girlfriend?.image_url) return;
    setRefLoading(true);

    fetch(girlfriend.image_url)
      .then((res) => res.blob())
      .then((blob) => {
        return new Promise<string>((resolve, reject) => {
          const img = new Image();
          const url = URL.createObjectURL(blob);
          img.onload = () => {
            URL.revokeObjectURL(url);
            const MAX = 1024;
            let w = img.width, h = img.height;
            if (w > MAX || h > MAX) {
              const scale = MAX / Math.max(w, h);
              w = Math.round(w * scale);
              h = Math.round(h * scale);
            }
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, w, h);
            const dataUri = canvas.toDataURL("image/jpeg", 0.82);
            resolve(dataUri.split(",")[1]);
          };
          img.onerror = reject;
          img.src = url;
        });
      })
      .then((b64) => setRefBase64(b64))
      .catch((err) => {
        console.error("Error loading reference image:", err);
        setError("Could not load reference image.");
      })
      .finally(() => setRefLoading(false));
  }, [girlfriend?.image_url]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Ingresa un prompt antes de generar.");
      return;
    }
    if (!refBase64) {
      setError("La imagen de referencia aún no está lista.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio: ratio,
          referenceImages: [refBase64],
          model: "seedream",
        }),
      });

      const text = await res.text();
      let data: { url?: string; seed?: number | null; error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Respuesta inválida: ${text.slice(0, 120)}`);
      }

      if (!res.ok) throw new Error(data.error || "Error al generar");
      if (!data.url) throw new Error("No se recibió URL de imagen");

      setResult({ url: data.url, prompt, ratio, seed: data.seed ?? null });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (format: "jpeg" | "png") => {
    if (!result) return;
    try {
      const res  = await fetch(`/api/generate/download?url=${encodeURIComponent(result.url)}&format=${format}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `${slug || "render"}-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement("a");
      a.href = result.url;
      a.download = `${slug || "render"}-${Date.now()}.${format}`;
      a.target = "_blank";
      a.click();
    }
  };

  const previewAspect = `${RATIO_W[ratio]} / ${RATIO_H[ratio]}`;

  if (gfLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingPage}>Loading…</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <Link href={slug ? `/${slug}/chat` : "/"} className={styles.iconButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>

        <div className={styles.headerCenter}>
          {girlfriend?.avatar && (
            <img src={girlfriend.avatar} alt={girlfriend.name} className={styles.avatar} />
          )}
          <h1 className={styles.headerTitle}>{girlfriend?.name || ""}</h1>
        </div>

        {/* Spacer for layout balance */}
        <div className={styles.iconButton} style={{ visibility: 'hidden' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" />
        </div>
      </header>

      {/* Reference preview */}
      {girlfriend?.image_url && (
        <div className={styles.refPreview}>
          <img src={girlfriend.image_url} alt="Reference" className={styles.refImage} />
          <div className={styles.refBadge}>
            {refLoading ? "Loading..." : "Reference"}
          </div>
        </div>
      )}

      <div className={styles.controls}>
        {/* Prompt */}
        <div className={styles.field}>
          <label className={styles.label}>Prompt</label>
          <textarea
            className={styles.textarea}
            placeholder={`Describe the image you want to generate with ${girlfriend?.name || 'this character'}...`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
          <div className={styles.charCount}>{prompt.length} characters</div>
        </div>

        {/* Aspect ratio */}
        <div className={styles.field}>
          <label className={styles.label}>Aspect Ratio</label>
          <div className={styles.ratioGrid}>
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r.value}
                className={`${styles.ratioBtn} ${ratio === r.value ? styles.ratioActive : ""}`}
                onClick={() => setRatio(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={loading || refLoading || !refBase64}
        >
          {loading ? "Generating…" : refLoading ? "Loading reference…" : "Generate Image"}
        </button>
      </div>

      {/* Preview */}
      <div className={styles.previewFrame} style={{ aspectRatio: previewAspect }}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingDots}><span /><span /><span /></div>
            <p className={styles.loadingText}>Creating your image…</p>
          </div>
        )}
        {result && !loading ? (
          <img src={result.url} alt={result.prompt} className={styles.resultImg} />
        ) : !loading ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✦</div>
            <p>Your image will appear here</p>
          </div>
        ) : null}
      </div>

      {result && !loading && (
        <div className={styles.downloadBar}>
          <span className={styles.downloadLabel}>Download HD</span>
          <div className={styles.downloadBtns}>
            <button className={styles.dlBtn} onClick={() => downloadImage("jpeg")}>JPEG</button>
            <button className={styles.dlBtn} onClick={() => downloadImage("png")}>PNG</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RenderImagePage() {
  return (
    <Suspense fallback={<div style={{ color: "white", padding: "2rem", textAlign: "center" }}>Loading…</div>}>
      <RenderImageContent />
    </Suspense>
  );
}