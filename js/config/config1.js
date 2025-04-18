const EXAM_CONFIG = {
  id: "examen-parcial-1",
  title: "Examen Parcial 1 - ED Lineales",
  description: "Evaluación de ecuaciones diferenciales lineales de primer orden",
  
  questionMix: {
    theory: {
      count: 2,
      tags: ["orden", "linealidad", "condiciones-iniciales"]
    },
    practical: {
      count: 3,
      difficulty: "medium",
      types: ["lineales-homogeneas", "lineales-no-homogeneas"]
    }
  },
  
  grading: {
    passingScore: 0.7,
    showSolutions: true,
    allowRetry: true
  },
  
  dependencies: {
    questions: "preguntas1.js"
  }
};
