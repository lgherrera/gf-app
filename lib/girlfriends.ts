// lib/girlfriends.ts
import { supabase } from './supabase';

const CONTENT_MODE = process.env.NEXT_PUBLIC_CONTENT_MODE as string;

export function withContentFilter(query: any) {
  return query.eq('content_rating', CONTENT_MODE);
}