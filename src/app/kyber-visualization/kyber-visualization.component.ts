import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  signal,
  HostListener,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SceneService } from './services/scene.service';
import { KyberOrchestrator, KyberState } from './animations/kyber-orchestrator';

@Component({
  selector: 'app-kyber-visualization',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="visualization-container">
      <canvas #canvas></canvas>

      <div class="overlay">
        <div class="title">
          <h1>CRYSTALS-Kyber</h1>
          <p class="subtitle">Visualización 3D del cifrado post-cuántico</p>
        </div>

        <div class="status-panel">
          <div class="phase">{{ currentState().phase | uppercase }}</div>
          <div class="sub-phase">{{ currentState().subPhase }}</div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="currentState().progress * 100"></div>
          </div>
        </div>

        <div class="controls">
          <button
            (click)="runKeyGen()"
            [disabled]="isRunning()"
            [class.active]="currentState().phase === 'keygen'"
          >
            <span class="icon">🔑</span>
            KeyGen
          </button>
          <button
            (click)="runEncaps()"
            [disabled]="isRunning() || !hasKeys()"
            [class.active]="currentState().phase === 'encaps'"
          >
            <span class="icon">📦</span>
            Encaps
          </button>
          <button
            (click)="runDecaps()"
            [disabled]="isRunning() || !hasCipher()"
            [class.active]="currentState().phase === 'decaps'"
          >
            <span class="icon">🔓</span>
            Decaps
          </button>
          <button (click)="runFullDemo()" [disabled]="isRunning()" class="demo-btn">
            <span class="icon">▶️</span>
            Demo Completa
          </button>
          <button (click)="reset()" class="reset-btn">
            <span class="icon">🔄</span>
            Reset
          </button>
        </div>

        <div class="legend">
          <h3>Leyenda</h3>
          <div class="legend-item">
            <span class="color-box matrix-a"></span>
            <span>Matriz A (pública)</span>
          </div>
          <div class="legend-item">
            <span class="color-box secret-s"></span>
            <span>Secreto s (privado)</span>
          </div>
          <div class="legend-item">
            <span class="color-box vector-t"></span>
            <span>Vector t (público)</span>
          </div>
          <div class="legend-item">
            <span class="color-box error-e"></span>
            <span>Errores e (ruido)</span>
          </div>
          <div class="legend-item">
            <span class="color-box cipher"></span>
            <span>Cifrado (u, v)</span>
          </div>
          <div class="legend-item">
            <span class="color-box message"></span>
            <span>Mensaje m</span>
          </div>
        </div>

        <div class="info-panel">
          <p>
            <strong>Rq = Zq[X]/(X²⁵⁶+1)</strong>, q=3329
          </p>
          <p>Kyber-768 (k=3)</p>
          <p>Usa el mouse para rotar la vista</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .visualization-container {
        width: 100%;
        height: 100vh;
        position: relative;
        overflow: hidden;
        background: linear-gradient(135deg, #000a14 0%, #001133 100%);
      }

      canvas {
        width: 100%;
        height: 100%;
        display: block;
      }

      .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        padding: 20px;
      }

      .title {
        text-align: center;
        color: white;
        margin-bottom: 20px;
      }

      .title h1 {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 2.5rem;
        margin: 0;
        background: linear-gradient(90deg, #00bfff, #ffd700, #50c878);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .subtitle {
        font-size: 1rem;
        opacity: 0.7;
        margin-top: 5px;
      }

      .status-panel {
        position: absolute;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.7);
        padding: 15px 30px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        text-align: center;
        min-width: 300px;
      }

      .phase {
        font-family: 'JetBrains Mono', monospace;
        font-size: 1.2rem;
        color: #00bfff;
        font-weight: bold;
      }

      .sub-phase {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
        margin-top: 5px;
      }

      .progress-bar {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        margin-top: 10px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #00bfff, #50c878);
        transition: width 0.3s ease;
      }

      .controls {
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 15px;
        pointer-events: auto;
      }

      .controls button {
        font-family: 'JetBrains Mono', monospace;
        padding: 12px 24px;
        font-size: 1rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .controls button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
      }

      .controls button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .controls button.active {
        background: rgba(0, 191, 255, 0.3);
        border-color: #00bfff;
      }

      .controls button.demo-btn {
        background: linear-gradient(135deg, rgba(80, 200, 120, 0.3), rgba(0, 191, 255, 0.3));
        border-color: #50c878;
      }

      .controls button.reset-btn {
        background: rgba(139, 0, 0, 0.3);
        border-color: #8b0000;
      }

      .icon {
        font-size: 1.2rem;
      }

      .legend {
        position: absolute;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.7);
        padding: 15px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
      }

      .legend h3 {
        margin: 0 0 10px 0;
        font-size: 0.9rem;
        opacity: 0.7;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
        font-size: 0.85rem;
      }

      .color-box {
        width: 16px;
        height: 16px;
        border-radius: 4px;
      }

      .matrix-a {
        background: #c0c0c0;
      }
      .secret-s {
        background: #8b0000;
      }
      .vector-t {
        background: #ffd700;
      }
      .error-e {
        background: #9400d3;
      }
      .cipher {
        background: #50c878;
      }
      .message {
        background: #ffffff;
      }

      .info-panel {
        position: absolute;
        left: 20px;
        bottom: 100px;
        background: rgba(0, 0, 0, 0.7);
        padding: 15px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.8rem;
      }

      .info-panel p {
        margin: 5px 0;
      }
    `,
  ],
})
export class KyberVisualizationComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private sceneService = inject(SceneService);
  private platformId = inject(PLATFORM_ID);
  private orchestrator!: KyberOrchestrator;
  private isBrowser = false;

  currentState = signal<KyberState>({
    phase: 'idle',
    subPhase: 'Listo para iniciar',
    progress: 0,
  });

  isRunning = signal(false);
  hasKeys = signal(false);
  hasCipher = signal(false);

  ngAfterViewInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.initScene();
    }
  }

  private initScene(): void {
    if (!this.isBrowser) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.sceneService.initialize(this.canvasRef, width, height);

    this.orchestrator = new KyberOrchestrator(this.sceneService.getScene(), 3);

    this.orchestrator.setStateChangeCallback((state) => {
      this.currentState.set(state);

      // Actualizar flags
      if (state.phase === 'keygen' && state.progress === 1) {
        this.hasKeys.set(true);
      }
      if (state.phase === 'encaps' && state.progress === 1) {
        this.hasCipher.set(true);
      }
    });

    // Agregar callback de actualización
    this.sceneService.addAnimationCallback((delta, elapsed) => {
      this.orchestrator.update(delta, elapsed);
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isBrowser) {
      this.sceneService.resize(window.innerWidth, window.innerHeight);
    }
  }

  async runKeyGen(): Promise<void> {
    this.isRunning.set(true);
    await this.orchestrator.runKeyGen();
    this.isRunning.set(false);
  }

  async runEncaps(): Promise<void> {
    this.isRunning.set(true);
    await this.orchestrator.runEncaps();
    this.isRunning.set(false);
  }

  async runDecaps(): Promise<void> {
    this.isRunning.set(true);
    await this.orchestrator.runDecaps();
    this.isRunning.set(false);
  }

  async runFullDemo(): Promise<void> {
    this.isRunning.set(true);
    await this.orchestrator.runFullDemo();
    this.isRunning.set(false);
  }

  reset(): void {
    if (!this.isBrowser || !this.orchestrator) return;
    this.orchestrator.reset();
    this.hasKeys.set(false);
    this.hasCipher.set(false);
    this.currentState.set({
      phase: 'idle',
      subPhase: 'Listo para iniciar',
      progress: 0,
    });
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.sceneService.dispose();
    }
  }
}
