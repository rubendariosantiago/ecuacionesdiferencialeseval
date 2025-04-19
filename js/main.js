// Constantes globales
const TOLERANCE = 1e-5;
const TEST_POINTS = [0, 0.1, 0.5, 1, Math.PI/4];

// Función para evaluar expresiones matemáticas
function evaluateWithDiagnostic(expr, scope) {
  try {
    const parsedExpr = parseExpression(expr);
    const evalFn = new Function(...Object.keys(scope), 
      `'use strict'; try { return ${parsedExpr}; } catch(e) { return NaN; }`);
    return evalFn(...Object.values(scope));
  } catch (e) {
    throw new Error(`Error de evaluación: ${e.message}`);
  }
}

// Función para parsear expresiones
function parseExpression(expr) {
  if (!expr || typeof expr !== 'string') {
    throw new Error("Expresión vacía o no válida");
  }

  expr = expr.trim().replace(/^['"]|['"]$/g, '');

  // Verificar paréntesis balanceados
  const stack = [];
  for (const char of expr) {
    if (char === '(') stack.push(char);
    if (char === ')') {
      if (stack.length === 0) throw new Error("Paréntesis no balanceados");
      stack.pop();
    }
  }
  if (stack.length > 0) throw new Error("Paréntesis no balanceados");

  // Transformaciones
  return expr
    .replace(/\s+/g, '')
    .replace(/\^/g, '**')
    .replace(/([0-9])([a-zA-Z])/g, '$1*$2')
    .replace(/([a-zA-Z])([0-9])/g, '$1*$2')
    .replace(/e\*\*\(/g, 'exp(')
    .replace(/exp\(/g, 'Math.exp(')
    .replace(/sin\(/g, 'Math.sin(')
    .replace(/cos\(/g, 'Math.cos(')
    .replace(/log\(/g, 'Math.log(')
    .replace(/([+\-*/])([+-])/g, '$1 $2');
}

// Clase principal del examen
class EDExamen {
  constructor(config) {
    this.config = {
      tolerance: TOLERANCE,
      testPoints: TEST_POINTS,
      ...config
    };
    this.questions = [];
    this.currentParams = {};
    this.userAnswers = {};
    this.score = 0;
  }

  async init() {
    try {
      await this.loadQuestions();
      this.generateExam();
      this.setupEventListeners();
      console.log("Examen inicializado correctamente");
    } catch (error) {
      console.error("Error al inicializar examen:", error);
      this.showError(error);
    }
  }

  async loadQuestions() {
    console.log("Cargando preguntas...");
    if (this.config.questions) {
      this.questionBank = this.config.questions;
    } else if (this.config.questionBanks) {
      const loadedBanks = await Promise.all(
        this.config.questionBanks.map(bank => 
          import(`./preguntas/${bank}.js`)
            .then(module => {
              console.log(`Banco ${bank} cargado:`, module.default);
              return module.default || module.QUESTION_BANK;
            })
            .catch(err => {
              console.error(`Error cargando ${bank}:`, err);
              return [];
            })
        )
      );
      this.questionBank = loadedBanks.flat();
    }
    console.log("Preguntas prácticas disponibles:", 
      this.questionBank.filter(q => q.type === 'practical'));
  }

  generateExam() {
    this.questions = [];
    this.currentParams = {};
    this.userAnswers = {};
    this.score = 0;

    const selectedQuestions = this.selectQuestions();
    this.questions = this.processQuestions(selectedQuestions);
    
    this.renderExam();
  }

 selectQuestions() {
  const { theory = {}, practical = {} } = this.config.questionMix || {};
  const selected = [];

  // Debug: Mostrar todo el banco de preguntas
  console.log("Banco completo de preguntas:", this.questionBank);

  // Selección de preguntas teóricas
  if (theory.count > 0) {
    const theoryQuestions = this.questionBank.filter(q => {
      const matches = q.type === 'theory' && 
        (!theory.tags || (q.tags && q.tags.some(tag => theory.tags.includes(tag))));
      if (!matches && q.type === 'theory') {
        console.log("Teórica descartada:", q.id, "Tags:", q.tags);
      }
      return matches;
    });
    selected.push(...this.getRandomElements(theoryQuestions, theory.count));
  }

  // Selección de preguntas prácticas (VERBOSE DEBUG)
  if (practical.count > 0) {
    console.log("Filtrando prácticas con criterios:", {
      types: practical.types,
      difficulty: practical.difficulty
    });

    const practicalQuestions = this.questionBank.filter(q => {
      if (q.type !== 'practical') return false;
      
      const typeMatch = !practical.types || 
                       (q.types && q.types.some(t => practical.types.includes(t)));
      const difficultyMatch = !practical.difficulty || q.difficulty === practical.difficulty;
      
      if (!typeMatch) console.log(`Práctica ${q.id} no coincide types:`, q.types);
      if (!difficultyMatch) console.log(`Práctica ${q.id} no coincide difficulty:`, q.difficulty);
      
      return typeMatch && difficultyMatch;
    });

    console.log("Prácticas que cumplen filtro:", practicalQuestions.map(q => q.id));
    selected.push(...this.getRandomElements(practicalQuestions, practical.count));
  }

  console.log("Preguntas seleccionadas FINALES:", selected.map(q => ({
    id: q.id,
    type: q.type,
    tags: q.tags,
    difficulty: q.difficulty
  })));
  return selected;
}

processQuestions(questions) {
  return questions.map((q, index) => {
    // Debug: Verificar la pregunta antes de procesar
    console.log(`Procesando pregunta ${index}:`, {
      id: q.id,
      type: q.type,
      hasQuestion: !!q.question,
      hasSolutionMathjs: !!q.solution_mathjs,
      hasSolutionLatex: !!q.solution_latex
    });

    if (q.type === 'practical') {
      // Validar campos requeridos
      if (!q.question || !q.solution_mathjs || !q.solution_latex) {
        console.error(`Pregunta práctica ${q.id} falta campos requeridos`, q);
        return null; // O podrías devolver una pregunta de error
      }

      const params = {};
      if (q.params) {
        Object.keys(q.params).forEach(key => {
          const config = q.params[key];
          let value;
          do {
            value = this.getRandomInt(config.min, config.max + 1);
          } while (config.nonZero && value === 0);
          params[key] = value;
        });
      }
      this.currentParams[`q${index}`] = params;

      try {
        return {
          ...q,
          renderedQuestion: this.renderTemplate(q.question, params),
          renderedSolutionMathjs: this.renderTemplate(q.solution_mathjs, params),
          renderedSolutionLatex: this.renderTemplate(q.solution_latex, params),
          params
        };
      } catch (error) {
        console.error(`Error procesando pregunta ${q.id}:`, error);
        return null; // O manejar el error de otra forma
      }
    }
    return q;
  }).filter(q => q !== null); // Filtrar preguntas inválidas
}
  
generateExam() {
  // Limpiar examen anterior
  this.questions = [];
  this.currentParams = {};
  this.userAnswers = {};
  this.score = 0;

  // Seleccionar preguntas según configuración
  const selectedQuestions = this.selectQuestions();
  
  // Procesar preguntas con manejo de errores
  try {
    this.questions = this.processQuestions(selectedQuestions);
    
    // Verificar que tenemos preguntas válidas
    if (this.questions.length === 0) {
      throw new Error('No se generaron preguntas válidas');
    }
    
    // Renderizar
    this.renderExam();
  } catch (error) {
    console.error('Error generando examen:', error);
    this.showError({
      message: 'Error al preparar las preguntas del examen',
      stack: error.stack
    });
  }
}
  renderTheoryQuestion(question, index) {
    // Mezclar opciones y guardar el mapeo correcto
    const optionsWithIndex = question.options.map((opt, i) => ({ opt, originalIndex: i }));
    const shuffledOptions = [...optionsWithIndex].sort(() => Math.random() - 0.5);
    
    // Encontrar el índice correcto en las opciones mezcladas
    const correctShuffledIndex = shuffledOptions.findIndex(
      item => item.originalIndex === question.answer
    );

    // Guardar el índice correcto para la evaluación
    this.questions[index].shuffledAnswer = correctShuffledIndex;

    const optionsHtml = shuffledOptions.map((item, i) => `
      <label>
        <input type="radio" name="theory-${index}" value="${i}">
        ${item.opt}
      </label>
    `).join('');

    return `
      <div class="question theory-question" data-index="${index}">
        <p><strong>Pregunta teórica ${index + 1}:</strong> ${question.question}</p>
        ${optionsHtml}
        <div class="feedback hidden"></div>
      </div>
    `;
  }

  renderPracticalQuestion(question, index) {
    const paramsInfo = Object.entries(question.params || {})
      .map(([key, value]) => `${key} = ${value}`)
      .join(', ');

    return `
      <div class="question practical-question" data-index="${index}">
        <p><strong>Ejercicio práctico ${index + 1}:</strong> ${question.renderedQuestion}</p>
        ${paramsInfo ? `<div class="param-info">Parámetros: ${paramsInfo}</div>` : ''}
        <input type="text" class="answer-input" 
               placeholder="Ejemplo: 3*exp(-2*x) + (x^2)/2">
        <div class="format-help">
          Formato: Use * para multiplicación (2*x), funciones como exp(x), sin(x), etc.
        </div>
        <div class="feedback hidden"></div>
      </div>
    `;
  }

  evaluateExam() {
    this.score = 0;
    const results = [];

    this.questions.forEach((q, i) => {
      const questionEl = document.querySelector(`.question[data-index="${i}"]`);
      const feedbackEl = questionEl?.querySelector('.feedback');
      
      if (!questionEl || !feedbackEl) {
        console.error(`No se encontró pregunta con índice ${i}`);
        return;
      }
      
      if (q.type === 'theory') {
        const selected = questionEl.querySelector(`input[name="theory-${i}"]:checked`);
        // Usar shuffledAnswer para la evaluación
        const isCorrect = selected && parseInt(selected.value) === q.shuffledAnswer;
        
        if (isCorrect) {
          this.score++;
          feedbackEl.innerHTML = '✅ Correcto!';
          feedbackEl.className = 'feedback correct';
        } else {
          const correctOption = q.options[q.answer];
          feedbackEl.innerHTML = `
            ❌ Incorrecto. La respuesta correcta es: ${correctOption}
            <div class="solution">${q.solution}</div>
          `;
          feedbackEl.className = 'feedback incorrect';
        }
      } else {
        const inputEl = questionEl.querySelector('.answer-input');
        if (!inputEl) {
          console.error(`No se encontró input para pregunta práctica ${i}`);
          return;
        }
        
        const userInput = inputEl.value.trim();
        const evaluation = this.evaluateSolution(
          userInput, 
          q.renderedSolutionMathjs, 
          { ...q.params, x: 0 } // x se sobrescribe en cada punto
        );

        if (evaluation.isValid) {
          this.score++;
          feedbackEl.innerHTML = '✅ Correcto!';
          feedbackEl.className = 'feedback correct';
        } else {
          feedbackEl.innerHTML = `
            ❌ Respuesta incorrecta
            <div class="error-details">${evaluation.error}</div>
            <div class="solution">
              Solución esperada: <span class="mathjax">${q.renderedSolutionLatex}</span>
              ${q.steps ? this.renderSolutionSteps(q.steps, q.params) : ''}
            </div>
          `;
          feedbackEl.className = 'feedback incorrect';
        }
      }
      feedbackEl.classList.remove('hidden');
    });

    this.showFinalResult();
  }

  // ... (resto de los métodos auxiliares se mantienen igual) ...
  evaluateSolution(userInput, expectedSolution, params) {
    try {
      if (typeof userInput !== 'string' || userInput.trim().length < 3) {
        throw new Error("La expresión es demasiado corta o no es un texto válido");
      }

      userInput = userInput.trim().replace(/^['"]|['"]$/g, '');

      const scope = {...params};
      let maxError = 0;
      let validPoints = 0;
      const errors = [];

      for (const x of this.config.testPoints || TEST_POINTS) {
        try {
          scope.x = x;
          
          const userVal = evaluateWithDiagnostic(userInput, scope);
          const expectedVal = evaluateWithDiagnostic(expectedSolution, scope);

          if (Math.abs(expectedVal) > 1e12) continue;

          const error = Math.abs(userVal - expectedVal) / (1 + Math.abs(expectedVal));
          maxError = Math.max(maxError, error);
          validPoints++;
        } catch (e) {
          errors.push(`En x=${x}: ${e.message}`);
          continue;
        }
      }

      if (validPoints === 0) {
        const errorAnalysis = [
          "No se pudo evaluar en ningún punto. Posibles causas:",
          ...new Set(errors),
          "Ejemplo de formato válido: (2*cos(3*x)+4*sin(3*x))/5 + exp(-2*x)"
        ].join('<br>• ');
        throw new Error(errorAnalysis);
      }

      if (validPoints < (this.config.testPoints || TEST_POINTS).length * 0.6) {
        throw new Error(`Solo se evaluó en ${validPoints}/${(this.config.testPoints || TEST_POINTS).length} puntos. Revise:` +
          `<br>1. Operadores de multiplicación (2*x no 2x)` +
          `<br>2. Funciones bien escritas (cos(x) no cosx)` +
          `<br>3. Paréntesis balanceados` +
          `<br>4. No use comillas en la expresión`);
      }

      return {
        isValid: maxError < (this.config.tolerance || TOLERANCE),
        error: maxError < (this.config.tolerance || TOLERANCE) ? null : `Error máximo: ${maxError.toExponential(2)}`,
        maxError: maxError,
        pointsTested: validPoints
      };
    } catch (e) {
      return {
        isValid: false,
        error: e.message,
        pointsTested: 0
      };
    }
  }

renderTemplate(template, params) {
  // Validación robusta
  if (typeof template !== 'string') {
    console.error('Plantilla no es string:', template);
    throw new Error(`La plantilla debe ser un string, recibido: ${typeof template}`);
  }

  try {
    return template.replace(/\{\{(.+?)\}\}/g, (_, expr) => {
      try {
        const result = math.evaluate(expr, params);
        if (result === undefined) {
          throw new Error(`Expresión '${expr}' evaluada como undefined`);
        }
        return result.toString();
      } catch (e) {
        console.error(`Error evaluando expresión '${expr}' con params:`, params, e);
        return `{{ERROR_EN_${expr}}}`;
      }
    });
  } catch (e) {
    console.error('Error procesando plantilla:', template, e);
    return `[ERROR_EN_PLANTILLA: ${e.message}]`;
  }
}

  renderSolutionSteps(steps, params) {
    return `
      <div class="solution-steps">
        <strong>Pasos de solución:</strong>
        ${steps.map(step => `
          <div>${this.renderTemplate(step, params)}</div>
        `).join('')}
      </div>
    `;
  }

  showFinalResult() {
    const resultEl = document.getElementById('exam-result');
    if (!resultEl) return;

    const percentage = (this.score / this.questions.length * 100).toFixed(1);
    resultEl.innerHTML = `
      <h2>Resultado Final</h2>
      <p>Obtuviste <strong>${this.score} de ${this.questions.length}</strong> (${percentage}%)</p>
      ${this.score >= this.questions.length * (this.config.passingScore || 0.7) 
        ? '<p class="pass">¡Aprobado!</p>' 
        : '<p class="fail">Intenta nuevamente</p>'}
    `;
    resultEl.classList.remove('hidden');
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  getRandomElements(arr, n) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }

  setupEventListeners() {
    document.getElementById('submit-exam')?.addEventListener('click', () => this.evaluateExam());
    document.getElementById('retry-exam')?.addEventListener('click', () => this.generateExam());
  }

  showError(error) {
    const container = document.getElementById('quiz-container') || document.body;
    container.innerHTML = `
      <div class="error">
        <h2>Error al cargar el examen</h2>
        <p>${error.message}</p>
        <p>Detalles técnicos:</p>
        <pre>${error.stack}</pre>
        <button onclick="window.location.reload()">Recargar</button>
      </div>
    `;
  }
}

export default EDExamen;
