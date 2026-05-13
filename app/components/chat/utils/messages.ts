// app/components/chat/utils/messages.ts

export const generateMessageId = (): string =>
    `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  export const personalizeLine = (line: string, name: string): string =>
    line.replace('[name]', name);