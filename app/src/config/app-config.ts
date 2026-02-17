// src/config/app-config.ts
export type AppVariant = 'nsfw' | 'sfw'

export const APP_VARIANT = process.env.NEXT_PUBLIC_APP_VARIANT as AppVariant
export const isNSFW = APP_VARIANT === 'nsfw'
export const isSFW = APP_VARIANT === 'sfw'

export const brandConfig: Record<AppVariant, {
  name: string
  primaryColor: string
  logo: string
  tagline: string
  footer: {
    companyName: string
    compliance: string | null
    copyright: string
  }
}> = {
  nsfw: {
    name: 'AI Girlfriends',
    primaryColor: '#e60049',
    logo: '/gf_logo.jpg',
    tagline: 'Your AI Companion',
    footer: {
      companyName: 'GirlfriendAI',
      compliance: '18 USC 257 Record Keeping Requirements Compliant',
      copyright: 'Copyright TubeAI / Todos los Derechos Reservados / 1300 South Miami Ave, FL, 33031, USA',
    },
  },
  sfw: {
    name: 'AI Companions',
    primaryColor: '#348cd4',
    logo: '/friends_logo.jpg',
    tagline: 'Your AI Companion',
    footer: {
      companyName: 'CharlareAI',
      compliance: null,
      copyright: 'Copyright TubeAI / Todos los Derechos Reservados / 1400 South Miami Ave, FL, 33031, USA',
    },
  },
}

export const currentBrand = brandConfig[APP_VARIANT]