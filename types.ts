
export interface Question {
  id: number;
  topic: string;
  statement: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface ExamResult {
  score: number;
  totalQuestions: number;
  answers: {
    questionId: number;
    selectedOption: number;
    isCorrect: boolean;
  }[];
  date: string;
}

export enum AppState {
  LOBBY = 'LOBBY',
  GENERATING = 'GENERATING',
  EXAM = 'EXAM',
  RESULTS = 'RESULTS'
}
