import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  KyberState,
  Poly,
  PolyVector,
  PolyMatrix,
  KYBER_512_PARAMS,
  CryptoOperation,
  computePolyStatistics,
} from '../models/kyber.types';

// Re-export for convenience
export { CryptoOperation } from '../models/kyber.types';

/**
 * Event emitted during cryptographic operations
 */
export interface CryptoEvent {
  /** Type of operation */
  operation: CryptoOperation;
  /** Current step description */
  step: string;
  /** Detailed message */
  message: string;
  /** Event type */
  type: 'info' | 'action' | 'success' | 'error';
  /** Timestamp */
  timestamp: Date;
  /** Optional data payload */
  data?: any;
}

/**
 * Service managing Kyber-512¶ cryptographic operations
 * Implements the full Kyber Key Encapsulation Mechanism
 */
@Injectable({
  providedIn: 'root',
})
export class KyberCryptoService {
  /** Current cryptographic state */
  private stateSubject = new BehaviorSubject<KyberState>(this.createEmptyState());
  public state$: Observable<KyberState> = this.stateSubject.asObservable();

  /** Event stream for cryptographic operations */
  private eventsSubject = new BehaviorSubject<CryptoEvent[]>([]);
  public events$: Observable<CryptoEvent[]> = this.eventsSubject.asObservable();

  constructor() {
    this.logEvent({
      operation: CryptoOperation.KEY_GENERATION,
      step: 'init',
      message: 'Mapa inicializado',
      type: 'info',
      timestamp: new Date(),
    });
  }

  /**
   * Get current state
   */
  get currentState(): KyberState {
    return this.stateSubject.value;
  }

  /**
   * Create empty initial state
   */
  private createEmptyState(): KyberState {
    return {
      A: [],
      s: [],
      e: [],
      t: [],
      r: [],
      e1: [],
      e2: null,
      u: [],
      v: null,
      msgBit: 0,
    };
  }

  /**
   * Log cryptographic event
   */
  private logEvent(event: CryptoEvent): void {
    const events = [...this.eventsSubject.value, event];
    this.eventsSubject.next(events);
  }

  /**
   * Clear event log
   */
  public clearEvents(): void {
    this.eventsSubject.next([]);
  }

  // ========================================================================
  // KEY GENERATION
  // ========================================================================

  /**
   * Generate Kyber-512 key pair
   * Algorithm 1 from CRYSTALS-Kyber specification
   *
   * @returns Promise resolving when key generation complete
   */
  public async generateKeys(): Promise<void> {
    const { K } = KYBER_512_PARAMS;

    this.logEvent({
      operation: CryptoOperation.KEY_GENERATION,
      step: 'start',
      message: `Iniciando KeyGen Kyber-512 (N=${KYBER_512_PARAMS.N}, Q=${KYBER_512_PARAMS.Q}, K=${K})`,
      type: 'action',
      timestamp: new Date(),
    });

    // Step 1: Generate public matrix A (uniform random)
    const A: PolyMatrix = Array(K)
      .fill(null)
      .map(() =>
        Array(K)
          .fill(null)
          .map(() => Poly.random())
      );

    this.logEvent({
      operation: CryptoOperation.KEY_GENERATION,
      step: 'matrix_A',
      message: `Matriz pública A generada (${K}×${K} polinomios uniformes en Zq[X])`,
      type: 'info',
      timestamp: new Date(),
      data: { matrixSize: K * K },
    });

    // Step 2: Generate secret vector s (small noise via CBD)
    const s: PolyVector = Array(K)
      .fill(null)
      .map(() => Poly.noise());

    this.logEvent({
      operation: CryptoOperation.KEY_GENERATION,
      step: 'secret_s',
      message: `Vector secreto s generado usando CBD con η=${KYBER_512_PARAMS.ETA}`,
      type: 'info',
      timestamp: new Date(),
      data: { vectorStats: s.map(computePolyStatistics) },
    });

    // Step 3: Generate error vector e (small noise via CBD)
    const e: PolyVector = Array(K)
      .fill(null)
      .map(() => Poly.noise());

    // Step 4: Compute public key t = As + e
    // Matrix-vector multiplication in polynomial ring
    const As: PolyVector = A.map((row) => {
      let sum = new Poly();
      row.forEach((poly, i) => {
        sum = sum.add(poly.mul(s[i]));
      });
      return sum;
    });

    const t: PolyVector = As.map((poly, i) => poly.add(e[i]));

    this.logEvent({
      operation: CryptoOperation.KEY_GENERATION,
      step: 'public_key',
      message: 'Llave pública t = As + e calculada',
      type: 'success',
      timestamp: new Date(),
      data: { publicKeyStats: t.map(computePolyStatistics) },
    });

    // Update state
    this.stateSubject.next({
      ...this.currentState,
      A,
      s,
      e,
      t,
    });

    this.logEvent({
      operation: CryptoOperation.KEY_GENERATION,
      step: 'complete',
      message: 'Generación de llaves completada. Listas para encriptación.',
      type: 'success',
      timestamp: new Date(),
    });
  }

