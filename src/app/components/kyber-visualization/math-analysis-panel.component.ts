/**
 * @fileoverview Mathematical Analysis Panel Component
 * @description Real-time mathematical statistics for Kyber operations
 * @author Doctorate Level Implementation
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PolyStatistics, Poly } from '../../core/models/kyber.types';

/**
 * Component displaying real-time mathematical analysis
 */
@Component({
  selector: 'app-math-analysis-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="math-panel panel p-4 max-h-[500px] overflow-y-auto">
      <h3 class="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Análisis Matemático
      </h3>

      @if (polyStats) {
        <div class="space-y-4">
          <!-- Polynomial Name -->
          <div class="text-xs font-mono text-slate-300 border-b border-slate-700 pb-2">
            {{ polyName || 'Polinomio' }}
          </div>

          <!-- Statistics Grid -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Mean -->
            <div class="stat-card">
              <div class="stat-label">Media (μ)</div>
              <div class="stat-value text-cyan-400">{{ polyStats.mean | number:'1.2-2' }}</div>
            </div>

            <!-- Standard Deviation -->
            <div class="stat-card">
              <div class="stat-label">Desv. Est. (σ)</div>
              <div class="stat-value text-purple-400">{{ polyStats.stdDev | number:'1.2-2' }}</div>
            </div>

            <!-- Max -->
            <div class="stat-card">
              <div class="stat-label">Máximo</div>
              <div class="stat-value text-emerald-400">{{ polyStats.max }}</div>
            </div>

            <!-- Min -->
            <div class="stat-card">
              <div class="stat-label">Mínimo</div>
              <div class="stat-value text-orange-400">{{ polyStats.min }}</div>
            </div>

            <!-- L2 Norm -->
            <div class="stat-card col-span-2">
              <div class="stat-label">Norma L2 (||·||₂)</div>
              <div class="stat-value text-fuchsia-400">{{ polyStats.norm | number:'1.2-2' }}</div>
            </div>
          </div>

          <!-- Interpretation -->
          <div class="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <div class="text-[10px] font-semibold text-slate-400 mb-1.5">INTERPRETACIÓN</div>
            <ul class="text-[10px] text-slate-300 space-y-1 leading-relaxed">
              @if (isNoisePolynomial()) {
                <li class="flex gap-1">
                  <span class="text-cyan-400">•</span>
                  <span>Distribución binomial centrada con η={{ eta }}</span>
                </li>
                <li class="flex gap-1">
                  <span class="text-purple-400">•</span>
                  <span>Seguridad basada en LWE (Learning With Errors)</span>
                </li>
              }
              @if (isLarge()) {
                <li class="flex gap-1">
                  <span class="text-emerald-400">•</span>
                  <span>Coeficientes grandes → Mayor magnitud</span>
                </li>
              }
              <li class="flex gap-1">
                <span class="text-fuchsia-400">•</span>
                <span>Norma L2 mide distancia euclidiana en R<sup>256</sup></span>
              </li>
            </ul>
          </div>
        </div>
      } @else {
        <div class="text-xs text-slate-500 italic text-center py-8">
          Selecciona un polinomio para ver análisis
        </div>
      }
    </div>
  `,
  styles: [`
    .math-panel {
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
    }

    .stat-card {
      background: rgba(30, 41, 59, 0.6);
      border-radius: 0.5rem;
      padding: 0.625rem;
      border: 1px solid rgba(51, 65, 85, 0.5);
    }

    .stat-label {
      font-size: 10px;
      color: rgb(100, 116, 139);
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-size: 1rem;
      font-weight: 700;
      font-family: ui-monospace, monospace;
    }
  `]
})
export class MathAnalysisPanelComponent {
  @Input() polyStats: PolyStatistics | null = null;
  @Input() polyName: string = '';
  @Input() eta: number = 2;

  /**
   * Check if polynomial is noise (small coefficients)
   */
  isNoisePolynomial(): boolean {
    if (!this.polyStats) return false;
    return Math.abs(this.polyStats.mean) < 10 && this.polyStats.stdDev < 5;
  }

  /**
   * Check if polynomial has large coefficients
   */
  isLarge(): boolean {
    if (!this.polyStats) return false;
    return this.polyStats.norm > 1000;
  }
}
