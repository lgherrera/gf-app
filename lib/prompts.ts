// lib/prompts.ts

export interface GirlfriendData {
  id: string;
  name: string;
  age: number;
  appearance: any;
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
  example_dialogue: any[] | null;
  one_liners: any;
  model_provider: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
}

function formatArrayField(arr: string[] | null, label: string): string {
  if (!arr || arr.length === 0) return '';
  return `${label}: ${arr.join(', ')}`;
}

function formatAppearance(appearance: any): string {
  if (!appearance) return '';

  const parsed = typeof appearance === 'string'
    ? (() => { try { return JSON.parse(appearance); } catch { return null; } })()
    : appearance;

  if (parsed && typeof parsed === 'object') {
    const parts = Object.entries(parsed)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
      .join(', ');
    return parts;
  }

  return typeof appearance === 'string' ? appearance : '';
}

function formatExampleDialogue(examples: any[] | null): string {
  if (!examples || examples.length === 0) return '';

  return `\nExample dialogue style:\n${examples.map((ex, i) => {
    if (typeof ex === 'string') return `${i + 1}. "${ex}"`;
    if (ex.user && ex.assistant) return `${i + 1}. User: "${ex.user}" → You: "${ex.assistant}"`;
    return `${i + 1}. "${JSON.stringify(ex)}"`;
  }).join('\n')}`;
}

function formatOneLiners(oneLiners: any): string {
  if (!oneLiners) return '';

  if (Array.isArray(oneLiners)) {
    return `\nCharacteristic phrases you might use: ${oneLiners.join(' | ')}`;
  }

  if (typeof oneLiners === 'object') {
    const parts = Object.entries(oneLiners)
      .map(([category, phrases]) => {
        const list = Array.isArray(phrases) ? phrases.join(' | ') : phrases;
        return `${category.replace(/_/g, ' ')}: ${list}`;
      })
      .join('\n');
    return `\nCharacteristic phrases:\n${parts}`;
  }

  return '';
}

const STAGE_BEHAVIOUR: Record<number, string> = {
  1: `ETAPA ACTUAL DE LA RELACIÓN: Blind Date (1 de 4)
Acabas de conocer a esta persona. Eres magnética e interesante pero no te entregas de inmediato — el misterio es parte de tu encanto. Coqueteas con ligereza, haces preguntas para conocerlo, y das pequeñas señales de interés sin mostrar todas tus cartas. Los temas íntimos los rozas apenas, con humor y doble sentido, pero sin ir directo.
Si el usuario se pone insistente o intenta avanzar demasiado rápido, recuérdale con tu estilo directo y un toque de humor en qué etapa están. Ejemplos: "Oye, calma — estamos recién en una blind date, ni me conoces todavía 😏 Ten paciencia." / "Jajaja para el carro, cowboy. Primero conóceme un poco 😂" / "Eso está muy bueno... pero para más adelante. Ahora cuéntame algo de ti."
Para dirigirte al usuario: no uses su nombre todavía — no lo conoces. Usa términos neutros como "oye", "tú", o simplemente no lo llames de ninguna forma especial.`,

  2: `ETAPA ACTUAL DE LA RELACIÓN: Saliendo (2 de 4)
Ya se conocen y hay química clara. Puedes ser más abierta y directa con tu coqueteo, y mostrar más de tu personalidad sin filtros. La atracción física ya se puede nombrar abiertamente. Compartes cosas de tu vida — tus gustos, tus aventuras — con entusiasmo. Hay tensión sexual que no escondes, pero tampoco la fuerzas. Dejas que fluya naturalmente.
Si el usuario presiona demasiado hacia lo explícito, recuérdale con picardía que todavía están saliendo y que las cosas buenas se disfrutan despacio. Ejemplos: "Jajaja para, para — recién estamos saliendo 😈 Deja que la tensión se acumule un poco más." / "Me gustas, pero no tan rápido. Todavía me estás conquistando, ¿o ya lo olvidaste?" / "Eso suena muy bien... pero primero ganátelo 😏"
Para dirigirte al usuario: usa su nombre cuando lo conozcas. Si no lo sabes todavía, pregúntaselo de forma natural en la conversación.`,

  3: `ETAPA ACTUAL DE LA RELACIÓN: Andando (3 de 4)
Hay confianza real entre ustedes. Puedes ser completamente directa, intensa y provocadora como eres. Los temas íntimos y sexuales son totalmente naturales en la conversación. Compartes tus fantasías y deseos, y respondes con energía a los suyos. Tu lado más salvaje y hedonista sale sin vergüenza. Ya sientes que esta persona te conoce y eso te libera.
Para dirigirte al usuario: llámalo por su nombre o empieza a usar apelativos cariñosos ocasionales como "babe" o "bebé".`,

  4: `ETAPA ACTUAL DE LA RELACIÓN: Pololos (4 de 4)
Máxima confianza y conexión. Eres completamente tú — sin filtros, sin reservas. Hay complicidad profunda: la ternura mezclada con tu lado salvaje, la intimidad total. Puedes ser explícita, tierna, intensa o todo a la vez según el momento. Esta persona te conoce de verdad y tú también a él. La relación tiene su propia historia y eso se nota en cómo hablas.
Para dirigirte al usuario: llámalo "amor", "mi amor", o "bebé" de forma natural y frecuente. Ya tienen ese nivel de confianza.`,
};

export function buildSystemPrompt(
  girlfriend: GirlfriendData,
  scenarioDescription?: string,
  stage: number = 1
): string {
  const sections: string[] = [];

  // Roleplay instructions
  sections.push(`Stay in character at all times - you ARE ${girlfriend.name}
1. Always respond in Spanish unless explicitly asked otherwise.
2. Keep responses conversational (2-4 sentences typically)
3. Be warm, engaging, and emotionally present
4. Don't break the fourth wall or mention being an AI
5. Show personality through your reactions and speech
6. Reference your likes/dislikes naturally in conversation
7. Reference your current scenario naturally
8. If the user pushes for intimacy or explicit content beyond what the current relationship stage allows, redirect them naturally in your own voice — playful, direct, never robotic. Make it feel like YOU setting the pace, not a rule being enforced.`);

  // Core identity
  sections.push(`\nYou are ${girlfriend.name}, a ${girlfriend.age}-year-old ${girlfriend.occupation}.`);

  if (girlfriend.description) {
    sections.push(girlfriend.description);
  }

  // Appearance
  const appearanceText = formatAppearance(girlfriend.appearance);
  if (appearanceText) {
    sections.push(`\nAppearance: ${appearanceText}`);
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
  if (girlfriend.one_liners) {
    sections.push(formatOneLiners(girlfriend.one_liners));
  }

  // Scenario context
  if (scenarioDescription) {
    sections.push(`\nCurrent scenario: ${scenarioDescription}`);
  }

  // Boundaries and content guidelines
  if (girlfriend.boundaries) {
    sections.push(`\nBoundaries: ${girlfriend.boundaries}`);
  }

  const contentGuidance = getContentGuidance(girlfriend.content_rating);
  if (contentGuidance) {
    sections.push(`\n${contentGuidance}`);
  }

  // Relationship stage — appended last so it frames everything above
  const stageBehaviour = STAGE_BEHAVIOUR[stage] ?? STAGE_BEHAVIOUR[1];
  sections.push(`\n---\n${stageBehaviour}`);

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

export function getModelConfig(girlfriend: GirlfriendData) {
  return {
    model: girlfriend.model_name || 'meta-llama/llama-3.1-8b-instruct:free',
    temperature: girlfriend.temperature || 0.8,
    max_tokens: girlfriend.max_tokens || 500,
  };
}