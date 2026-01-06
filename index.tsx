import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from '@google/genai';

// --- CONFIGURACIÓN DE IA ---
const fetchQuestions = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const prompt = `
    Genera un examen de 20 preguntas de opción múltiple para la certificación CONOCER EC0201.01 (Diseño de cursos).
    
    REQUISITOS:
    1. Lenguaje Técnico: Sujeto, Acción, Condición de Operación, Taxonomía de Bloom.
    2. Complejidad: Casos de análisis sobre Carta Descriptiva, Manuales e Instrumentos de Evaluación.
    3. Estilo: Formal, tipo STPS.
    4. Formato: 4 opciones por pregunta.
    
    Estructura JSON: array de objetos con topic, statement, options, correctAnswerIndex (0-3), explanation.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            statement: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["topic", "statement", "options", "correctAnswerIndex", "explanation"]
        }
      }
    }
  });

  return JSON.parse(response.text);
};

// --- COMPONENTES ---

const App = () => {
  const [view, setView] = useState<'lobby' | 'loading' | 'exam' | 'results'>('lobby');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);

  const startExam = async () => {
    setError(null);
    setView('loading');
    try {
      const data = await fetchQuestions();
      setQuestions(data.map((q: any, i: number) => ({ ...q, id: i })));
      setView('exam');
      setCurrentIdx(0);
      setAnswers({});
    } catch (e: any) {
      setError("Error al conectar con la IA. Verifica tu API Key o conexión.");
      setView('lobby');
    }
  };

  const handleFinish = () => setView('results');

  // VISTA: CARGA
  if (view === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-slate-800">Generando Reactivos Técnicos</h2>
        <p className="text-slate-500 mt-2">La IA está diseñando tu examen EC0201.01 personalizado...</p>
      </div>
    );
  }

  // VISTA: RESULTADOS
  if (view === 'results') {
    const score = questions.filter((q, i) => answers[i] === q.correctAnswerIndex).length;
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 animate-slide">
        <div className={`p-12 rounded-[2rem] text-center text-white mb-10 ${percentage >= 80 ? 'bg-green-600' : 'bg-indigo-600'}`}>
          <h2 className="text-6xl font-black mb-2">{percentage}%</h2>
          <p className="text-xl font-bold uppercase tracking-widest">
            {percentage >= 80 ? 'Competencia Lograda' : 'Todavía no competente'}
          </p>
          <p className="mt-4 opacity-80">Aciertos: {score} de {questions.length}</p>
          <div className="mt-8 flex justify-center gap-4">
            <button onClick={startExam} className="px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all">Reintentar</button>
            <button onClick={() => setView('lobby')} className="px-8 py-3 bg-black/20 text-white font-bold rounded-xl hover:bg-black/30 transition-all">Inicio</button>
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-6">Revisión del Examen</h3>
        <div className="space-y-6">
          {questions.map((q, i) => (
            <div key={i} className={`p-8 bg-white rounded-3xl border-l-8 shadow-sm ${answers[i] === q.correctAnswerIndex ? 'border-green-500' : 'border-red-500'}`}>
              <div className="flex justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{q.topic}</span>
                <span className={`text-xs font-bold ${answers[i] === q.correctAnswerIndex ? 'text-green-600' : 'text-red-600'}`}>
                  {answers[i] === q.correctAnswerIndex ? 'CORRECTO' : 'INCORRECTO'}
                </span>
              </div>
              <p className="text-lg font-bold text-slate-800 mb-6">{q.statement}</p>
              <div className="space-y-2 mb-6">
                {q.options.map((opt: string, oi: number) => (
                  <div key={oi} className={`p-4 rounded-xl text-sm border ${oi === q.correctAnswerIndex ? 'bg-green-50 border-green-200 text-green-800 font-bold' : oi === answers[i] ? 'bg-red-50 border-red-200 text-red-800' : 'bg-slate-50 border-transparent text-slate-500 opacity-60'}`}>
                    {String.fromCharCode(65 + oi)}. {opt}
                  </div>
                ))}
              </div>
              <div className="p-4 bg-slate-900 text-slate-300 rounded-xl text-sm italic border-l-4 border-indigo-500">
                <span className="text-indigo-400 font-bold uppercase text-[10px] block mb-1">Fundamento:</span>
                {q.explanation}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // VISTA: EXAMEN
  if (view === 'exam') {
    const q = questions[currentIdx];
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 animate-slide min-h-screen flex flex-col">
        <div className="mb-10 flex justify-between items-center">
          <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full">Pregunta {currentIdx + 1} de {questions.length}</span>
          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-10 flex-grow mb-8">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">{q.topic}</span>
          <h2 className="text-2xl font-bold text-slate-800 mb-10 leading-snug">{q.statement}</h2>
          <div className="space-y-4">
            {q.options.map((opt: string, i: number) => (
              <button 
                key={i} 
                onClick={() => setAnswers({ ...answers, [currentIdx]: i })}
                className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${answers[currentIdx] === i ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-50 hover:bg-slate-50'}`}
              >
                <span className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center font-bold ${answers[currentIdx] === i ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="font-semibold text-slate-700">{opt}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(currentIdx - 1)} className="px-6 py-2 text-slate-400 font-bold disabled:opacity-0">Anterior</button>
          {currentIdx === questions.length - 1 ? (
            <button onClick={handleFinish} className="px-10 py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg hover:bg-green-700 transition-all">Finalizar</button>
          ) : (
            <button onClick={() => setCurrentIdx(currentIdx + 1)} className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg hover:bg-black transition-all">Siguiente</button>
          )}
        </div>
      </div>
    );
  }

  // VISTA: INICIO (LOBBY)
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 min-h-screen flex flex-col items-center justify-center text-center animate-slide">
      <div className="bg-indigo-600 p-5 rounded-3xl shadow-2xl shadow-indigo-100 mb-10">
        <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
        </svg>
      </div>
      <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">Simulador <span className="text-indigo-600">EC0201.01</span></h1>
      <p className="text-xl text-slate-500 max-w-xl mb-12">Certificación en Diseño de Cursos de Formación del Capital Humano. Examen técnico asistido por IA.</p>
      
      {error && <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-12 text-left">
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800">20 Reactivos</h3>
          <p className="text-sm text-slate-500">Generados dinámicamente cada vez que inicias un intento.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800">Estilo CONOCER</h3>
          <p className="text-sm text-slate-500">Redacción técnica basada en criterios de desempeño del estándar.</p>
        </div>
      </div>

      <button onClick={startExam} className="px-12 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 text-xl">
        Comenzar Evaluación
      </button>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
