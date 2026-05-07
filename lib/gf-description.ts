// lib/gf-description.ts

interface GirlfriendDescriptionData {
  name: string;
  age: number;
  occupation: string;
  nationality: string | null;
  personality_traits: string[] | null;
  hobbies: string[] | null;
  likes: string[] | null;
  boundaries: string[] | null;
}

export function generateDescription(girlfriend: GirlfriendDescriptionData): string {
  const nationality = girlfriend.nationality || 'Chilena';
  const traits = girlfriend.personality_traits?.slice(0, 3).join(', ') || '';
  const hobby = girlfriend.hobbies?.[0] || '';
  const like = girlfriend.likes?.[0] || '';
  const boundary = girlfriend.boundaries?.[0] || '';

  let desc = `${girlfriend.name} es una ${nationality.toLowerCase()} de ${girlfriend.age} años que trabaja como ${girlfriend.occupation.toLowerCase()}.`;

  if (traits) {
    desc += ` Es ${traits}.`;
  }

  if (hobby && like) {
    desc += ` Le encanta ${hobby.toLowerCase()} y disfruta de ${like.toLowerCase()}.`;
  } else if (hobby) {
    desc += ` Le encanta ${hobby.toLowerCase()}.`;
  }

  if (boundary) {
    desc += ` Tiene claro que no acepta ${boundary.toLowerCase()}.`;
  }

  return desc;
}