  // ========================================================================
  // ENCRYPTION
  // ========================================================================

  /**
   * Encrypt a single bit using Kyber-512
   * Algorithm 2 from CRYSTALS-Kyber specification
   *
   * @param bit - Message bit to encrypt (0 or 1)
   * @returns Promise resolving when encryption complete
   */
  public async encrypt(bit: number): Promise<void> {
    if (bit !== 0 && bit !== 1) {
      throw new Error('Message must be a single bit (0 or 1)');
    }

    if (this.currentState.t.length === 0) {
      throw new Error('Keys must be generated before encryption');
    }

    const { K, Q, N } = KYBER_512_PARAMS;

    this.logEvent({
      operation: CryptoOperation.ENCRYPTION,
      step: 'start',
      message: `Iniciando encriptación del bit m = ${bit}`,
      type: 'action',
      timestamp: new Date(),
    });

    // Step 1: Generate random vector r (noise via CBD)
    const r: PolyVector = Array(K)
      .fill(null)
      .map(() => Poly.noise());

    // Step 2: Generate error vectors e1, e2
    const e1: PolyVector = Array(K)
      .fill(null)
      .map(() => Poly.noise());
    const e2: Poly = Poly.noise();

    this.logEvent({
      operation: CryptoOperation.ENCRYPTION,
      step: 'randomness',
      message: `Vectores aleatorios r, e1, e2 generados con CBD(η=${KYBER_512_PARAMS.ETA})`,
      type: 'info',
      timestamp: new Date(),
    });

    // Step 3: Encode message bit
    const encodedVal = bit === 1 ? Math.floor(Q / 2) : 0;
    const msgPoly = new Poly([encodedVal, ...new Array(N - 1).fill(0)]);

    this.logEvent({
      operation: CryptoOperation.ENCRYPTION,
      step: 'encode',
      message: `Mensaje codificado: m=${bit} → m'[0]=${encodedVal} (⌊q/2⌋=${Math.floor(Q / 2)})`,
      type: 'info',
      timestamp: new Date(),
    });

    // Step 4: Compute u = A^T * r + e1
    const { A } = this.currentState;
    const u_vec: PolyVector = Array(K)
      .fill(null)
      .map(() => new Poly());

    // Matrix transpose multiplication
    for (let i = 0; i < K; i++) {
      for (let j = 0; j < K; j++) {
        u_vec[j] = u_vec[j].add(A[i][j].mul(r[i]));
      }
    }
    const u: PolyVector = u_vec.map((poly, i) => poly.add(e1[i]));

    this.logEvent({
      operation: CryptoOperation.ENCRYPTION,
      step: 'ciphertext_u',
      message: 'Componente ciphertext u = A^T·r + e1 calculado',
      type: 'info',
      timestamp: new Date(),
    });

    // Step 5: Compute v = t^T * r + e2 + encode(m)
    const { t } = this.currentState;
    let t_dot_r = new Poly();
    t.forEach((poly, i) => {
      t_dot_r = t_dot_r.add(poly.mul(r[i]));
    });
    const v: Poly = t_dot_r.add(e2).add(msgPoly);

    this.logEvent({
      operation: CryptoOperation.ENCRYPTION,
      step: 'ciphertext_v',
      message: 'Componente ciphertext v = t^T·r + e2 + encode(m) calculado',
      type: 'info',
      timestamp: new Date(),
    });

    // Update state
    this.stateSubject.next({
      ...this.currentState,
      r,
      e1,
      e2,
      u,
      v,
      msgBit: bit,
    });

    this.logEvent({
      operation: CryptoOperation.ENCRYPTION,
      step: 'complete',
      message: `Encriptación completa. Ciphertext (u, v) generado para m=${bit}`,
      type: 'success',
      timestamp: new Date(),
      data: {
        ciphertextStats: {
          u: u.map(computePolyStatistics),
          v: computePolyStatistics(v),
        },
      },
    });
  }

