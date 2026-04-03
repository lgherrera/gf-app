// app/generate/image/page.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import styles from "./image.module.css";

const ASPECT_RATIOS = [
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "2:3",  value: "2:3"  },
];

const MODELS = [
  { label: "Seedream 4.5", value: "seedream",  sub: "ByteDance" },
  { label: "Seedream 5",   value: "seedream5", sub: "ByteDance · Lite" },
  { label: "Flux 2 Dev",   value: "flux2dev",  sub: "Black Forest Labs" },
  { label: "Flux 2 Max",   value: "flux2max",  sub: "Black Forest Labs" },
  { label: "Wan 2.5",      value: "wan25",     sub: "Alibaba" },
];

const RATIO_H: Record<string, number> = {
  "16:9": 9, "9:16": 16, "2:3": 3,
};
const RATIO_W: Record<string, number> = {
  "16:9": 16, "9:16": 9, "2:3": 2,
};

const EYE_COLORS = ["blue", "brown", "green", "cyan", "amber", "violet"];

interface GeneratedImage {
  url: string;
  prompt: string;
  ratio: string;
  seed: number | null;
}

export default function ImageGenerationPage() {
  const [prompt, setPrompt]                       = useState("");
  const [ratio, setRatio]                         = useState("9:16");
  const [model, setModel]                         = useState("seedream");
  const [seed, setSeed]                           = useState<string>("");
  const [referenceImages, setReferenceImages]     = useState<File[]>([]);
  const [referencePreviews, setReferencePreviews] = useState<string[]>([]);
  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState<string | null>(null);
  const [result, setResult]                       = useState<GeneratedImage | null>(null);
  const [dragOver, setDragOver]                   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isV5     = model === "seedream5";
  const showSeed = !isV5;
  const showRefs = model === "seedream";

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setReferenceImages((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => setReferencePreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  }, []);

  const removeImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
    setReferencePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError("Ingresa un prompt antes de generar."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const base64Images   = await Promise.all(referenceImages.map(toBase64));
      const parsedSeed     = seed.trim() !== "" ? parseInt(seed, 10) : undefined;
      const randomEyeColor = EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)];
      const enrichedPrompt = prompt.replace(/\b(cyan|blue|brown|green|amber|violet)\s+eyes\b/gi, `${randomEyeColor} eyes`)
        || `${prompt}, ${randomEyeColor} eyes`;

      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt:          enrichedPrompt,
          aspectRatio:     ratio,
          referenceImages: base64Images,
          seed:            parsedSeed,
          model,
        }),
      });
      const text = await res.text();
      let data: { url?: string; seed?: number | null; error?: string };
      try { data = JSON.parse(text); }
      catch { throw new Error(`Respuesta inválida: ${text.slice(0, 120)}`); }
      if (!res.ok) throw new Error(data.error || "Error al generar");
      if (!data.url) throw new Error("No se recibió URL de imagen");
      setResult({ url: data.url, prompt: enrichedPrompt, ratio, seed: data.seed ?? null });
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
      a.href = url; a.download = `generado-${Date.now()}.${format}`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement("a");
      a.href = result.url; a.download = `generado-${Date.now()}.${format}`; a.target = "_blank"; a.click();
    }
  };

  const previewAspect = `${RATIO_W[ratio]} / ${RATIO_H[ratio]}`;

  return (
    <div className={styles.page}>
      <div className={styles.titleBlock}>
        <h2 className={styles.pageTitle}>Generación de Imágenes</h2>
        <p className={styles.pageSubtitle}>IA · Texto a Imagen</p>
      </div>

      <div className={styles.controls}>

        {/* Model selector */}
        <div className={styles.field}>
          <label className={styles.label}>Modelo</label>
          <div className={styles.modelGrid}>
            {MODELS.map((m) => (
              <button
                key={m.value}
                className={`${styles.modelBtn} ${model === m.value ? styles.modelActive : ""}`}
                onClick={() => setModel(m.value)}
              >
                <span className={styles.modelLabel}>{m.label}</span>
                <span className={styles.modelSub}>{m.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div className={styles.field}>
          <label className={styles.label}>Prompt</label>
          <textarea
            className={styles.textarea}
            placeholder="Describe la imagen que quieres crear..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
          <div className={styles.charCount}>{prompt.length} caracteres</div>
        </div>

        {/* Aspect ratio */}
        <div className={styles.field}>
          <label className={styles.label}>Proporción</label>
          <div className={styles.ratioGrid}>
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r.value}
                className={`${styles.ratioBtn} ${ratio === r.value ? styles.ratioActive : ""}`}
                onClick={() => setRatio(r.value)}
              >
                <span className={styles.ratioLabel}>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Seed — hidden for v5 */}
        {showSeed && (
          <div className={styles.field}>
            <label className={styles.label}>
              Seed <span className={styles.optional}>(opcional — deja vacío para aleatorio)</span>
            </label>
            <div className={styles.seedRow}>
              <input
                type="number"
                className={styles.seedInput}
                placeholder="Ej: 1234567"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                min={0}
                max={2147483647}
              />
              {result && result.seed !== null && (
                <button
                  className={styles.seedCopy}
                  onClick={() => setSeed(String(result.seed))}
                  title="Reusar seed de la última generación"
                >
                  ↺ Reusar {result.seed}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Reference images — Seedream 4.5 only */}
        {showRefs && (
          <div className={styles.field}>
            <label className={styles.label}>
              Imágenes de referencia <span className={styles.optional}>(opcional)</span>
            </label>
            <div
              className={`${styles.dropZone} ${dragOver ? styles.dragOver : ""}`}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="image/*" multiple className={styles.hiddenInput} onChange={(e) => handleFiles(e.target.files)} />
              <span className={styles.dropIcon}>+</span>
              <span className={styles.dropText}>Arrastra o haz clic para subir referencias</span>
            </div>
            {referencePreviews.length > 0 && (
              <div className={styles.refGrid}>
                {referencePreviews.map((src, i) => (
                  <div key={i} className={styles.refItem}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Ref ${i + 1}`} className={styles.refImg} />
                    <button className={styles.removeBtn} onClick={() => removeImage(i)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <button className={styles.generateBtn} onClick={handleGenerate} disabled={loading}>
          {loading ? "Generando…" : "Generar imagen"}
        </button>
      </div>

      {/* Preview */}
      <div className={styles.previewFrame} style={{ aspectRatio: previewAspect }}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingDots}><span /><span /><span /></div>
            <p className={styles.loadingText}>Creando tu imagen…</p>
          </div>
        )}
        {result && !loading ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={result.url} alt={result.prompt} className={styles.resultImg} />
        ) : !loading ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✦</div>
            <p>Tu imagen aparecerá aquí</p>
          </div>
        ) : null}
      </div>

      {result && !loading && (
        <div className={styles.downloadBar}>
          {result.seed !== null
            ? <div className={styles.seedBadge}>Seed: {result.seed}</div>
            : <div className={styles.seedBadge}>Seed: auto</div>
          }
          <span className={styles.downloadLabel}>Descargar en HD</span>
          <div className={styles.downloadBtns}>
            <button className={styles.dlBtn} onClick={() => downloadImage("jpeg")}>JPEG</button>
            <button className={styles.dlBtn} onClick={() => downloadImage("png")}>PNG</button>
          </div>
        </div>
      )}
    </div>
  );
}