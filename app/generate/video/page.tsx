// app/generate/video/page.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import styles from "./video.module.css";

const ASPECT_RATIOS = [
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "1:1",  value: "1:1"  },
];

const DURATIONS = [
  { label: "5s",  value: "5"  },
  { label: "10s", value: "10" },
];

const RESOLUTIONS = [
  { label: "720p",  value: "720p"  },
  { label: "1080p", value: "1080p" },
];

interface GeneratedVideo {
  url: string;
  prompt: string;
}

export default function VideoGenerationPage() {
  const [prompt, setPrompt]           = useState("");
  const [ratio, setRatio]             = useState("16:9");
  const [duration, setDuration]       = useState("5");
  const [resolution, setResolution]   = useState("720p");
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioFile, setAudioFile]     = useState<File | null>(null);
  const [audioName, setAudioName]     = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [result, setResult]           = useState<GeneratedVideo | null>(null);
  const [imageDragOver, setImageDragOver] = useState(false);
  const [audioDragOver, setAudioDragOver] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleAudioFile = useCallback((file: File) => {
    if (!file.type.startsWith("audio/")) return;
    setAudioFile(file);
    setAudioName(file.name);
  }, []);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError("Ingresa un prompt antes de generar."); return; }
    if (!imageFile)     { setError("Sube una imagen de referencia."); return; }

    setLoading(true); setError(null); setResult(null);

    try {
      const imageBase64 = await toBase64(imageFile);
      const audioBase64 = audioFile ? await toBase64(audioFile) : null;
      const audioMime   = audioFile?.type || "audio/mpeg";

      const res = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio: ratio,
          duration,
          resolution,
          imageBase64,
          imageMime: imageFile.type || "image/jpeg",
          audioBase64,
          audioMime,
        }),
      });

      const text = await res.text();
      let data: { url?: string; error?: string };
      try { data = JSON.parse(text); }
      catch { throw new Error(`Respuesta inválida: ${text.slice(0, 120)}`); }
      if (!res.ok) throw new Error(data.error || "Error al generar");
      if (!data.url) throw new Error("No se recibió URL de video");

      setResult({ url: data.url, prompt });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = async () => {
    if (!result) return;
    try {
      const res  = await fetch(result.url);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `video-${Date.now()}.mp4`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(result.url, "_blank");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.titleBlock}>
        <h2 className={styles.pageTitle}>Generación de Videos</h2>
        <p className={styles.pageSubtitle}>Wan 2.6 · fal.ai</p>
      </div>

      <div className={styles.controls}>

        {/* Reference image */}
        <div className={styles.field}>
          <label className={styles.label}>Imagen de referencia <span className={styles.required}>*</span></label>
          <div
            className={`${styles.dropZone} ${imageDragOver ? styles.dragOver : ""} ${imagePreview ? styles.hasImage : ""}`}
            onDrop={(e) => { e.preventDefault(); setImageDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f); }}
            onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
            onDragLeave={() => setImageDragOver(false)}
            onClick={() => imageInputRef.current?.click()}
          >
            <input ref={imageInputRef} type="file" accept="image/*" className={styles.hiddenInput} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
            {imagePreview ? (
              <div className={styles.imagePreviewWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Reference" className={styles.imagePreview} />
                <button className={styles.clearBtn} onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}>×</button>
              </div>
            ) : (
              <>
                <span className={styles.dropIcon}>🖼</span>
                <span className={styles.dropText}>Arrastra o haz clic para subir imagen</span>
              </>
            )}
          </div>
        </div>

        {/* Prompt */}
        <div className={styles.field}>
          <label className={styles.label}>Prompt de movimiento</label>
          <textarea
            className={styles.textarea}
            placeholder="Describe el movimiento o acción que quieres generar..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
          <div className={styles.charCount}>{prompt.length}/1500</div>
        </div>

        {/* Aspect ratio */}
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>Proporción</label>
            <div className={styles.pillGroup}>
              {ASPECT_RATIOS.map((r) => (
                <button key={r.value} className={`${styles.pill} ${ratio === r.value ? styles.pillActive : ""}`} onClick={() => setRatio(r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Duración</label>
            <div className={styles.pillGroup}>
              {DURATIONS.map((d) => (
                <button key={d.value} className={`${styles.pill} ${duration === d.value ? styles.pillActive : ""}`} onClick={() => setDuration(d.value)}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Resolución</label>
            <div className={styles.pillGroup}>
              {RESOLUTIONS.map((r) => (
                <button key={r.value} className={`${styles.pill} ${resolution === r.value ? styles.pillActive : ""}`} onClick={() => setResolution(r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audio */}
        <div className={styles.field}>
          <label className={styles.label}>Audio <span className={styles.optional}>(opcional · WAV / MP3 · máx 15MB)</span></label>
          <div
            className={`${styles.audioZone} ${audioDragOver ? styles.dragOver : ""}`}
            onDrop={(e) => { e.preventDefault(); setAudioDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleAudioFile(f); }}
            onDragOver={(e) => { e.preventDefault(); setAudioDragOver(true); }}
            onDragLeave={() => setAudioDragOver(false)}
            onClick={() => audioInputRef.current?.click()}
          >
            <input ref={audioInputRef} type="file" accept="audio/wav,audio/mp3,audio/mpeg" className={styles.hiddenInput} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAudioFile(f); }} />
            {audioName ? (
              <div className={styles.audioInfo}>
                <span className={styles.audioIcon}>♪</span>
                <span className={styles.audioName}>{audioName}</span>
                <button className={styles.clearBtn} onClick={(e) => { e.stopPropagation(); setAudioFile(null); setAudioName(null); }}>×</button>
              </div>
            ) : (
              <>
                <span className={styles.dropIcon}>♪</span>
                <span className={styles.dropText}>Arrastra o haz clic para subir audio</span>
              </>
            )}
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button className={styles.generateBtn} onClick={handleGenerate} disabled={loading}>
          {loading ? "Generando video…" : "Generar video"}
        </button>
      </div>

      {/* Result */}
      {(loading || result) && (
        <div className={styles.resultSection}>
          {loading && (
            <div className={styles.loadingBox}>
              <div className={styles.loadingDots}><span /><span /><span /></div>
              <p className={styles.loadingText}>Generando tu video… puede tardar 1-2 minutos</p>
            </div>
          )}
          {result && !loading && (
            <>
              <video
                src={result.url}
                className={styles.videoPlayer}
                controls
                autoPlay
                loop
                playsInline
              />
              <div className={styles.downloadBar}>
                <span className={styles.downloadLabel}>Video listo</span>
                <button className={styles.dlBtn} onClick={downloadVideo}>Descargar MP4</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}