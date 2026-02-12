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