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

/**
 * Componente principal de visualización 3D de CRYSTALS-Kyber.
 * Renderiza la escena Three.js y proporciona controles de interacción.
 */
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
          <p class="subtitle">Visualizacion 3D del cifrado post-cuantico</p>
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
            class="btn-keygen">
            KeyGen
          </button>
          <button
            (click)="runEncaps()"
            [disabled]="isRunning() || !hasKeys()"
            [class.active]="currentState().phase === 'encaps'"
            class="btn-encaps">
            Encaps
          </button>
          <button
            (click)="runDecaps()"
            [disabled]="isRunning() || !hasCipher()"
            [class.active]="currentState().phase === 'decaps'"
            class="btn-decaps">
            Decaps
          </button>
          <button (click)="runFullDemo()" [disabled]="isRunning()" class="btn-demo">
            Demo Completa
          </button>
          <button (click)="reset()" class="btn-reset">
            Reset
          </button>
        </div>

        <div class="legend">
          <h3>Elementos</h3>
          <div class="legend-item">
            <span class="color-box matrix-a"></span>
            <span>A : matriz publica</span>
          </div>
          <div class="legend-item">
            <span class="color-box secret-s"></span>
            <span>s : secreto (sk)</span>
          </div>
          <div class="legend-item">
            <span class="color-box vector-t"></span>
            <span>t = As + e</span>
          </div>
          <div class="legend-item">
            <span class="color-box error-e"></span>
            <span>e : error CBD</span>
          </div>
          <div class="legend-item">
            <span class="color-box cipher"></span>
            <span>c = (u, v)</span>
          </div>
          <div class="legend-item">
            <span class="color-box message"></span>
            <span>m : mensaje</span>
          </div>
        </div>

        <div class="info-panel">
          <p><strong>Rq = Zq[X]/(X^256+1)</strong>, q=3329</p>
          <p>Kyber-768 (k=3)</p>
          <p>Usa el mouse para rotar la vista</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
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
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 2rem;
      margin: 0;
      color: #e8e8e8;
      font-weight: 400;
      letter-spacing: 2px;
    }

    .subtitle {
      font-size: 1rem;
      opacity: 0.7;
      margin-top: 5px;
    }

    .status-panel {
      position: absolute;
      top: 90px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(20, 24, 32, 0.92);
      padding: 14px 28px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      text-align: center;
      min-width: 320px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    .phase {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 1rem;
      color: #70a0c0;
      font-weight: 500;
      letter-spacing: 1px;
    }

    .sub-phase {
      color: #909090;
      font-size: 0.8rem;
      margin-top: 6px;
      font-family: 'Consolas', monospace;
    }

    .progress-bar {
      width: 100%;
      height: 3px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1px;
      margin-top: 10px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4080a0, #60a080);
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
      font-family: 'Consolas', 'Monaco', monospace;
      padding: 10px 20px;
      font-size: 0.9rem;
      font-weight: 500;
      letter-spacing: 0.5px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-transform: uppercase;
      background: rgba(40, 44, 52, 0.9);
      color: #e0e0e0;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .controls button:hover:not(:disabled) {
      background: rgba(60, 64, 72, 0.95);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    }

    .controls button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .controls button.active {
      background: rgba(0, 120, 180, 0.8);
      border-color: #0090d0;
      color: #ffffff;
    }

    .controls button.btn-keygen { border-left: 3px solid #c0c0c0; }
    .controls button.btn-encaps { border-left: 3px solid #50c878; }
    .controls button.btn-decaps { border-left: 3px solid #ffd700; }
    .controls button.btn-demo {
      background: rgba(0, 80, 120, 0.8);
      border-left: 3px solid #00bfff;
    }
    .controls button.btn-reset {
      background: rgba(80, 40, 40, 0.8);
      border-left: 3px solid #8b4444;
    }

    .legend {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(20, 24, 32, 0.92);
      padding: 16px 20px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #d0d0d0;
      font-family: 'Consolas', 'Monaco', monospace;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    .legend h3 {
      margin: 0 0 12px 0;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      font-size: 0.8rem;
      font-family: 'Consolas', monospace;
    }

    .color-box {
      width: 12px;
      height: 12px;
      border-radius: 2px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .matrix-a { background: #a0a0a0; }
    .secret-s { background: #a03030; }
    .vector-t { background: #d4a520; }
    .error-e { background: #7030a0; }
    .cipher { background: #30a060; }
    .message { background: #e0e0e0; }

    .info-panel {
      position: absolute;
      left: 20px;
      bottom: 100px;
      background: rgba(20, 24, 32, 0.92);
      padding: 14px 18px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #a0a0a0;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.75rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    .info-panel p { margin: 4px 0; }
    .info-panel strong { color: #c0c0c0; }
  `],
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
      if (state.phase === 'keygen' && state.progress === 1) {
        this.hasKeys.set(true);
      }
      if (state.phase === 'encaps' && state.progress === 1) {
        this.hasCipher.set(true);
      }
    });

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
