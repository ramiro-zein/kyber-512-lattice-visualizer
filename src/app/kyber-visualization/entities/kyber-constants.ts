/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CONSTANTES MATEMÁTICAS DE CRYSTALS-Kyber (ML-KEM)
 * Según especificación FIPS 203
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * NOTACIÓN FORMAL:
 *   R_q = Z_q[X] / ⟨X^n + 1⟩  (Anillo cociente de polinomios)
 *   n = 256                    (Grado del polinomio ciclotómico)
 *   q = 3329                   (Módulo primo, q ≡ 1 (mod 2n))
 *
 * ESTRUCTURA ALGEBRAICA:
 *   - R_q es un anillo conmutativo con unidad
 *   - La multiplicación es convolución negacíclica: X^n ≡ -1 (mod X^n + 1)
 *   - q = 3329 permite NTT eficiente (ω = 17 es raíz 256-ésima primitiva)
 */

/**
 * Parámetros del anillo R_q = Z_q[X] / ⟨X^n + 1⟩
 */
export const RING_PARAMS = {
  /** n: Grado del polinomio ciclotómico Φ_{2n}(X) = X^n + 1 */
  N: 256,

  /** q: Módulo primo. Elegido tal que q ≡ 1 (mod 2n) para permitir NTT */
  Q: 3329,

  /** ω: Raíz n-ésima primitiva de la unidad en Z_q (17^128 ≡ -1 mod q) */
  OMEGA: 17,

  /** ⌈q/2⌋: Usado para codificación de mensajes */
  Q_HALF: 1665,

  /** log₂(q) ≈ 12: Bits necesarios para representar elementos de Z_q */
  LOG_Q: 12,
} as const;

/**
 * Parámetros de seguridad para Kyber-512, Kyber-768, Kyber-1024
 *
 * NIVELES DE SEGURIDAD (NIST):
 *   - Kyber-512:  k=2, η₁=3, η₂=2  → Nivel 1 (AES-128 equivalente)
 *   - Kyber-768:  k=3, η₁=2, η₂=2  → Nivel 3 (AES-192 equivalente)
 *   - Kyber-1024: k=4, η₁=2, η₂=2  → Nivel 5 (AES-256 equivalente)
 */
export const SECURITY_PARAMS = {
  KYBER_512: {
    name: 'Kyber-512',
    k: 2,
    eta1: 3,
    eta2: 2,
    du: 10,
    dv: 4,
    securityLevel: 1,
  },
  KYBER_768: {
    name: 'Kyber-768',
    k: 3,
    eta1: 2,
    eta2: 2,
    du: 10,
    dv: 4,
    securityLevel: 3,
  },
  KYBER_1024: {
    name: 'Kyber-1024',
    k: 4,
    eta1: 2,
    eta2: 2,
    du: 11,
    dv: 5,
    securityLevel: 5,
  },
} as const;

export type SecurityLevel = keyof typeof SECURITY_PARAMS;

/**
 * Distribución Binomial Centrada (CBD)
 *
 * DEFINICIÓN FORMAL:
 *   CBD_η : Sea (a_i, b_i) ← {0,1}^η × {0,1}^η
 *   x = Σᵢ(aᵢ - bᵢ) para i ∈ {0, ..., η-1}
 *
 * DISTRIBUCIÓN DE PROBABILIDAD para η=2:
 *   P(x = -2) = 1/16
 *   P(x = -1) = 4/16
 *   P(x =  0) = 6/16
 *   P(x = +1) = 4/16
 *   P(x = +2) = 1/16
 *
 * PROPIEDADES:
 *   - E[x] = 0 (media cero)
 *   - Var[x] = η/2 (varianza)
 *   - Soporte: {-η, ..., +η}
 */
export const CBD_DISTRIBUTION = {
  /** Probabilidades para CBD_2: P(x=k) = C(4, 2+k) / 16 */
  ETA_2: {
    probabilities: new Map<number, number>([
      [-2, 1 / 16],
      [-1, 4 / 16],
      [0, 6 / 16],
      [1, 4 / 16],
      [2, 1 / 16],
    ]),
    support: [-2, -1, 0, 1, 2],
    variance: 1,
  },

  /** Probabilidades para CBD_3: P(x=k) = C(6, 3+k) / 64 */
  ETA_3: {
    probabilities: new Map<number, number>([
      [-3, 1 / 64],
      [-2, 6 / 64],
      [-1, 15 / 64],
      [0, 20 / 64],
      [1, 15 / 64],
      [2, 6 / 64],
      [3, 1 / 64],
    ]),
    support: [-3, -2, -1, 0, 1, 2, 3],
    variance: 1.5,
  },
} as const;

/**
 * Parámetros de visualización 3D derivados matemáticamente
 *
 * JUSTIFICACIÓN GEOMÉTRICA:
 *   - El toro T² = S¹ × S¹ representa el producto Z_n × Z_q
 *   - Radio mayor R proporcional a n para distribución uniforme de coeficientes
 *   - Radio menor r variable según magnitud del coeficiente
 */
