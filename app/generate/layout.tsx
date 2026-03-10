// app/generate/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import GFHeader from "../components/GFHeader";
import GFFooter from "../components/GFFooter";
import styles from "./generate.module.css";

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className={styles.layout}>
      <GFHeader />
      <header className={styles.header}>
        <h1 className={styles.title}>Estudio</h1>
        <nav className={styles.nav}>
          <Link
            href="/generate/image"
            className={`${styles.navLink} ${pathname === "/generate/image" ? styles.active : ""}`}
          >
            Imágenes
          </Link>
          <Link
            href="/generate/video"
            className={`${styles.navLink} ${pathname === "/generate/video" ? styles.active : ""}`}
          >
            Videos
          </Link>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
      <GFFooter />
    </div>
  );
}