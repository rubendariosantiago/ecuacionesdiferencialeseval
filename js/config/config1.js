import QUESTION_BANK from '../preguntas/preguntas1.js';

export default {
  title: "Examen Básico de ED Lineales",
  description: "Evaluación inicial de ecuaciones diferenciales lineales de primer orden",
  
  // Especificar directamente las preguntas o bancos de preguntas
  questions: QUESTION_BANK,
  // O alternativamente:
  // questionBanks: ['basico', 'lineales'],
  
  questionMix: {
    theory: {
      count: 2,
      tags: ["factor-integrante", "lineal-primer-orden"]
    },
    practical: {
      count: 3,
      types: ["lineales-primer-orden"],
      difficulty: "medium"
    }
  },
  
  grading: {
    passingScore: 0.6,
    showSolutions: true,
    allowRetry: true
  },
  
  // Configuración de evaluación
  tolerance: 1e-4,
  testPoints: [0, 0.5, 1, 1.5, 2, Math.PI/4, Math.PI/2]
};
