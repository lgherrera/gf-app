// app/components/chat/hooks/useChatHistory.ts

import { useState, useEffect } from 'react';
import { Message } from '../utils/types';

interface ChatHistoryResult {
  historyMessages: Message[];
  hasHistory: boolean;
  isLoadingHistory: boolean;
}

export function useChatHistory(
  userId: string | null,
  girlfriendId: string
): ChatHistoryResult {
  const [historyMessages, setHistoryMessages] = useState<Message[]>([]);
  const [hasHistory, setHasHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    if (!userId) {
      // Don't flip isLoadingHistory to false yet — userId may still be resolving.
      // Only mark as done if we're sure there's no user (empty string vs null).
      return;
    }

    setIsLoadingHistory(true);

    const loadHistory = async () => {
      try {
        const res = await fetch(
          `/api/chat-history?userId=${userId}&girlfriendId=${girlfriendId}&limit=30`
        );
        const data = await res.json();

        if (data.messages && data.messages.length > 0) {
          const messages: Message[] = data.messages.map(
            (msg: { id: string; role: 'user' | 'assistant'; content: string; created_at: string }) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.created_at),
            })
          );
          setHistoryMessages(messages);
          setHasHistory(true);
        }
      } catch (err) {
        console.error('Error loading chat history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [userId, girlfriendId]);

  return { historyMessages, hasHistory, isLoadingHistory };
}