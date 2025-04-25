const QUESTION_BANK = [
{
    id: "T1",
    type: "theory",
    tags: ["factor-integrante"],
    question: "Determina el factor integrante de la ecuación diferencial lineal $$ y' + P(x)y = Q(x) $$",
    options: [
      "\\( e^{\\int P(x)dx} \\)",
      "\\( \\int Q(x)dx \\)",
      "\\( P(x) \\cdot Q(x) \\)",
      "\\( e^{Q(x)} \\)"
    ],
    answer: 0,
    solution: "El factor integrante se define como $$ \\mu(x) = e^{\\int P(x)dx}.$$  La ecuación diferencial original se transforma en exacta al multiplicarla por el factor integrante."
  },
    {
    id: "T2",
    type: "theory",
    tags: ["factor-integrante"],
    question: "Determina el factor integrante de la ecuación diferencial lineal $$ y' + 2xy = 4x^3 $$",
    options: [
      "\\( \\mu(x)= e^{x^2} \\)",
      "\\( \\mu(x)= x^4\\)",
      "\\( \\mu(x)= 8x^4 \\)",
      "\\( \\mu(x)= e^{2x} \\)"
    ],
    answer: 0,
    solution: "El factor integrante es $$ \\mu(x) = e^{\\int P(x)dx}=  e^{\\int 2xdx}=  e^{x^2}.$$  La ecuación diferencial original se transforma en exacta al multiplicarla por el factor integrante."
  },
  {
    id: "T3",
    type: "theory",
    tags: ["lineal-primer-orden"],  
    question: "La solución general de $$\\displaystyle{ \\frac{dy}{dx}  - 3y = 0  } $$ es:",
    options: [
      "\\( y = Ce^{3x} \\)",
      "\\( y = Ce^{-3x} \\)",
      "\\( y = C + e^{3x} \\)",
      "\\( y = Cx^3 \\)"
    ],
    answer: 0,
    solution: "La ecuación diferencial es separable: $$ \\frac{dy}{y} = 3dx \\Longrightarrow \\ln|y| = 3x + C \\Longrightarrow y = Ce^{3x} $$"
  },
    {
    id: "T4",
    type: "theory",
    tags: ["lineal-primer-orden"],  
    question: "Determina la ecuación diferencial de primer orden que es lineal",
    options: [
      "\\( \\displaystyle{ y\\frac{dy}{dx} + 2y = e^{3x} }\\)",
      "\\( \\displaystyle{ \\frac{dy}{dx} + 2x^2y = xe^{3x} } \\)",
      "\\( \\displaystyle{ \\frac{dy}{dx} + 2y = e^{3y} }\\)",
      "\\( \\displaystyle{ y\\frac{dy}{dx} + x^2y^2 = e^{3x} } \\)"
    ],
    answer: 1,
    solution: "La forma de una ecuación diferencial lineal de primer orden es:  $$ \\frac{dy}{dx}+P(x)y=Q(x)  $$"
  },
{
    id: "T5",
    type: "theory",
    tags: ["lineal-primer-orden"],  
    question: "Determina la solución general de $$\\displaystyle{ \\frac{dy}{dx}  +4y = 0  } $$",
    options: [
      "\\( y = Ce^{-4x} \\)",
      "\\( y = Ce^{4x} \\)",
      "\\( y = C + e^{4x} \\)",
      "\\( y = Cx^4 \\)"
    ],
    answer: 0,
    solution: "La ecuación diferencial es separable: $$ \\frac{dy}{y} = -4dx \\Longrightarrow \\ln|y| = -4x + C \\Longrightarrow y = Ce^{-4x} $$"
  },
{
    id: "P1",
    type: "practical",
    tags: ["lineales-primer-orden"],
    types: ["lineales-primer-orden"], // Nuevo campo requerido
    difficulty: "medium",
    question: "Resuelve: $$ y' + {{a}}y = {{b}} \\hbox{ con } y(0) = {{c}} $$",
    solution_mathjs: "({{b}}/{{a}})+({{c}}-({{b}}/{{a}}))*exp(-{{a}}*x)",
    solution_latex: "$$\\frac{ {{b}} }{ {{a}} } + \\left( {{c}} - \\frac{ {{b}} }{ {{a}} } \\right) e^{-{{a}}x}$$",
    steps: [
      "Primero identificamos que es una ecuación diferencial lineal de primer orden: $$ y' + P(x)y = Q(x) $$",
      "En este caso, el factor integrante es: $$ \\mu(x) = e^{\\int {{a}} \\, dx} = e^{ {{a}} x} $$",
      "Al multiplicar la ecuación por este factor se tiene: $$ e^{ {{a}} x}y' + {{ a }}e^{ {{a}} x}y = {{b}}e^{ {{a}} x} $$",
      "Como la suma del lado izquierdo  es la derivada de un producto resulta: $$ \\frac{d}{dx}(e^{ {{a}} x}y) = {{b}}e^{ {{a}} x} $$",
      "Integrando en ambos lados se obtiene: $$ e^{ {{a}} x}y = \\frac{ {{b}} }{ {{a}} }e^{ {{a}} x} + C $$",
      "Al despejar la variable \\\( y \\\) se tiene: $$ y = \\frac{ {{b}} }{ {{a}} } + Ce^{-{{a}}x} $$",
      "Al aplicar la condición inicial \\\( y(0) = {{c}} \\\) se obtiene: $$ {{c}} = \\frac{ {{b}} }{ {{a}} } + C \\longrightarrow  C = {{c}} - \\frac{ {{b}} }{ {{a}} }=\\frac{ {{a*c-b}} }{ {{a}} }={{c - b/ a}} $$",
      "Finalmente, la solución de la ecuación diferencial es: $$ y(x) = \\frac{ {{b}} }{ {{a}} } + \\left( \\frac{ {{a*c-b}} }{ {{a}} } \\right) e^{-{{a}}x}= {{b/a}}+{{c-b/a}} e^{-{{a}} x} $$"
    ],
    params: {
      a: { min: 2, max: 5, nonZero: true },
      b: { min: 2, max: 5 },
      c: { min: -3, max: 3 }
    },
    conditions: ["a != 0"]
  },
  {
    id: "P2",
    type: "practical",
    tags: ["lineales-primer-orden"],
    types: ["lineales-primer-orden"], // Nuevo campo requerido
    difficulty: "medium",
    question: "Resuelve v: $$ y' + {{a}}y = {{b}} \\cos({{c}}x) \\quad\\hbox{ con }  y(0) = {{d}} $$",
    solution_mathjs: "({{a}}*{{b}}*cos({{c}}*x)+{{b}}*{{c}}*sin({{c}}*x))/({{a*a}}+{{c*c}})+({{d}}-({{a}}*{{b}})/({{a*a}}+{{c*c}}))*exp(-{{a}}*x)",
    solution_latex: "$$\\frac{ {{a}}{{b}} \\cos({{c}}x) + {{b}}{{c}} \\sin({{c}}x) }{ {{a}}^2 + {{c}}^2 } + \\left( {{d}} - \\frac{ {{a}}{{b}} }{ {{a}}^2 + {{c}}^2 } \\right) e^{-{{a}}x}$$",
    steps: [
      "Primero se identifica la ecuación diferencial lineal de primer orden: $$ y' + {{a}}y = {{b}}\\cos({{c}}x) $$",
      "La solución homogénea es: $$ y_h = Ce^{-{{a}}x} $$",
      "Para continuar, se propone una solución particular del tipo: $$ y_p = A\\cos({{c}}x) + B\\sin({{c}}x) $$",
      "Donde \\(A,B\\) son dos constantes a determinar. Al calcular la derivada se tiene $$ y_p' = -{{c}}A\\sin({{c}}x) + {{c}}B\\cos({{c}}x) $$",
      "Sustituyendo en la ecuación diferencial resulta: $$(-{{c}}A\\sin({{c}}x) + {{c}}B\\cos({{c}}x)) + {{a}}(A\\cos({{c}}x) + B\\sin({{c}}x)) = {{b}}\\cos({{c}}x) $$",
      "Al agrupar términos se obtiene: $$ (-{{c}}A + {{a}}B)\\sin({{c}}x) + ({{c}}B + {{a}}A)\\cos({{c}}x) = {{b}}\\cos({{c}}x) $$",
      "De aquí, obtenemos el sistema de ecuaciones: $$ {{a}}A + {{c}}B = {{b}};\\quad \\quad \\\\ -{{c}}A + {{a}}B = 0 $$",
      "Cuya solución es: $$ A = \\frac{ {{a}}{{b}} }{ {{a}}^2 + {{c}}^2 };\\quad \\quad \\\\ B = \\frac{ {{c}}{{b}} }{ {{a}}^2 + {{c}}^2 } $$",
      "La solución general está dada por: \\[ y = y_h + y_p \\]",
      "Finalmente, al aplicar la condición inicial \\( y(0) = {{d}} \\) se encuentra  \\( C \\)"
    ],
    params: {
      a: { min: 2, max: 5 },
      b: { min: 2, max: 5 },
      c: { min: 2, max: 5 },
      d: { min: -3, max: 3 }
    },
    conditions: []
  }
];

export default QUESTION_BANK