  // ========================================================================
  // DECRYPTION
  // ========================================================================

  /**
   * Decrypt ciphertext using Kyber-512
   * Algorithm 3 from CRYSTALS-Kyber specification
   *
   * @returns Promise resolving to decrypted bit
   */
  public async decrypt(): Promise<number> {
    const { s, u, v, msgBit } = this.currentState;

    if (s.length === 0 || u.length === 0 || !v) {
      throw new Error('Invalid state for decryption');
    }

    const { Q } = KYBER_512_PARAMS;

    this.logEvent({
      operation: CryptoOperation.DECRYPTION,
      step: 'start',
      message: 'Iniciando desencriptación usando llave secreta s',
      type: 'action',
      timestamp: new Date(),
    });

    // Step 1: Compute s^T * u
    let s_dot_u = new Poly();
    s.forEach((poly, i) => {
      s_dot_u = s_dot_u.add(poly.mul(u[i]));
    });

    this.logEvent({
      operation: CryptoOperation.DECRYPTION,
      step: 'inner_product',
      message: 'Producto interno s^T·u calculado',
      type: 'info',
      timestamp: new Date(),
    });

    // Step 2: Compute noisy message: m' = v - s^T * u
    const noisyM = v.sub(s_dot_u);

    // Step 3: Decode by comparing to Q/2
    const coeff = noisyM.coeffs[0];
    const lowerBound = Math.floor(Q / 4);
    const upperBound = Math.floor((3 * Q) / 4);
    // Per FIPS 203: decode to 1 if coefficient ∈ [⌊q/4⌋, ⌊3q/4⌋], else 0
    const decryptedBit = coeff >= lowerBound && coeff <= upperBound ? 1 : 0;

    this.logEvent({
      operation: CryptoOperation.DECRYPTION,
      step: 'decode',
      message: `Decodificación: coef=${coeff}, límites=[${lowerBound}, ${upperBound}] → m'=${decryptedBit}`,
      type: 'info',
      timestamp: new Date(),
      data: {
        coefficient: coeff,
        bounds: { lower: lowerBound, upper: upperBound },
        noisyStats: computePolyStatistics(noisyM),
      },
    });

    const success = decryptedBit === msgBit;
    this.logEvent({
      operation: CryptoOperation.DECRYPTION,
      step: 'complete',
      message: success
        ? `¡Éxito! Bit ${decryptedBit} recuperado correctamente`
        : `Error de decodificación: esperado ${msgBit}, obtenido ${decryptedBit}`,
      type: success ? 'success' : 'error',
      timestamp: new Date(),
    });

    return decryptedBit;
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Reset cryptographic state
   */
  public reset(): void {
    this.stateSubject.next(this.createEmptyState());
    this.clearEvents();
    this.logEvent({
      operation: CryptoOperation.KEY_GENERATION,
      step: 'reset',
      message: 'Sistema reiniciado',
      type: 'info',
      timestamp: new Date(),
    });
  }

  /**
   * Check if keys are generated
   */
  public hasKeys(): boolean {
    return this.currentState.t.length > 0;
  }

  /**
   * Check if ciphertext exists
   */
  public hasCiphertext(): boolean {
    return this.currentState.u.length > 0 && this.currentState.v !== null;
  }
}
