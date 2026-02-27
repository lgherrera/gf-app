// app/create/components/ImageApprovalStep.tsx
'use client';

import styles from '../create.module.css';

interface ImageApprovalStepProps {
  imageUrl: string | null;
  isGenerating: boolean;
  onApprove: () => void;
  onRegenerate: () => void;
  isSubmitting: boolean;
}

export default function ImageApprovalStep({
  imageUrl,
  isGenerating,
  onApprove,
  onRegenerate,
  isSubmitting,
}: ImageApprovalStepProps) {
  if (isGenerating) {
    return (
      <div className={styles.stepContainer}>
        <h2 className={styles.stepTitle}>Generando imagen…</h2>
        <p className={styles.stepSubtitle}>Esto puede tomar unos segundos</p>
        <div className={styles.imageSpinnerWrapper}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={styles.stepContainer}>
        <h2 className={styles.stepTitle}>Error</h2>
        <p className={styles.stepSubtitle}>No se pudo generar la imagen</p>
        <button
          className={styles.createButton}
          onClick={onRegenerate}
          type="button"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>¿Te gusta?</h2>
      <p className={styles.stepSubtitle}>Si no te convence, puedes generar otra</p>

      <div className={styles.imagePreviewWrapper}>
        <img
          src={imageUrl}
          alt="Preview"
          className={styles.imagePreview}
        />
      </div>

      <div className={styles.approvalButtons}>
        <button
          className={styles.regenerateButton}
          onClick={onRegenerate}
          disabled={isSubmitting}
          type="button"
        >
          Regenerar
        </button>
        <button
          className={styles.approveButton}
          onClick={onApprove}
          disabled={isSubmitting}
          type="button"
        >
          {isSubmitting ? 'Creando…' : 'Aprobar y Crear'}
        </button>
      </div>
    </div>
  );
}