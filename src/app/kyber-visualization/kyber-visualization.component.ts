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
import { LogService } from '../services/log.service';

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
      background: #000000;
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
      margin-top: 10px;
    }

    .title h1 {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 1.8rem;
      margin: 0;
      color: #ddd;
      font-weight: 300;
      letter-spacing: 3px;
    }

    .subtitle {
      font-size: 0.85rem;
      opacity: 0.5;
      margin-top: 6px;
      font-weight: 300;
    }

    .status-panel {
      position: absolute;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 20, 25, 0.85);
      padding: 16px 32px;
      border-radius: 2px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      text-align: center;
      min-width: 300px;
      box-shadow: none;
    }

    .phase {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.9rem;
      color: #888;
      font-weight: 400;
      letter-spacing: 2px;
    }

    .sub-phase {
      color: #666;
      font-size: 0.75rem;
      margin-top: 4px;
      font-family: 'Consolas', monospace;
    }

    .progress-bar {
      display: none;
    }

    .progress-fill {
      display: none;
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
      padding: 12px 24px;
      font-size: 0.85rem;
      font-weight: 400;
      letter-spacing: 1px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-transform: uppercase;
      background: transparent;
      color: #999;
      box-shadow: none;
    }

    .controls button:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.2);
      color: #ccc;
    }

    .controls button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .controls button.active {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.3);
      color: #fff;
    }

    .controls button.btn-demo {
      background: rgba(6, 182, 212, 0.15);
      border-color: rgba(6, 182, 212, 0.3);
      color: #06b6d4;
    }

    .controls button.btn-demo:hover:not(:disabled) {
      background: rgba(6, 182, 212, 0.25);
      border-color: rgba(6, 182, 212, 0.5);
    }

    .controls button.btn-reset {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }

    .controls button.btn-reset:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.5);
    }

    .legend {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(15, 20, 25, 0.85);
      padding: 14px 18px;
      border-radius: 2px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      color: #bbb;
      font-family: 'Consolas', 'Monaco', monospace;
      box-shadow: none;
    }

    .legend h3 {
      margin: 0 0 10px 0;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #666;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 6px;
      font-weight: 400;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 7px;
      font-size: 0.75rem;
      font-family: 'Consolas', monospace;
    }

    .color-box {
      width: 10px;
      height: 10px;
      border-radius: 1px;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .matrix-a { background: #999; }
    .secret-s { background: #d946ef; }
    .vector-t { background: #a78bfa; }
    .error-e { background: #facc15; }
    .cipher { background: #10b981; }
    .message { background: #e5e5e5; }

    .info-panel {
      position: absolute;
      left: 20px;
      bottom: 100px;
      background: rgba(15, 20, 25, 0.85);
      padding: 12px 16px;
      border-radius: 2px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      color: #888;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.7rem;
      box-shadow: none;
    }

    .info-panel p { margin: 3px 0; }
    .info-panel strong { color: #aaa; }
  `],
})
export class KyberVisualizationComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private sceneService = inject(SceneService);
  private platformId = inject(PLATFORM_ID);
  private logService = inject(LogService);
  private orchestrator!: KyberOrchestrator;
  private isBrowser = false;
  private lastLoggedSubPhase = '';

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

      // Log state changes to activity log
      if (state.subPhase !== this.lastLoggedSubPhase) {
        this.lastLoggedSubPhase = state.subPhase;

        if (state.progress === 1) {
          this.logService.success(state.subPhase);
        } else if (state.progress === 0 && state.phase !== 'idle') {
          this.logService.info(state.subPhase);
        } else if (state.phase !== 'idle') {
          this.logService.info(state.subPhase);
        }
      }

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
    try {
      await this.orchestrator.runKeyGen();
    } catch (e) {
      // Animation was aborted, ignore
    } finally {
      this.isRunning.set(false);
    }
  }

  async runEncaps(): Promise<void> {
    this.isRunning.set(true);
    try {
      await this.orchestrator.runEncaps();
    } catch (e) {
      // Animation was aborted, ignore
    } finally {
      this.isRunning.set(false);
    }
  }

  async runDecaps(): Promise<void> {
    this.isRunning.set(true);
    try {
      await this.orchestrator.runDecaps();
    } catch (e) {
      // Animation was aborted, ignore
    } finally {
      this.isRunning.set(false);
    }
  }

  async runFullDemo(): Promise<void> {
    this.isRunning.set(true);
    try {
      await this.orchestrator.runFullDemo();
    } catch (e) {
      // Animation was aborted, ignore
    } finally {
      this.isRunning.set(false);
    }
  }

  reset(): void {
    if (!this.isBrowser || !this.orchestrator) return;
    this.orchestrator.reset();
    this.isRunning.set(false);
    this.hasKeys.set(false);
    this.hasCipher.set(false);
    this.lastLoggedSubPhase = '';
    this.logService.info('Escena reiniciada');
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
