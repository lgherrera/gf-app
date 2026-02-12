// app/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const categories = [
    { name: 'Videos', href: '/gf/videos' },
    { name: 'Imagenes', href: '/gf/imagenes' },
    { name: 'Audios', href: '/gf/audios' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className={styles['sidebar-overlay']}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isOpen ? styles['sidebar-open'] : ''}`}>
        <div className={styles['sidebar-header']}>
          <h2>Categorías</h2>
          <button
            onClick={onClose}
            className={styles['sidebar-close-btn']}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <nav className={styles['sidebar-nav']}>
          <ul className={styles['sidebar-list']}>
            {categories.map((category) => (
              <li key={category.name}>
                <Link
                  href={category.href}
                  onClick={onClose}
                  className={styles['sidebar-link']}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}