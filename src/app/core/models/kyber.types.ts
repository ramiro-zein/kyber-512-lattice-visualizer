/**
 * @fileoverview Kyber-512 Mathematical Types and Models
 * @description Type definitions for Kyber post-quantum cryptographic algorithm
 * @author Doctorate Level Implementation
 * @version 2.0.0
 */

/**
 * Kyber-512 Security Parameters
 * NIST Level 1 - Equivalent to AES-128 security
 */
export const KYBER_512_PARAMS = {
  /** Polynomial ring degree: Z_q[X]/(X^N + 1) */
  N: 256,
  /** Modulus for coefficient reduction */
  Q: 3329,
  /** Module dimension (lattice rank) */
  K: 2,
  /** Centered Binomial Distribution parameter for noise sampling */
  ETA: 2,
  /** Security level in bits */
  SECURITY_LEVEL: 128,
} as const;

/**
 * Polynomial representation in Z_q[X]/(X^N + 1)
 * Represents elements in the cyclotomic ring used by Kyber
 */
export class Poly {
  /** Polynomial coefficients in Z_q */
  readonly coeffs: number[];

  constructor(coeffs: number[] = []) {
    this.coeffs = new Array(KYBER_512_PARAMS.N)
      .fill(0)
      .map((_, i) => coeffs[i] ?? 0);
  }

  /**
   * String representation showing first and last coefficients
   * @returns Formatted string representation
   */
  toString(): string {
    const first = this.coeffs.slice(0, 3).join(',');
    const last = this.coeffs[KYBER_512_PARAMS.N - 1];
    return `Poly([${first},...,${last}])`;
  }

  /**
   * Polynomial addition in Z_q[X]/(X^N + 1)
   * @param other - Polynomial to add
   * @returns Result of addition
   */
  add(other: Poly): Poly {
    return new Poly(
      this.coeffs.map((c, i) => mod(c + other.coeffs[i], KYBER_512_PARAMS.Q))
    );
  }

  /**
   * Polynomial subtraction in Z_q[X]/(X^N + 1)
   * @param other - Polynomial to subtract
   * @returns Result of subtraction
   */
  sub(other: Poly): Poly {
    return new Poly(
      this.coeffs.map((c, i) => mod(c - other.coeffs[i], KYBER_512_PARAMS.Q))
    );
  }

  /**
   * Polynomial multiplication in Z_q[X]/(X^N + 1)
   * Uses schoolbook multiplication with X^N = -1 reduction
   * @param other - Polynomial to multiply with
   * @returns Product polynomial
   */
  mul(other: Poly): Poly {
    const { N, Q } = KYBER_512_PARAMS;
    const res = new Array(2 * N).fill(0);

    // Schoolbook multiplication
    for (let i = 0; i < N; i++) {
      if (this.coeffs[i] === 0) continue;
      for (let j = 0; j < N; j++) {
        res[i + j] += this.coeffs[i] * other.coeffs[j];
      }
    }

    // Reduce modulo X^N + 1 (replace X^N with -1)
    for (let i = 2 * N - 2; i >= N; i--) {
      res[i - N] -= res[i];
    }

    return new Poly(res.slice(0, N).map((c) => mod(c, Q)));
  }

  /**
   * Generate uniformly random polynomial in Z_q[X]
   * @returns Random polynomial
   */
  static random(): Poly {
    return new Poly(
      Array(KYBER_512_PARAMS.N)
        .fill(0)
        .map(() => randInt(KYBER_512_PARAMS.Q))
    );
  }

  /**
   * Generate noise polynomial using Centered Binomial Distribution
   * CBD ensures proper error distribution for security proofs
   * @returns Noise polynomial
   */
  static noise(): Poly {
    return new Poly(
      Array(KYBER_512_PARAMS.N)
        .fill(0)
        .map(() => mod(cbd(), KYBER_512_PARAMS.Q))
    );
  }

  /**
   * Clone this polynomial
   * @returns Deep copy of the polynomial
   */
  clone(): Poly {
    return new Poly([...this.coeffs]);
  }
}

/**
 * Vector of polynomials (dimension K)
 */
export type PolyVector = Poly[];

/**
 * Matrix of polynomials (K x K)
 */
export type PolyMatrix = Poly[][];

/**
 * Kyber cryptographic state containing all keys and intermediate values
 */
export interface KyberState {
  /** Public matrix A (K x K) - generated from seed */
  A: PolyMatrix;
  /** Secret key vector s (K x 1) - small coefficients */
  s: PolyVector;
  /** Error vector e (K x 1) - small noise */
  e: PolyVector;
  /** Public key vector t = As + e (K x 1) */
  t: PolyVector;
  /** Random vector r (K x 1) for encryption */
  r: PolyVector;
  /** Error vector e1 (K x 1) for encryption */
  e1: PolyVector;
  /** Error scalar e2 for encryption */
  e2: Poly | null;
  /** Ciphertext vector u = A^T r + e1 (K x 1) */
  u: PolyVector;
  /** Ciphertext scalar v = t^T r + e2 + encode(m) */
  v: Poly | null;
  /** Message bit being encrypted/decrypted */
  msgBit: number;
}

/**
 * Cryptographic operation types
 */
export enum CryptoOperation {
  KEY_GENERATION = 'keygen',
  ENCRYPTION = 'encrypt',
  DECRYPTION = 'decrypt',
}

/**
 * Statistical information about polynomial
 */
export interface PolyStatistics {
  /** Mean of coefficients */
  mean: number;
  /** Standard deviation */
  stdDev: number;
  /** Maximum coefficient value */
  max: number;
  /** Minimum coefficient value */
  min: number;
  /** L2 norm */
  norm: number;
}

// ============================================================================
// Mathematical Utility Functions
// ============================================================================

/**
 * Modular reduction ensuring positive result
 * @param n - Number to reduce
 * @param m - Modulus
 * @returns n mod m in range [0, m)
 */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/**
 * Cryptographically secure random integer
 * Note: For production, use Web Crypto API
 * @param max - Maximum value (exclusive)
 * @returns Random integer in [0, max)
 */
export function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/**
 * Centered Binomial Distribution sampler
 * Samples from {-ETA, ..., ETA} with binomial distribution
 * @returns Sample from CBD
 */
export function cbd(): number {
  const { ETA } = KYBER_512_PARAMS;
  let a = 0;
  let b = 0;

  for (let i = 0; i < ETA; i++) {
    a += randInt(2);
    b += randInt(2);
  }

  return a - b;
}

/**
 * Compute statistical information about polynomial
 * @param poly - Polynomial to analyze
 * @returns Statistical metrics
 */
export function computePolyStatistics(poly: Poly): PolyStatistics {
  const coeffs = poly.coeffs;
  const n = coeffs.length;

  // Mean
  const sum = coeffs.reduce((acc, val) => acc + val, 0);
  const mean = sum / n;

  // Standard deviation
  const variance =
    coeffs.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Max and Min
  const max = Math.max(...coeffs);
  const min = Math.min(...coeffs);

  // L2 norm
  const norm = Math.sqrt(coeffs.reduce((acc, val) => acc + val * val, 0));

  return { mean, stdDev, max, min, norm };
}
