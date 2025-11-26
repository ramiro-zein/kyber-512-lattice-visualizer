import {
  Component,
  ElementRef,
  ViewChild,
  afterNextRender,
  Injector,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { KyberCryptoService, CryptoEvent, CryptoOperation } from './core/services/kyber-crypto.service';
import { ThreeVisualizationService } from './core/services/three-visualization.service';
import { KYBER_512_PARAMS, PolyStatistics, computePolyStatistics } from './core/models/kyber.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MathAnalysisPanelComponent } from './components/kyber-visualization/math-analysis-panel.component';
import { EducationalPanelComponent } from './components/kyber-visualization/educational-panel.component';

/**
 * Main application component for Kyber-512 visualization
 * Orchestrates cryptographic operations and 3D visualization
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MathAnalysisPanelComponent, EducationalPanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnDestroy {
  @ViewChild('canvasContainer', { static: false })
  canvasContainer!: ElementRef<HTMLDivElement>;

  // UI state
  isKeyGenDisabled = false;
  isEncryptDisabled = true;
  isDecryptDisabled = true;

  // Kyber parameters for display
  readonly kyberParams = KYBER_512_PARAMS;

  // Analysis panels state
  currentPolyStats: PolyStatistics | null = null;
  currentPolyName: string = '';
  currentOperation: CryptoOperation | null = null;

  // Platform check
  private isBrowser: boolean;

  constructor(
    private injector: Injector,
    private cryptoService: KyberCryptoService,
    private visualService: ThreeVisualizationService
  ) {
    this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    // Initialize 3D scene after render
    afterNextRender(
      () => {
        this.visualService.initialize(this.canvasContainer);
        this.setupEventListeners();
      },
      { injector: this.injector }
    );

    // Subscribe to crypto events for logging
    this.cryptoService.events$
      .pipe(takeUntilDestroyed())
      .subscribe((events) => {
        if (events.length > 0) {
          const latestEvent = events[events.length - 1];
          this.handleCryptoEvent(latestEvent);
        }
      });
  }

  ngOnDestroy(): void {
    this.visualService.dispose();
  }

  /**
   * Setup listeners for crypto state changes
   */
  private setupEventListeners(): void {
    this.cryptoService.state$.pipe(takeUntilDestroyed()).subscribe((state) => {
      // Update UI state based on crypto state
      this.isEncryptDisabled = state.t.length === 0;
      this.isDecryptDisabled = state.u.length === 0 || state.v === null;
    });
  }

  /**
   * Handle crypto events and update visualization
   */
  private handleCryptoEvent(event: CryptoEvent): void {
    this.log(event.message, event.type);
  }

  // ========================================================================
  // CRYPTOGRAPHIC OPERATIONS WITH VISUALIZATION
  // ========================================================================

  /**
   * Generate Kyber-512 key pair
   */
  async runKeyGen(): Promise<void> {
    this.isKeyGenDisabled = true;
    this.visualService.clearAll();
    this.currentOperation = CryptoOperation.KEY_GENERATION;

    try {
      // Generate keys
      await this.cryptoService.generateKeys();

      const state = this.cryptoService.currentState;

      // Update analysis panel with matrix A[0][0]
      this.currentPolyStats = computePolyStatistics(state.A[0][0]);
      this.currentPolyName = 'A[0,0] - Matriz Pública';

      // Visualize matrix A
      this.visualService.visualizeMatrixA(state.A);

      // Visualize secret after delay
      setTimeout(() => {
        this.visualService.visualizeSecretS(state.s);
        // Update analysis with secret s[0]
        this.currentPolyStats = computePolyStatistics(state.s[0]);
        this.currentPolyName = 's[0] - Vector Secreto (CBD)';
      }, 1200);

      // Visualize public key after delay
      setTimeout(() => {
        this.visualService.visualizePublicKeyT(state.t);
        // Update analysis with public key t[0]
        this.currentPolyStats = computePolyStatistics(state.t[0]);
        this.currentPolyName = 't[0] - Llave Pública';
      }, 3000);

      // Enable encryption after completion
      setTimeout(() => {
        this.isEncryptDisabled = false;
      }, 4500);
    } catch (error) {
      console.error('Key generation error:', error);
      this.log('Error en generación de llaves', 'error');
    } finally {
      this.isKeyGenDisabled = false;
    }
  }

  /**
   * Encrypt a bit
   */
  async startEncrypt(bit: number): Promise<void> {
    if (!this.cryptoService.hasKeys()) {
      this.log('Primero debes generar las llaves', 'error');
      return;
    }

    this.visualService.clearRound();
    this.currentOperation = CryptoOperation.ENCRYPTION;

    try {
      // Show message
      this.visualService.visualizeMessage(bit);

      // Encrypt
      await this.cryptoService.encrypt(bit);

      const state = this.cryptoService.currentState;

      // Update analysis with random vector r[0]
      this.currentPolyStats = computePolyStatistics(state.r[0]);
      this.currentPolyName = 'r[0] - Vector Aleatorio (CBD)';

      // Visualize u vector
      setTimeout(() => {
        this.visualService.visualizeCiphertextU(state.u);
        // Update analysis with u[0]
        this.currentPolyStats = computePolyStatistics(state.u[0]);
        this.currentPolyName = 'u[0] - Ciphertext (parte 1)';
      }, 1200);

      // Visualize v polynomial
      setTimeout(() => {
        if (state.v) {
          this.visualService.visualizeCiphertextV(state.v);
          // Update analysis with v
          this.currentPolyStats = computePolyStatistics(state.v);
          this.currentPolyName = 'v - Ciphertext (parte 2)';
        }
      }, 2500);

      // Animate transmission
      setTimeout(async () => {
        await this.visualService.animateCiphertextTransmission();
        this.isDecryptDisabled = false;
      }, 4000);
    } catch (error) {
      console.error('Encryption error:', error);
      this.log('Error en encriptación', 'error');
    }
  }

  /**
   * Decrypt ciphertext
   */
  async runDecrypt(): Promise<void> {
    if (!this.cryptoService.hasCiphertext()) {
      this.log('Primero debes encriptar un mensaje', 'error');
      return;
    }

    this.currentOperation = CryptoOperation.DECRYPTION;

    try {
      const decryptedBit = await this.cryptoService.decrypt();
      const state = this.cryptoService.currentState;

      // Compute noisy message for visualization
      const { Poly: PolyClass } = await import('./core/models/kyber.types');
      let s_dot_u = new PolyClass();
      state.s.forEach((p, i) => {
        s_dot_u = s_dot_u.add(p.mul(state.u[i]));
      });
      const noisyM = state.v!.sub(s_dot_u);

      const success = decryptedBit === state.msgBit;

      // Update analysis with noisy message
      this.currentPolyStats = computePolyStatistics(noisyM);
      this.currentPolyName = `m' - Mensaje Recuperado (bit=${decryptedBit})`;

      setTimeout(() => {
        this.visualService.visualizeDecryptionResult(noisyM, decryptedBit, success);
      }, 1000);
    } catch (error) {
      console.error('Decryption error:', error);
      this.log('Error en desencriptación', 'error');
    }
  }

  // ========================================================================
  // UI HELPER METHODS
  // ========================================================================

  /**
   * Log message to UI
   */
  private log(msg: string, type: 'info' | 'action' | 'success' | 'error' = 'info'): void {
    // Only run in browser environment
    if (!this.isBrowser) return;

    const logDiv = document.getElementById('status-log');
    if (!logDiv) return;

    const p = document.createElement('div');
    let clr = 'text-slate-400';
    let borderClr = 'border-slate-800';

    switch (type) {
      case 'success':
        clr = 'text-emerald-400';
        borderClr = 'border-emerald-600';
        break;
      case 'error':
        clr = 'text-red-400';
        borderClr = 'border-red-600';
        break;
      case 'action':
        clr = 'text-cyan-300';
        borderClr = 'border-cyan-600';
        break;
    }

    const time = new Date().toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    p.innerHTML = `<span class="text-slate-600 text-[10px] mr-2 font-sans hidden sm:inline">${time}</span> ${msg}`;
    p.className = `pl-2 border-l-2 ${borderClr} ${clr} py-1 transition-all hover:bg-slate-800/50 mb-1`;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;
  }
}
