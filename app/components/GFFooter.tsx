// app/components/GFFooter.tsx
import Link from 'next/link';
import styles from './GFFooter.module.css';
import { currentBrand } from '@/app/src/config/app-config';

export default function GFFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.logoSection}>
          <img 
            src={currentBrand.logo} 
            alt={`${currentBrand.name} Logo`} 
            className={styles.logo}
          />
        </div>
        
        <div className={styles.textSection}>
          <Link href="/terms" className={styles.terms}>
            Términos y condiciones
          </Link>
          
          {currentBrand.footer.compliance && (
            <p className={styles.compliance}>
              {currentBrand.footer.compliance}
            </p>
          )}
          
          <p className={styles.copyright}>
            {currentBrand.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}