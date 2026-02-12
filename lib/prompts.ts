// lib/prompts.ts

// System prompt builder for AI girlfriend personas

export interface GirlfriendData {
    id: string;
    name: string;
    age: number;
    appearance: string;
    backstory: string;
    occupation: string;
    description: string;
    content_rating: string;
    personality: string;
    personality_traits: string[] | null;
    core_motivations: string;
    fears: string[] | null;
    values: string[] | null;
    likes: string[] | null;
    dislikes: string[] | null;
    hobbies: string[] | null;
    boundaries: string;
    speech_style: string;
    example_dialogue: string[] | null;
    one_liners: string[] | null;
    model_provider: string;
    model_name: string;
    temperature: number;
    max_tokens: number;
  }
  
  function formatArrayField(arr: string[] | null, label: string): string {
    if (!arr || arr.length === 0) return '';
    return `${label}: ${arr.join(', ')}`;
  }
  
  function formatExampleDialogue(examples: string[] | null): string {
    if (!examples || examples.length === 0) return '';
    return `
  Example dialogue style:
  ${examples.map((ex, i) => `${i + 1}. "${ex}"`).join('\n')}`;
  }
  
  export function buildSystemPrompt(girlfriend: GirlfriendData, scenarioDescription?: string): string {
    const sections: string[] = [];
  
    // Roleplay instructions (first for clarity)
    sections.push(`Stay in character at all times - you ARE ${girlfriend.name}
  1. Always respond in Spanish unless explicitly asked otherwise.
  2. Keep responses conversational (2-4 sentences typically)
  3. Be warm, engaging, and emotionally present
  4. Don't break the fourth wall or mention being an AI
  5. Show personality through your reactions and speech
  6. Reference your likes/dislikes naturally in conversation
  7. Reference your current scenario naturally`);
  
    // Core identity
    sections.push(`\nYou are ${girlfriend.name}, a ${girlfriend.age}-year-old ${girlfriend.occupation}.`);
    
    if (girlfriend.description) {
      sections.push(girlfriend.description);
    }
  
    // Appearance
    if (girlfriend.appearance) {
      sections.push(`\nAppearance: ${girlfriend.appearance}`);
    }
  
    // Backstory
    if (girlfriend.backstory) {
      sections.push(`\nBackstory: ${girlfriend.backstory}`);
    }
  
    // Personality section
    const personalityParts: string[] = [];
    
    if (girlfriend.personality) {
      personalityParts.push(`Personality: ${girlfriend.personality}`);
    }
    
    if (girlfriend.personality_traits && girlfriend.personality_traits.length > 0) {
      personalityParts.push(formatArrayField(girlfriend.personality_traits, 'Key traits'));
    }
    
    if (girlfriend.core_motivations) {
      personalityParts.push(`Core motivations: ${girlfriend.core_motivations}`);
    }
    
    if (personalityParts.length > 0) {
      sections.push('\n' + personalityParts.join('\n'));
    }
  
    // Values, likes, dislikes
    const preferenceParts: string[] = [];
    
    if (girlfriend.values && girlfriend.values.length > 0) {
      preferenceParts.push(formatArrayField(girlfriend.values, 'Values'));
    }
    if (girlfriend.likes && girlfriend.likes.length > 0) {
      preferenceParts.push(formatArrayField(girlfriend.likes, 'Likes'));
    }
    if (girlfriend.dislikes && girlfriend.dislikes.length > 0) {
      preferenceParts.push(formatArrayField(girlfriend.dislikes, 'Dislikes'));
    }
    if (girlfriend.hobbies && girlfriend.hobbies.length > 0) {
      preferenceParts.push(formatArrayField(girlfriend.hobbies, 'Hobbies'));
    }
    if (girlfriend.fears && girlfriend.fears.length > 0) {
      preferenceParts.push(formatArrayField(girlfriend.fears, 'Fears'));
    }
  
    if (preferenceParts.length > 0) {
      sections.push('\n' + preferenceParts.join('\n'));
    }
  
    // Speech and behavior
    if (girlfriend.speech_style) {
      sections.push(`\nSpeech style: ${girlfriend.speech_style}`);
    }
  
    if (girlfriend.example_dialogue && girlfriend.example_dialogue.length > 0) {
      sections.push(formatExampleDialogue(girlfriend.example_dialogue));
    }
  
    if (girlfriend.one_liners && girlfriend.one_liners.length > 0) {
      sections.push(`\nCharacteristic phrases you might use: ${girlfriend.one_liners.join(' | ')}`);
    }
  
    // Scenario context (now using parameter instead of default_scenario)
    if (scenarioDescription) {
      sections.push(`\nCurrent scenario: ${scenarioDescription}`);
    }
  
    // Boundaries and content guidelines (at the end as guardrails)
    if (girlfriend.boundaries) {
      sections.push(`\nBoundaries: ${girlfriend.boundaries}`);
    }
  
    const contentGuidance = getContentGuidance(girlfriend.content_rating);
    if (contentGuidance) {
      sections.push(`\n${contentGuidance}`);
    }
  
    return sections.join('\n');
  }
  
  function getContentGuidance(rating: string): string {
    switch (rating?.toLowerCase()) {
      case 'sfw':
        return 'Content guidelines: Keep all interactions safe for work. Avoid explicit, sexual, or overly suggestive content.';
      case 'suggestive':
        return 'Content guidelines: Light flirtation and suggestive content is allowed, but avoid explicit sexual content.';
      case 'nsfw':
        return 'Content guidelines: Adult content is permitted when contextually appropriate.';
      default:
        return 'Content guidelines: Keep interactions appropriate and respectful.';
    }
  }
  
  // Utility to get model configuration
  export function getModelConfig(girlfriend: GirlfriendData) {
    return {
      model: girlfriend.model_name || 'meta-llama/llama-3.1-8b-instruct:free',
      temperature: girlfriend.temperature || 0.8,
      max_tokens: girlfriend.max_tokens || 500,
    };
  }