export const VISUALIZATION_PARAMS = {
  /** Radio mayor del toro: R = n/10 para escala visual apropiada */
  TORUS_MAJOR_RADIUS: RING_PARAMS.N / 10, // 25.6 ≈ 25

  /** Radio menor base del toro */
  TORUS_MINOR_RADIUS: 8,

  /** Radio mínimo de esfera de coeficiente */
  COEFF_SPHERE_MIN_RADIUS: 0.3,

  /** Radio máximo de esfera de coeficiente */
  COEFF_SPHERE_MAX_RADIUS: 2.5,

  /** Separación vertical entre toros en un vector (proporcional a R) */
  VECTOR_TORUS_SEPARATION: 22,

  /** Separación entre toros en matriz (proporcional a 2R) */
  MATRIX_TORUS_SEPARATION: 60,

  /** Factor de escala logarítmica para coeficientes grandes */
  LOG_SCALE_FACTOR: 0.8,
} as const;

/**
 * Funciones auxiliares matemáticas
 */
export const MathUtils = {
  /**
   * Reducción modular centrada: mapea a {-⌊q/2⌋, ..., ⌊q/2⌋}
   */
  centerReduce(x: number, q: number = RING_PARAMS.Q): number {
    const r = ((x % q) + q) % q;
    return r > q / 2 ? r - q : r;
  },

  /**
   * Reducción modular estándar: mapea a {0, ..., q-1}
   */
  mod(x: number, q: number = RING_PARAMS.Q): number {
    return ((x % q) + q) % q;
  },

  /**
   * Muestreo CBD_η
   * Implementación exacta de la distribución binomial centrada
   */
  sampleCBD(eta: number): number {
    let sum = 0;
    for (let i = 0; i < eta; i++) {
      const a = Math.random() < 0.5 ? 0 : 1;
      const b = Math.random() < 0.5 ? 0 : 1;
      sum += a - b;
    }
    return sum;
  },

  /**
   * Genera vector de n coeficientes según CBD_η
   */
  sampleCBDVector(n: number = RING_PARAMS.N, eta: number = 2): number[] {
    const coeffs: number[] = [];
    for (let i = 0; i < n; i++) {
      const sample = this.sampleCBD(eta);
      // Convertir a representación positiva en Z_q si es negativo
      coeffs.push(sample < 0 ? RING_PARAMS.Q + sample : sample);
    }
    return coeffs;
  },

  /**
   * Genera vector de n coeficientes uniformes en Z_q
   */
  sampleUniform(n: number = RING_PARAMS.N): number[] {
    const coeffs: number[] = [];
    for (let i = 0; i < n; i++) {
      coeffs.push(Math.floor(Math.random() * RING_PARAMS.Q));
    }
    return coeffs;
  },

  /**
   * Codificación de mensaje: m ∈ {0,1}^n → R_q
   * Encode(m)_i = ⌈q/2⌋ · m_i
   */
  encodeMessage(bits: boolean[]): number[] {
    return bits.map((b) => (b ? RING_PARAMS.Q_HALF : 0));
  },

  /**
   * Decodificación de mensaje: R_q → {0,1}^n
   * Decode(a)_i = ⌊(2/q) · a_i⌉ mod 2
   */
  decodeMessage(coeffs: number[]): boolean[] {
    return coeffs.map((c) => {
      const centered = this.centerReduce(c);
      return Math.abs(centered) > RING_PARAMS.Q / 4;
    });
  },

  /**
   * Calcula la norma infinito de un polinomio (máximo coeficiente absoluto)
   * ||a||_∞ = max_i |a_i| (con reducción centrada)
   */
  infinityNorm(coeffs: number[]): number {
    return Math.max(...coeffs.map((c) => Math.abs(this.centerReduce(c))));
  },

  /**
   * Escala visual logarítmica para coeficientes
   * Mejora la visualización de valores pequeños vs grandes
   */
  logScale(value: number, q: number = RING_PARAMS.Q): number {
    const normalized = Math.abs(this.centerReduce(value, q)) / (q / 2);
    return Math.log1p(normalized * 10) / Math.log1p(10);
  },
};

/**
 * Etiquetas matemáticas para la UI
 */
export const MATH_LABELS = {
  RING: 'R_q = ℤ_q[X] / ⟨X^{256} + 1⟩',
  MODULUS: 'q = 3329',
  KEYGEN_T: 't = A·s + e',
  ENCAPS_U: 'u = Aᵀ·r + e₁',
  ENCAPS_V: 'v = tᵀ·r + e₂ + ⌈q/2⌋·m',
  DECAPS: "m' = Decode(v - sᵀ·u)",
  CBD: 'CBD_η: x = Σ(aᵢ - bᵢ)',
  PUBLIC_KEY: 'pk = (ρ, t)',
  SECRET_KEY: 'sk = s',
} as const;
