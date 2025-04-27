// Constantes globales
const TOLERANCE = 1e-5;
const TEST_POINTS = [0, 0.1, 0.5, 1, Math.PI/4];

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
    this.mathJaxRetryCount = 0;
    this.maxMathJaxRetries = 5; // Aumentado para Safari
    this.isMobile = this.checkMobile();
  }

  // ========== MÉTODOS PRINCIPALES ==========

  async init() {
    try {
      await this.loadQuestions();
      this.generateExam();
      this.setupEventListeners();
      this.applyMobileStyles();
      console.log("Examen inicializado correctamente");
    } catch (error) {
      console.error("Error al inicializar examen:", error);
      this.showError(error);
    }
  }

  // ========== MEJORAS PARA DISPOSITIVOS MÓVILES ==========

  checkMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  applyMobileStyles() {
    if (!this.isMobile) return;

    const style = document.createElement('style');
    style.textContent = `
      .question {
        padding: 12px;
        margin: 10px 0;
      }
      input[type="text"] {
        font-size: 14px;
        padding: 6px;
      }
      button {
        padding: 8px 12px;
        margin: 5px;
        font-size: 14px;
      }
      .param-info {
        font-size: 12px;
      }
      .MathJax {
        font-size: 1em !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ========== GENERACIÓN DEL EXAMEN ==========

  generateExam(newAttempt = false) {
    this.questions = [];
    this.currentParams = {};
    this.userAnswers = {};
    this.score = 0;
    this.mathJaxRetryCount = 0;

    const selectedQuestions = this.selectQuestions();
    this.questions = this.processQuestions(selectedQuestions);
    
    if (this.questions.length === 0) {
      throw new Error("No se pudo generar el examen. No hay preguntas válidas.");
    }
    
    this.renderExam(newAttempt);
  }

  renderExam(newAttempt = false) {
    const container = document.getElementById('quiz-container');
    if (!container) throw new Error("No se encontró el contenedor del examen");

    container.innerHTML = `
      <h1>${this.config.title || 'Examen de Ecuaciones Diferenciales'}</h1>
      <div id="quiz"></div>
      <div class="button-container">
        <button id="submit-exam" ${newAttempt ? 'class="hidden"' : ''}>Enviar Examen</button>
        <button id="new-exam">Generar Nuevo Examen</button>
        ${this.config.allowRetry ? '<button id="retry-exam">Intentar Nuevamente</button>' : ''}
      </div>
      <div id="exam-result" class="hidden"></div>
    `;

    const quizContainer = document.getElementById('quiz');
    this.questions.forEach((q, i) => {
      quizContainer.innerHTML += q.type === 'theory' 
        ? this.renderTheoryQuestion(q, i)
        : this.renderPracticalQuestion(q, i);
    });

    this.safeRenderMathJax();
  }

  // ========== COMPATIBILIDAD CON SAFARI ==========

  safeRenderMathJax(elements = []) {
    if (!window.MathJax) {
      if (this.mathJaxRetryCount < this.maxMathJaxRetries) {
        setTimeout(() => this.safeRenderMathJax(elements), 500);
        this.mathJaxRetryCount++;
      }
      return;
    }

    // Solución especial para Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      document.querySelectorAll('.mathjax, .MathJax').forEach(el => {
        el.style.display = 'inline-block';
      });
    }

    MathJax.typesetPromise(elements)
      .then(() => {
        if (isSafari) {
          setTimeout(() => {
            MathJax.typesetPromise(elements).catch(e => console.error("Safari retry error:", e));
          }, 300);
        }
      })
      .catch(err => {
        console.error("Error en MathJax:", err);
        if (this.mathJaxRetryCount < this.maxMathJaxRetries) {
          setTimeout(() => this.safeRenderMathJax(elements), 500);
          this.mathJaxRetryCount++;
        }
      });
  }

  // ========== EVALUACIÓN Y RESULTADOS ==========

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

  showFinalResult() {
    const resultEl = document.getElementById('exam-result');
    const submitBtn = document.getElementById('submit-exam');
    if (!resultEl || !submitBtn) return;

    const percentage = (this.score / this.questions.length * 100).toFixed(1);
    resultEl.innerHTML = `
      <h2>Resultado Final</h2>
      <p>Obtuviste <strong>${this.score} de ${this.questions.length}</strong> (${percentage}%)</p>
      ${this.score >= this.questions.length * (this.config.passingScore || 0.7) 
        ? '<p class="pass">¡Aprobado!</p>' 
        : '<p class="fail">Intenta nuevamente</p>'}
    `;
    resultEl.classList.remove('hidden');
    
    // Ocultar botón de enviar después de mostrar resultados
    submitBtn.classList.add('hidden');
    
    this.safeRenderMathJax([resultEl]);
  }

  // ========== MANEJO DE EVENTOS ==========

  setupEventListeners() {
    document.getElementById('submit-exam')?.addEventListener('click', () => this.evaluateExam());
    document.getElementById('retry-exam')?.addEventListener('click', () => {
      this.generateExam();
      document.getElementById('submit-exam').classList.remove('hidden');
    });
    
    // Nuevo botón para generar examen diferente
    document.getElementById('new-exam')?.addEventListener('click', () => {
      this.generateExam(true);
    });
  }

  // ========== MÉTODOS AUXILIARES ==========
  // ... (los métodos auxiliares restantes permanecen iguales que en la versión anterior)
  // getRandomInt, getRandomElements, renderTemplate, showError, etc.

  // ========== RENDERIZADO DE PREGUNTAS ==========
  // ... (los métodos de renderizado permanecen iguales que en la versión anterior)
  // renderTheoryQuestion, renderPracticalQuestion, renderSolutionSteps, etc.
}

export default EDExamen;
