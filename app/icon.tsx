// app/icon.tsx
import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  const isNSFW = process.env.NEXT_PUBLIC_APP_SOURCE === 'nsfw'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          background: isNSFW ? '#e60049' : '#348cd4',
          color: 'white',
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        P
      </div>
    ),
    { ...size }
  )
}