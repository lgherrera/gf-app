// app/components/GFFooter.tsx
import styles from './GFFooter.module.css';

export default function GFFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.logoSection}>
          {/* Updated Logo Path and Alt Text */}
          <img 
            src="/gf_logo.jpg" 
            alt="GIRLFRIEND Logo" 
            className={styles.logo}
          />
        </div>
        
        <div className={styles.textSection}>
          <p className={styles.terms}>
            Terminos y condiciones
          </p>
          
          <p className={styles.compliance}>
            18 USC 257 Record Keeping Requirements Compliant
          </p>
          
          <p className={styles.copyright}>
            Copyright SexoTV / Todos los Derechos Reservados / 1300 South Miami Ave, FL, 33031, USA
          </p>
        </div>
      </div>
    </footer>
  );
}