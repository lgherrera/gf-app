// app/generate/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./generate.module.css";

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.title}>Estudio Creativo</h1>
          <nav className={styles.nav}>
            <Link
              href="/generate/image"
              className={`${styles.navLink} ${
                pathname === "/generate/image" ? styles.active : ""
              }`}
            >
              <span className={styles.navIcon}>✦</span>
              Imágenes
            </Link>
            <Link
              href="/generate/video"
              className={`${styles.navLink} ${
                pathname === "/generate/video" ? styles.active : ""
              }`}
            >
              <span className={styles.navIcon}>▶</span>
              Videos
            </Link>
          </nav>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}