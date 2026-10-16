/**
 * Game Logic Helpers - Based 100% on legacy implementation
 */

import prisma from '../db/client.js';

// Extract a specific part (0-2) from poem quartine
export const getPoemPart = (poemText: string, _partIndex: 0 | 1 | 2): string => {
  // For legacy compatibility - if poem has partA/partB/partC, use those
  // Otherwise try to parse text
  return poemText || '';
};

/**
 * FORTUNA ITALIANA LOGIC
 * Win if: same poem + 3 different parts (0,1,2) in order
 */

interface PoemSlot {
  poemId: string;
  title: string;
  text: string;
  partIndex: 0 | 1 | 2;
}

export const generateFortunaItalianaSlots = (poems: any[], forceWin: boolean = false): PoemSlot[] => {
  if (!poems.length) return [];

  if (forceWin) {
    // Generate winning combination: same poem, all 3 parts in order
    const winPoem = poems[Math.floor(Math.random() * poems.length)];
    return [
      { poemId: winPoem.id, title: winPoem.title, text: winPoem.text, partIndex: 0 },
      { poemId: winPoem.id, title: winPoem.title, text: winPoem.text, partIndex: 1 },
      { poemId: winPoem.id, title: winPoem.title, text: winPoem.text, partIndex: 2 },
    ];
  }

  // Generate random slots
  return Array(3).fill(null).map(() => {
    const poem = poems[Math.floor(Math.random() * poems.length)];
    return {
      poemId: poem.id,
      title: poem.title,
      text: poem.text,
      partIndex: Math.floor(Math.random() * 3) as 0 | 1 | 2,
    };
  });
};

export const isFortunaItalianaWin = (slots: any[]): boolean => {
  if (!slots || slots.length !== 3) return false;

  // All must be same poem
  const samePoem = slots.every(s => s.title === slots[0].title);
  if (!samePoem) return false;

  // All 3 parts must be different
  const partIndices = new Set(slots.map(s => s.partIndex));
  if (partIndices.size !== 3) return false;

  // Must be in order: 0, 1, 2
  const partsSorted = slots.map(s => s.partIndex).sort().join(',');
  return partsSorted === '0,1,2';
};

/**
 * FORTUNA MONTELUPO LOGIC
 * Win if: slot2 text === slot1 text (same poem part)
 */

export const generateFortunaMontelupoSlots = (poems: any[], forceWin: boolean = false): PoemSlot[] => {
  if (!poems.length) return [];

  const slot1 = {
    poemId: poems[0].id,
    title: poems[0].title,
    text: poems[0].text,
    partIndex: Math.floor(Math.random() * 3) as 0 | 1 | 2,
  };

  let slot2: PoemSlot;

  if (forceWin) {
    // Slot2 must be identical to slot1
    slot2 = { ...slot1 };
  } else {
    // Random slot2
    const poem = poems[Math.floor(Math.random() * poems.length)];
    slot2 = {
      poemId: poem.id,
      title: poem.title,
      text: poem.text,
      partIndex: Math.floor(Math.random() * 3) as 0 | 1 | 2,
    };
  }

  return [slot1, slot2];
};

export const isFortunaMontelupoWin = (slot1: any, slot2: any): boolean => {
  if (!slot1 || !slot2) return false;
  // Win if same poem part text
  return getPoemPart(slot1.text, slot1.partIndex) === getPoemPart(slot2.text, slot2.partIndex);
};

/**
 * GIOCO POESIE LOGIC
 * Select random poem, pick one quartina, ask user which one it is (A/B/C)
 */

export const generateGiocoPoesieQuiz = async () => {
  try {
    // Get ALL poems with all 3 quartine (no limit)
    const poemsWithAllQuartine = await prisma.poem.findMany({
      where: {
        active: true,
        partA: { not: null },
        partB: { not: null },
        partC: { not: null },
      },
    });

    console.log('DEBUG: poems with all quartine found:', poemsWithAllQuartine.length);

    if (!poemsWithAllQuartine.length) {
      return null;
    }

    // Select a RANDOM poem from all available
    const randomPoem = poemsWithAllQuartine[Math.floor(Math.random() * poemsWithAllQuartine.length)];
    
    const quartine = [
      { label: 'A', text: randomPoem.partA },
      { label: 'B', text: randomPoem.partB },
      { label: 'C', text: randomPoem.partC },
    ];
    
    // Select a random quartina to show
    const correctIndex = Math.floor(Math.random() * 3);
    const selectedQuartina = quartine[correctIndex];

    return {
      poemId: randomPoem.id,
      poemTitle: randomPoem.title,
      poemAuthor: randomPoem.author,
      question: `Quale quartina è questa da "${randomPoem.title}" di ${randomPoem.author || 'autore sconosciuto'}?`,
      quartina: selectedQuartina.text,  // The text to display
      options: ['A', 'B', 'C'],  // Answer options
      correctAnswerIndex: correctIndex,  // Which one was correct (0=A, 1=B, 2=C)
    };
  } catch (error) {
    console.error('Error generating gioco poesie quiz:', error);
    return null;
  }
};
