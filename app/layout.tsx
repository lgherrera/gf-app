// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import '@/app/src/styles/theme.css';
import { APP_VARIANT, currentBrand } from '@/app/src/config/app-config';

export const metadata: Metadata = {
  title: currentBrand.name,
  description: currentBrand.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-variant={APP_VARIANT}>
      <body>
        {children}
      </body>
    </html>
  );
}
