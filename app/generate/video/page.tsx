// app/generate/video/page.tsx
"use client";

import styles from "./video.module.css";

export default function VideoGenerationPage() {
  return (
    <div className={styles.page}>
      <div className={styles.titleBlock}>
        <h2 className={styles.pageTitle}>Generación de Videos</h2>
        <p className={styles.pageSubtitle}>Próximamente</p>
      </div>
      <div className={styles.comingSoon}>
        <div className={styles.icon}>▶</div>
        <p className={styles.text}>La generación de videos estará disponible pronto.</p>
      </div>
    </div>
  );
}