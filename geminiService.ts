
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateExamQuestions = async (): Promise<Question[]> => {
  const prompt = `
    Genera un examen de 20 preguntas de opción múltiple para la certificación CONOCER EC0217.01 (Impartición de cursos de formación del capital humano).
    
    REQUISITOS CRÍTICOS DE REDACCIÓN:
    1. Estilo STPS: Utiliza un lenguaje técnico, formal y complejo. Evita preguntas directas y simples.
    2. Casos Prácticos: Al menos el 50% de las preguntas deben presentar situaciones o escenarios donde el instructor debe tomar una decisión basada en el estándar.
    3. Distractores: Las opciones incorrectas deben ser verosímiles y estar relacionadas con el tema, para evaluar la comprensión real y no solo la memoria.
    4. Cobertura: Distribuye las preguntas equitativamente entre los siguientes temas:
       - Sistema Nacional de Competencias y el CONOCER (SNC, OC, ECE, Red de Prestadores).
       - Dominios de Aprendizaje (Bloom: Cognitivo, Psicomotriz, Afectivo; UNESCO: Saber, Saber Hacer, Saber Ser).
       - Teorías de Aprendizaje (Constructivismo, Conductismo, Cognitivismo, Humanismo).
       - Estilos de Aprendizaje (Ned Herrmann, Kolb, Paul MacLean, Gardner, VAK).
       - Herramientas de Conducción y Roles de Grupo (El Contreras, El Experto, El Silencioso, etc.).
       - Redacción de Objetivos (Sujeto, Acción, Condición de Operación).
       - Técnicas Instruccionales (Expositiva, Demostrativa, Diálogo-Discusión).
       - Evaluación (Momentos: Diagnóstica, Formativa, Sumativa; Instrumentos: Lista de Cotejo, Guía de Observación, Cuestionario).
       - Elaboración de Productos (Carta Descriptiva).

    Cada pregunta debe tener exactamente 4 opciones.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                minItems: 4,
                maxItems: 4
              },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["topic", "statement", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const questions: Question[] = JSON.parse(response.text).map((q: any, idx: number) => ({
      ...q,
      id: idx + 1
    }));
    
    return questions;
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
};
