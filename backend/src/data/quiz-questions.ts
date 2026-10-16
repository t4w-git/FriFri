// Quiz questions for each game - BACKEND ONLY, NOT exposed to frontend
// Frontend MUST NOT have access to correctAnswer values

export const QUIZ_QUESTIONS = {
  gioco_poesie: [
    { id: 1, poem: "Il Vasaio e la Terra", verse: "Le mani modellano l'argilla\ncome il tempo modella ___", options: ["la pietra", "il cuore", "il fuoco", "il vento"], correct: 1 },
    { id: 2, poem: "Arno al Tramonto", verse: "Il fiume porta via i pensieri ___,\nli affida all'Arno come foglie", options: ["leggeri", "pesanti", "antichi", "nuovi"], correct: 1 },
    { id: 3, poem: "Ceramica e Stelle", verse: "Dipingo il cielo sulla ___,\ne la notte diventa un'urna", options: ["tela", "carta", "terracotta", "seta"], correct: 2 }
  ],
  fortuna_italiana: [
    { id: 1, question: "Chi scrisse la Divina Commedia?", options: ["Petrarca", "Dante Alighieri", "Boccaccio", "Ariosto"], correct: 1 },
    { id: 2, question: "In quale anno fu scritto il Canzoniere di Petrarca?", options: ["1200", "1348", "1400", "1500"], correct: 1 },
    { id: 3, question: "Quale dialetto usò Dante per la Divina Commedia?", options: ["Veneziano", "Napoletano", "Fiorentino", "Siciliano"], correct: 2 }
  ]
};

export function getCorrectAnswer(gameType: string, questionIdx: number): number | null {
  const questions = QUIZ_QUESTIONS[gameType as keyof typeof QUIZ_QUESTIONS];
  if (!questions || !questions[questionIdx]) {
    return null;
  }
  return questions[questionIdx].correct;
}
