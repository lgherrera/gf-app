// app/render/image/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./render.module.css";
import { useUser } from "@/lib/hooks/useUser";

const FIXED_RATIO = "2:3";

interface GirlfriendData {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  image_url: string | null;
  hello_poster_url: string | null;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  ratio: string;
  seed: number | null;
  imageId: string | null;
}

interface UsageData {
  used: number;
  limit: number;
  remaining: number;
}

function RenderImageContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("gf") || "";
  const userId = useUser();

  const [girlfriend, setGirlfriend] = useState<GirlfriendData | null>(null);
  const [gfLoading, setGfLoading]   = useState(true);
  const [prompt, setPrompt]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [result, setResult]         = useState<GeneratedImage | null>(null);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showCensoredModal, setShowCensoredModal] = useState(false);
  const [isSaved, setIsSaved]       = useState(false);
  const [isTrashed, setIsTrashed]   = useState(false);
  const [usage, setUsage]           = useState<UsageData | null>(null);

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

  // Fetch monthly usage
  useEffect(() => {
    if (!userId) return;

    fetch(`/api/rendered-images/usage?userId=${userId}`)
      .then((res) => res.json())
      .then((data: UsageData) => setUsage(data))
      .catch((err) => console.error("Error fetching usage:", err));
  }, [userId]);

  // Refresh usage after generation
  const refreshUsage = () => {
    if (!userId) return;
    fetch(`/api/rendered-images/usage?userId=${userId}`)
      .then((res) => res.json())
      .then((data: UsageData) => setUsage(data))
      .catch((err) => console.error("Error refreshing usage:", err));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Ingresa un prompt antes de generar.");
      return;
    }
    if (!girlfriend?.image_url) {
      setError("No reference image available.");
      return;
    }
    if (usage && usage.remaining <= 0) {
      setError("Has alcanzado el límite mensual de imágenes generadas.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setIsSaved(false);
    setIsTrashed(false);

    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio: FIXED_RATIO,
          referenceImageUrls: [girlfriend.hello_poster_url || girlfriend.image_url],
          model: "seedream",
          userId,
          girlfriendId: girlfriend.id,
        }),
      });

      const text = await res.text();
      let data: { url?: string; seed?: number | null; imageId?: string | null; error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Respuesta inválida: ${text.slice(0, 120)}`);
      }

      if (!res.ok) {
        const errorMsg = data.error || "Error al generar";

        // Detect fal.ai content moderation (422 Unprocessable Entity)
        if (
          errorMsg.includes("Unprocessable") ||
          errorMsg.includes("422") ||
          errorMsg.includes("moderation") ||
          errorMsg.includes("safety") ||
          res.status === 422
        ) {
          setShowCensoredModal(true);
          setTimeout(() => setShowCensoredModal(false), 5000);
          return;
        }

        throw new Error(errorMsg);
      }

      if (!data.url) throw new Error("No se recibió URL de imagen");

      setResult({
        url: data.url,
        prompt,
        ratio: FIXED_RATIO,
        seed: data.seed ?? null,
        imageId: data.imageId ?? null,
      });

      // Refresh the usage counter after successful generation
      refreshUsage();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result?.imageId || isSaved) return;

    try {
      const res = await fetch(`/api/generated-images/${result.imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "saved" }),
      });

      if (res.ok) {
        setIsSaved(true);
        setShowSavedModal(true);
        setTimeout(() => setShowSavedModal(false), 2500);
      }
    } catch (err) {
      console.error("Error saving image:", err);
    }
  };

  const handleTrash = async () => {
    if (!result?.imageId || isTrashed) return;

    try {
      await fetch(`/api/generated-images/${result.imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "trashed" }),
      });
    } catch (err) {
      console.error("Error trashing image:", err);
    }

    setIsTrashed(true);
  };

  const downloadImage = async () => {
    if (!result) return;
    try {
      const res  = await fetch(`/api/generate/download?url=${encodeURIComponent(result.url)}&format=jpeg`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `${slug || "render"}-${Date.now()}.jpeg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement("a");
      a.href = result.url;
      a.download = `${slug || "render"}-${Date.now()}.jpeg`;
      a.target = "_blank";
      a.click();
    }
  };

  if (gfLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingPage}>Loading…</div>
      </div>
    );
  }

  const usagePercent = usage ? Math.round((usage.used / usage.limit) * 100) : 0;
  const isLimitReached = usage ? usage.remaining <= 0 : false;

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

        {/* Gallery button */}
        <Link href="/sidebar/my-gallery" className={styles.iconButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="16" height="14" rx="2"/>
            <path d="M2 14.5l4.5-4.5 3.5 3.5 2.5-2.5L18 16"/>
            <circle cx="8" cy="9.5" r="1.5"/>
            <path d="M6 3h14a2 2 0 0 1 2 2v14"/>
          </svg>
        </Link>
      </header>

      {/* Monthly usage counter */}
      {usage && (
        <div className={styles.usageBar}>
          <div className={styles.usageInfo}>
            <span className={styles.usageLabel}>Imágenes este mes</span>
            <span className={styles.usageCount}>
              {usage.used} / {usage.limit}
            </span>
          </div>
          <div className={styles.usageTrack}>
            <div
              className={`${styles.usageFill} ${isLimitReached ? styles.usageFillFull : ''}`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          {isLimitReached && (
            <p className={styles.usageLimitMsg}>
              Has alcanzado tu límite mensual de generación de imágenes.
            </p>
          )}
        </div>
      )}

      {/* Reference preview */}
      {girlfriend?.image_url && (
        <div className={styles.refPreview}>
          <img src={girlfriend.hello_poster_url || girlfriend.image_url!} alt="Reference" className={styles.refImage} />
          <div className={styles.refBadge}>Reference</div>
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

        {/* Aspect ratio info */}
        <div className={styles.ratioInfo}>Proporción: 2:3</div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={loading || !girlfriend?.image_url || isLimitReached}
        >
          {loading ? "Generating…" : isLimitReached ? "Límite alcanzado" : "Generate Image"}
        </button>
      </div>

      {/* Preview */}
      <div className={styles.previewFrame} style={{ aspectRatio: '2 / 3' }}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingDots}><span /><span /><span /></div>
            <p className={styles.loadingText}>Creating your image…</p>
          </div>
        )}
        {result && !loading && !isTrashed ? (
          <img src={result.url} alt={result.prompt} className={styles.resultImg} />
        ) : isTrashed ? (
          <div className={styles.emptyState}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Z"/>
            </svg>
            <p>Imagen Borrada</p>
          </div>
        ) : !loading ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✦</div>
            <p>Your image will appear here</p>
          </div>
        ) : null}
      </div>

      {result && !loading && !isTrashed && (
        <div className={styles.downloadBar}>
          <div className={styles.actionBtns}>
            <button
              className={`${styles.saveBtn} ${isSaved ? styles.saveBtnDone : ''}`}
              onClick={handleSave}
              disabled={isSaved}
            >
              {isSaved ? '✓ GUARDADA' : 'GUARDAR'}
            </button>
            <button
              className={`${styles.trashBtn} ${isTrashed ? styles.trashBtnDone : ''}`}
              onClick={handleTrash}
              disabled={isTrashed || isSaved}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <button className={styles.iconButton} onClick={downloadImage}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
        </div>
      )}

      {/* Saved to gallery modal */}
      {showSavedModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <p className={styles.modalText}>Imagen guardada en tu galería</p>
          </div>
        </div>
      )}

      {/* Censored content modal */}
      {showCensoredModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            <p className={styles.modalText}>Imagen Censurada</p>
            <p className={styles.modalSubtext}>Intente nuevamente con otra instrucción</p>
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