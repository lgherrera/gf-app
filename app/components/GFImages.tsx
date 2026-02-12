// app/components/GFImages.tsx

import Image from 'next/image';
import styles from './GFImages.module.css';

interface GFImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface GFImagesProps {
  images: GFImage[];
}

export default function GFImages({ images }: GFImagesProps) {
  // Sort images by display_order
  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className={styles.container}>
      <div className={styles.imageGrid}>
        {sortedImages.map((image) => (
          <div key={image.id} className={styles.imageWrapper}>
            <Image
              src={image.image_url}
              alt="Girlfriend image"
              fill
              className={styles.image}
              sizes="100vw"
            />
          </div>
        ))}
      </div>
    </div>
  );
}