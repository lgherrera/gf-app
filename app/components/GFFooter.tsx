// app/components/GFFooter.tsx
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
          <p className={styles.terms}>
            Terminos y condiciones
          </p>
          
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