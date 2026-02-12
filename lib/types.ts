// lib/types.ts

export interface Girlfriend {
    id: number
    name: string
    slug: string
    age: number
    occupation: string
    personality: string
    interests: string
    avatar_url: string
    intro_video_url: string | null
    created_at: string
    nsfw: boolean
    voice_id: string
    voice_settings: {
      stability: number
      similarity_boost: number
      style: number
      use_speaker_boost: boolean
    }
  }
  
  export interface Scenario {
    id: number
    girlfriend_id: number
    title: string
    description: string
    initial_message: string
    category: string
    created_at: string
  }
  
  export interface GirlfriendMedia {
    id: number
    girlfriend_id: number
    type: 'image' | 'video' | 'audio'
    url: string
    thumbnail_url?: string
    title?: string
    description?: string
    duration?: number
    created_at: string
  }
  
  export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
  }