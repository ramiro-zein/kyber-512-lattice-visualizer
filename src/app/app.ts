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
import { ThreeVisualizationService } from './core/services/three-visualization.service';
import * as THREE from 'three';

/**
 * Main application component for professional 3D visualization
 * Clean 3D environment ready for custom content
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnDestroy {
  @ViewChild('canvasContainer', { static: false })
  canvasContainer!: ElementRef<HTMLDivElement>;

  // Platform check
  private isBrowser: boolean;

  // UI State
  autoRotateEnabled = false;

  constructor(
    private injector: Injector,
    private visualService: ThreeVisualizationService
  ) {
    this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    // Initialize 3D scene after render
    afterNextRender(
      () => {
        this.initializeVisualization();
      },
      { injector: this.injector }
    );
  }

  ngOnDestroy(): void {
    this.visualService.dispose();
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  /**
   * Initialize the 3D visualization with professional configuration
   */
  private initializeVisualization(): void {
    this.visualService.initialize(
      this.canvasContainer,
      {
        backgroundColor: 0x020617,
        fogDensity: 0.015,
        enableShadows: true,
        antialias: true,
        toneMappingExposure: 1.2,
      },
      {
        fov: 40,
        position: new THREE.Vector3(0, 30, 55),
      },
      {
        ambientIntensity: 0.4,
        enableDirectional: true,
        directionalIntensity: 1.0,
      },
      {
        enableDamping: true,
        dampingFactor: 0.05,
        minDistance: 20,
        maxDistance: 100,
        autoRotate: false,
      }
    );

    this.log('Entorno 3D inicializado correctamente', 'success');
    this.log('Sistema de renderizado: WebGL con tone mapping ACES', 'info');
    this.log('Iluminación: Sistema de 3 puntos profesional', 'info');
    this.log('Listo para visualización de modelo de cifrado', 'info');
  }

  // ========================================================================
  // UI CONTROLS
  // ========================================================================

  /**
   * Toggle auto-rotation of camera
   */
  toggleAutoRotate(): void {
    this.autoRotateEnabled = !this.autoRotateEnabled;
    const controls = this.visualService.getControls();
    controls.autoRotate = this.autoRotateEnabled;
    this.log(
      `Auto-rotación ${this.autoRotateEnabled ? 'activada' : 'desactivada'}`,
      'info'
    );
  }

  // ========================================================================
  // LOGGING
  // ========================================================================

  /**
   * Log message to UI
   */
  private log(
    msg: string,
    type: 'info' | 'action' | 'success' | 'error' = 'info'
  ): void {
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
