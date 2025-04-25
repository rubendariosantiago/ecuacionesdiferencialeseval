// Constantes globales
const TOLERANCE = 1e-5;
const TEST_POINTS = [0, 0.1, 0.5, 1, Math.PI/4];

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
              if (!module.default) {
                throw new Error(`El banco ${bank} no exporta por defecto`);
              }
              return module.default;
            })
            .catch(err => {
              console.error(`Error cargando ${bank}:`, err);
              return [];
            })
        )
      );
      this.questionBank = loadedBanks.flat();
    }
    console.log("Total de preguntas cargadas:", this.questionBank.length);
  }

  generateExam() {
    this.questions = [];
    this.currentParams = {};
    this.userAnswers = {};
    this.score = 0;

    const selectedQuestions = this.selectQuestions();
    this.questions = this.processQuestions(selectedQuestions);
    
    if (this.questions.length === 0) {
      throw new Error("No se pudo generar el examen. No hay preguntas válidas.");
    }
    
    this.renderExam();
  }

  selectQuestions() {
    const { theory = {}, practical = {} } = this.config.questionMix || {};
    const selected = [];

    if (theory.count > 0) {
      const theoryQuestions = this.questionBank.filter(q => {
        const isTheory = q.type === 'theory';
        const tagsMatch = !theory.tags || (q.tags && q.tags.some(tag => theory.tags.includes(tag)));
        return isTheory && tagsMatch;
      });
      selected.push(...this.getRandomElements(theoryQuestions, theory.count));
    }

    if (practical.count > 0) {
      const practicalQuestions = this.questionBank.filter(q => {
        const isPractical = q.type === 'practical';
        const typesMatch = !practical.types || (q.types && q.types.some(type => practical.types.includes(type)));
        const difficultyMatch = !practical.difficulty || q.difficulty === practical.difficulty;
        return isPractical && typesMatch && difficultyMatch;
      });
      selected.push(...this.getRandomElements(practicalQuestions, practical.count));
    }

    console.log("Preguntas seleccionadas:", selected.map(q => q.id));
    return selected;
  }

  processQuestions(questions) {
    return questions.map((q, index) => {
      if (q.type === 'practical') {
        // Validación de campos requeridos
        if (!q.question || typeof q.question !== 'string') return null;
        if (!q.solution_mathjs || typeof q.solution_mathjs !== 'string') return null;
        if (!q.solution_latex || typeof q.solution_latex !== 'string') return null;

        // Generar parámetros
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

        // Procesar plantillas
        try {
          return {
            ...q,
            renderedQuestion: this.renderTemplate(q.question, params),
            renderedSolutionMathjs: this.renderTemplate(q.solution_mathjs, params),
            renderedSolutionLatex: this.renderTemplate(q.solution_latex, params),
            renderedSteps: q.steps?.map(step => this.renderTemplate(step, params)) || [],
            params
          };
        } catch (error) {
          console.error(`Error procesando pregunta ${q.id}:`, error);
          return null;
        }
      }
      return q;
    }).filter(q => q !== null);
  }

  renderExam() {
    const container = document.getElementById('quiz-container');
    if (!container) throw new Error("No se encontró el contenedor del examen");

    container.innerHTML = `
      <h1>${this.config.title || 'Examen de Ecuaciones Diferenciales'}</h1>
      <div id="quiz"></div>
      <button id="submit-exam">Enviar Examen</button>
      ${this.config.allowRetry ? '<button id="retry-exam">Intentar Nuevamente</button>' : ''}
      <div id="exam-result" class="hidden"></div>
    `;

    const quizContainer = document.getElementById('quiz');
    this.questions.forEach((q, i) => {
      quizContainer.innerHTML += q.type === 'theory' 
        ? this.renderTheoryQuestion(q, i)
        : this.renderPracticalQuestion(q, i);
    });

    // Reprocesar MathJax para todo el examen
    this.renderMathJax();
  }

  renderTheoryQuestion(question, index) {
    const optionsWithIndex = question.options.map((opt, i) => ({ opt, originalIndex: i }));
    const shuffledOptions = [...optionsWithIndex].sort(() => Math.random() - 0.5);
    const correctShuffledIndex = shuffledOptions.findIndex(
      item => item.originalIndex === question.answer
    );
    
    this.questions[index].shuffledAnswer = correctShuffledIndex;

    return `
      <div class="question theory-question" data-index="${index}">
        <p><strong>Pregunta teórica ${index + 1}:</strong> ${question.question}</p>
        ${shuffledOptions.map((item, i) => `
          <label>
            <input type="radio" name="theory-${index}" value="${i}">
            ${item.opt}
          </label>
        `).join('')}
        <div class="feedback hidden"></div>
      </div>
    `;
  }

  renderPracticalQuestion(q, index) {
    const paramsInfo = q.params 
      ? `<div class="param-info">Parámetros: ${
          Object.entries(q.params)
            .map(([key, val]) => `${key} = ${this.currentParams[`q${index}`][key]}`)
            .join(', ')
        }</div>`
      : '';

    return `
      <div class="question practical-question" data-index="${index}">
        <p><strong>Ejercicio ${index+1}:</strong> ${q.renderedQuestion}</p>
        ${paramsInfo}
        <input type="text" class="answer-input" placeholder="Ejemplo: 3*exp(-2*x)">
        <div class="feedback hidden"></div>
      </div>
    `;
  }

  evaluateExam() {
    this.score = 0;
    
    this.questions.forEach((q, i) => {
      const questionEl = document.querySelector(`.question[data-index="${i}"]`);
      if (!questionEl) return;

      if (q.type === 'theory') {
        const selected = questionEl.querySelector(`input[name="theory-${i}"]:checked`);
        const isCorrect = selected && parseInt(selected.value) === q.shuffledAnswer;
        
        this.showFeedback(
          questionEl,
          isCorrect,
          isCorrect ? '' : q.solution
        );
        
        if (isCorrect) this.score++;
      } else if (q.type === 'practical') {
        const inputEl = questionEl.querySelector('.answer-input');
        const userInput = inputEl.value.trim();
        
        const evaluation = this.evaluateSolution(
          userInput, 
          q.renderedSolutionMathjs, 
          { ...q.params, x: 0 }
        );

        if (evaluation.isValid) {
          this.score++;
          this.showFeedback(questionEl, true);
        } else {
          this.showFeedback(
            questionEl, 
            false, 
            q.renderedSolutionLatex,
            q.renderedSteps,
            q.params
          );
        }
      }
    });

    this.showFinalResult();
  }

  evaluateSolution(userInput, expectedSolution, params) {
    try {
      if (!userInput || userInput.trim().length < 3) {
        throw new Error("Expresión demasiado corta");
      }

      userInput = userInput.trim().replace(/^['"]|['"]$/g, '');
      const scope = {...params};
      let maxError = 0;
      let validPoints = 0;

      for (const x of this.config.testPoints || TEST_POINTS) {
        try {
          scope.x = x;
          const userVal = math.evaluate(userInput, scope);
          const expectedVal = math.evaluate(expectedSolution, scope);

          if (Math.abs(expectedVal) > 1e12) continue;

          const error = Math.abs(userVal - expectedVal) / (1 + Math.abs(expectedVal));
          maxError = Math.max(maxError, error);
          validPoints++;
        } catch (e) {
          continue;
        }
      }

      if (validPoints === 0) throw new Error("No se pudo evaluar en ningún punto");
      if (validPoints < (this.config.testPoints || TEST_POINTS).length * 0.6) {
        throw new Error("Solo se evaluó en algunos puntos");
      }

      return {
        isValid: maxError < (this.config.tolerance || TOLERANCE),
        error: maxError < (this.config.tolerance || TOLERANCE) ? null : `Error máximo: ${maxError.toExponential(2)}`,
        maxError,
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

  showFeedback(questionEl, isCorrect, correctSolution = '', steps = [], params = {}) {
    const feedbackEl = questionEl.querySelector('.feedback');
    
    feedbackEl.innerHTML = isCorrect
      ? '✅ Correcto!'
      : `❌ Incorrecto. ${correctSolution ? `Solución: <span class="mathjax">${correctSolution}</span>` : ''}
         ${steps?.length ? this.renderSolutionSteps(steps) : ''}`;
    
    feedbackEl.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackEl.classList.remove('hidden');

    this.renderMathJax([feedbackEl]);
  }

  renderSolutionSteps(steps) {
    if (!steps?.length) return '';
    return `
      <div class="solution-steps">
        <strong>Pasos de solución:</strong>
        ${steps.map(step => `<div class="mathjax">${step}</div>`).join('')}
      </div>
    `;
  }

  renderTemplate(template, params) {
    if (typeof template !== 'string') return template;
    
    return template.replace(/\{\{(.+?)\}\}/g, (_, expr) => {
      try {
        const result = math.evaluate(expr, params);
        return result?.toString() ?? `{{${expr}}}`;
      } catch (e) {
        console.error(`Error en expresión '${expr}':`, e);
        return `{{${expr}}}`;
      }
    });
  }

  renderMathJax(elements = []) {
    if (!window.MathJax) return;
    
    try {
      MathJax.typesetPromise(elements).catch(e => {
        console.error("Error en MathJax.typeset:", e);
      });
    } catch (e) {
      console.error("Error al llamar a MathJax:", e);
    }
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
    this.renderMathJax([resultEl]);
  }

  showError(error) {
    const container = document.getElementById('quiz-container') || document.body;
    container.innerHTML = `
      <div class="error">
        <h2>Error al cargar el examen</h2>
        <p>${error.message}</p>
        <button onclick="window.location.reload()">Recargar</button>
      </div>
    `;
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  getRandomElements(arr, n) {
    return arr?.length ? [...arr].sort(() => 0.5 - Math.random()).slice(0, n) : [];
  }

  setupEventListeners() {
    document.getElementById('submit-exam')?.addEventListener('click', () => this.evaluateExam());
    document.getElementById('retry-exam')?.addEventListener('click', () => this.generateExam());
  }
}

export default EDExamen;
