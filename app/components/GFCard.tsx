// app/components/GFCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import styles from './GFCard.module.css';

interface GFCardProps {
  id: string;
  slug: string;
  name: string;
  age: number;
  description: string;
  image_url: string;
}

export default function GFCard({ 
  id, 
  slug,
  name, 
  age, 
  description, 
  image_url
}: GFCardProps) {
  
  const chatUrl = `/${slug}/chat`;

  return (
    <div className={styles.card}>
      <Link href={chatUrl} className={styles.imageContainer} style={{ display: 'block' }}>
        <Image
          src={image_url}
          alt={`${name}, ${age}`}
          fill
          sizes="(max-width: 500px) 100vw, 500px"
          className={styles.image}
          priority
        />
        
        {/* CHATEA badge */}
        <div className={styles.chateaBadge}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={styles.chateaIcon}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
          </svg>
          CHATEA
        </div>
        
        {/* Gradient overlay for text readability */}
        <div className={styles.gradient} />
        
        {/* Text overlay at bottom of image */}
        <div className={styles.textOverlay}>
          <h2 className={styles.name}>{name}, {age}</h2>
          <p className={styles.description}>{description}</p>
        </div>
      </Link>
    </div>
  );
}