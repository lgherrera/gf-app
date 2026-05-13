// app/components/chat/utils/types.ts

export interface Girlfriend {
    id: string;
    slug: string;
    name: string;
    age: number;
    image_url?: string;
    avatar?: string;
    hello_url?: string;
    hello_poster_url?: string;
    voice_provider?: string;
    voice_model?: string;
    voice_id?: string;
    occupation?: string;
    gender?: string;
    style?: string;
    nationality?: string;
    personality_traits?: string[] | null;
    hobbies?: string[] | null;
    likes?: string[] | null;
    fears?: string[] | null;
    boundaries?: string[] | null;
  }
  
  export interface OpeningScene {
    id: string;
    scene_name: string;
    opening_line: string;
    mood: string | null;
    audio_slug: string | null;
    content_rating: string;
  }
  
  export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    imageUrl?: string;
    audioUrl?: string;
  }
  
  export interface ChatInterfaceProps {
    girlfriend: Girlfriend;
  }