/**
 * Constantes matemáticas de CRYSTALS-Kyber (ML-KEM) según FIPS 203.
 * Anillo: R_q = Z_q[X] / (X^n + 1), donde n=256, q=3329.
 */

/** Parámetros del anillo polinomial R_q */
export const RING_PARAMS = {
  N: 256,
  Q: 3329,
  OMEGA: 17,
  Q_HALF: 1665,
  LOG_Q: 12,
} as const;

/** Niveles de seguridad NIST para Kyber */
export const SECURITY_PARAMS = {
  KYBER_512: { name: 'Kyber-512', k: 2, eta1: 3, eta2: 2, du: 10, dv: 4, securityLevel: 1 },
  KYBER_768: { name: 'Kyber-768', k: 3, eta1: 2, eta2: 2, du: 10, dv: 4, securityLevel: 3 },
  KYBER_1024: { name: 'Kyber-1024', k: 4, eta1: 2, eta2: 2, du: 11, dv: 5, securityLevel: 5 },
} as const;

export type SecurityLevel = keyof typeof SECURITY_PARAMS;

/** Distribución Binomial Centrada (CBD) para muestreo de secretos y errores */
export const CBD_DISTRIBUTION = {
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

/** Parámetros para la representación visual 3D */
export const VISUALIZATION_PARAMS = {
  TORUS_MAJOR_RADIUS: RING_PARAMS.N / 10,
  TORUS_MINOR_RADIUS: 8,
  COEFF_SPHERE_MIN_RADIUS: 0.3,
  COEFF_SPHERE_MAX_RADIUS: 2.5,
  VECTOR_TORUS_SEPARATION: 22,
  MATRIX_TORUS_SEPARATION: 60,
  LOG_SCALE_FACTOR: 0.8,
} as const;

/** Funciones matemáticas auxiliares */
export const MathUtils = {
  /** Reducción modular centrada: mapea a {-q/2, ..., q/2} */
  centerReduce(x: number, q: number = RING_PARAMS.Q): number {
    const r = ((x % q) + q) % q;
    return r > q / 2 ? r - q : r;
  },

  /** Reducción modular estándar: mapea a {0, ..., q-1} */
  mod(x: number, q: number = RING_PARAMS.Q): number {
    return ((x % q) + q) % q;
  },

  /** Muestrea un valor según CBD_η */
  sampleCBD(eta: number): number {
    let sum = 0;
    for (let i = 0; i < eta; i++) {
      const a = Math.random() < 0.5 ? 0 : 1;
      const b = Math.random() < 0.5 ? 0 : 1;
      sum += a - b;
    }
    return sum;
  },

  /** Genera n coeficientes según CBD_η */
  sampleCBDVector(n: number = RING_PARAMS.N, eta: number = 2): number[] {
    const coeffs: number[] = [];
    for (let i = 0; i < n; i++) {
      const sample = this.sampleCBD(eta);
      coeffs.push(sample < 0 ? RING_PARAMS.Q + sample : sample);
    }
    return coeffs;
  },

  /** Genera n coeficientes uniformes en Z_q */
  sampleUniform(n: number = RING_PARAMS.N): number[] {
    const coeffs: number[] = [];
    for (let i = 0; i < n; i++) {
      coeffs.push(Math.floor(Math.random() * RING_PARAMS.Q));
    }
    return coeffs;
  },

  /** Codifica mensaje binario en R_q: bit 1 -> q/2, bit 0 -> 0 */
  encodeMessage(bits: boolean[]): number[] {
    return bits.map((b) => (b ? RING_PARAMS.Q_HALF : 0));
  },

  /** Decodifica polinomio a mensaje binario */
  decodeMessage(coeffs: number[]): boolean[] {
    return coeffs.map((c) => {
      const centered = this.centerReduce(c);
      return Math.abs(centered) > RING_PARAMS.Q / 4;
    });
  },

  /** Calcula norma infinito ||a||_∞ */
  infinityNorm(coeffs: number[]): number {
    return Math.max(...coeffs.map((c) => Math.abs(this.centerReduce(c))));
  },

  /** Escala logarítmica para visualización de coeficientes */
  logScale(value: number, q: number = RING_PARAMS.Q): number {
    const normalized = Math.abs(this.centerReduce(value, q)) / (q / 2);
    return Math.log1p(normalized * 10) / Math.log1p(10);
  },
};

/** Etiquetas matemáticas para la interfaz */
export const MATH_LABELS = {
  RING: 'R_q = Z_q[X] / (X^256 + 1)',
  MODULUS: 'q = 3329',
  KEYGEN_T: 't = A·s + e',
  ENCAPS_U: 'u = A^T·r + e1',
  ENCAPS_V: 'v = t^T·r + e2 + (q/2)·m',
  DECAPS: "m' = Decode(v - s^T·u)",
  CBD: 'CBD_n: x = sum(ai - bi)',
  PUBLIC_KEY: 'pk = (rho, t)',
  SECRET_KEY: 'sk = s',
} as const;
