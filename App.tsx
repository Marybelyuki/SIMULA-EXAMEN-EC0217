
import React, { useState, useCallback } from 'react';
import { AppState, Question, ExamResult } from './types';
import { generateExamQuestions } from './geminiService';
import Lobby from './components/Lobby';
import ExamView from './components/ExamView';
import ResultsView from './components/ResultsView';
import LoadingScreen from './components/LoadingScreen';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppState>(AppState.LOBBY);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startNewExam = async () => {
    setCurrentStep(AppState.GENERATING);
    setError(null);
    try {
      const newQuestions = await generateExamQuestions();
      setQuestions(newQuestions);
      setCurrentStep(AppState.EXAM);
    } catch (err) {
      console.error(err);
      setError("Hubo un error al generar las preguntas. Por favor, intenta de nuevo.");
      setCurrentStep(AppState.LOBBY);
    }
  };

  const finishExam = (userAnswers: { questionId: number, selectedOption: number, isCorrect: boolean }[]) => {
    const score = userAnswers.filter(a => a.isCorrect).length;
    const finalResult: ExamResult = {
      score,
      totalQuestions: questions.length,
      answers: userAnswers,
      date: new Date().toLocaleString()
    };
    setResult(finalResult);
    setCurrentStep(AppState.RESULTS);
  };

  const goToLobby = () => {
    setCurrentStep(AppState.LOBBY);
    setQuestions([]);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-700">
      {currentStep === AppState.LOBBY && (
        <Lobby onStart={startNewExam} error={error} />
      )}
      
      {currentStep === AppState.GENERATING && (
        <LoadingScreen />
      )}
      
      {currentStep === AppState.EXAM && questions.length > 0 && (
        <ExamView questions={questions} onFinish={finishExam} onCancel={goToLobby} />
      )}
      
      {currentStep === AppState.RESULTS && result && (
        <ResultsView result={result} questions={questions} onRestart={startNewExam} onHome={goToLobby} />
      )}
    </div>
  );
};

export default App;
