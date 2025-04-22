// Verificación de carga
console.log("Cargando config1.js");

const QUESTION_BANK = [
  // Tus preguntas aquí o...
];

// O si importas de preguntas1.js:
import('/ecuacionesdiferencialeseval/js/preguntas/preguntas1.js').then(module => {
  const questions = module.default || [];
  console.log("Preguntas cargadas:", questions.length);
  return questions;
}).catch(err => {
  console.error("Error cargando preguntas:", err);
  return [];
});

export default {
  title: "Examen de Ecuaciones Diferenciales",
  questionMix: {
    theory: { count: 2 },
    practical: { count: 3 }
  },
  // Resto de configuración...
};
