/**
 * @fileoverview Educational Panel Component
 * @description Interactive educational content for Kyber-512
 * @author Doctorate Level Implementation
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CryptoOperation } from '../../core/services/kyber-crypto.service';

interface EducationalContent {
  title: string;
  subtitle: string;
  concepts: {
    label: string;
    description: string;
    formula?: string;
    importance: 'high' | 'medium' | 'low';
  }[];
  securityNote?: string;
}

/**
 * Component providing educational explanations
 */
@Component({
  selector: 'app-educational-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="edu-panel panel p-4 max-h-[600px] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-bold text-cyan-400 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Modo Educativo
        </h3>
        <button
          (click)="toggleExpanded()"
          class="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          {{ isExpanded ? 'Contraer' : 'Expandir' }}
        </button>
      </div>

      @if (content) {
        <div class="space-y-4">
          <!-- Header -->
          <div class="border-l-4 border-cyan-600 pl-3">
            <h4 class="text-sm font-bold text-white">{{ content.title }}</h4>
            <p class="text-xs text-slate-400 mt-1">{{ content.subtitle }}</p>
          </div>

          <!-- Concepts -->
          @if (isExpanded) {
            <div class="space-y-3">
              @for (concept of content.concepts; track concept.label) {
                <div class="concept-card"
                     [class.border-emerald-600]="concept.importance === 'high'"
                     [class.border-purple-600]="concept.importance === 'medium'"
                     [class.border-slate-600]="concept.importance === 'low'">

                  <div class="flex items-start gap-2 mb-2">
                    @if (concept.importance === 'high') {
                      <span class="text-emerald-400 text-xs">⚡</span>
                    }
                    @if (concept.importance === 'medium') {
                      <span class="text-purple-400 text-xs">●</span>
                    }
                    <div class="flex-1">
                      <div class="text-xs font-bold text-cyan-300">{{ concept.label }}</div>
                    </div>
                  </div>

                  <p class="text-xs text-slate-300 leading-relaxed mb-2">
                    {{ concept.description }}
                  </p>

                  @if (concept.formula) {
                    <div class="formula-box">
                      <code class="text-xs font-mono text-fuchsia-300">{{ concept.formula }}</code>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Security Note -->
            @if (content.securityNote) {
              <div class="security-note">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span class="text-xs font-bold text-yellow-400">Nota de Seguridad</span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed">{{ content.securityNote }}</p>
              </div>
            }
          }
        </div>
      } @else {
        <div class="text-xs text-slate-500 italic text-center py-8">
          Ejecuta una operación para ver contenido educativo
        </div>
      }
    </div>
  `,
  styles: [`
    .edu-panel {
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
    }

    .concept-card {
      background: rgba(30, 41, 59, 0.6);
      border-radius: 0.5rem;
      padding: 0.75rem;
      border-left: 2px solid;
      transition: all 0.2s;
    }

    .concept-card:hover {
      background: rgba(30, 41, 59, 0.8);
    }

    .formula-box {
      background: rgba(15, 23, 42, 0.8);
      border-radius: 0.25rem;
      padding: 0.375rem 0.5rem;
      border: 1px solid rgba(51, 65, 85, 0.5);
      margin-top: 0.5rem;
    }

    .security-note {
      background: rgba(113, 63, 18, 0.3);
      border: 1px solid rgba(113, 63, 18, 0.5);
      border-radius: 0.5rem;
      padding: 0.75rem;
    }
  `]
})
export class EducationalPanelComponent {
  @Input() currentOperation: CryptoOperation | null = null;
  isExpanded = true;

  private educationalContent: Record<CryptoOperation, EducationalContent> = {
    [CryptoOperation.KEY_GENERATION]: {
      title: 'Generación de Llaves en Kyber-512',
      subtitle: 'Fundamentos matemáticos del Key Encapsulation Mechanism',
      concepts: [
        {
          label: 'Anillo Polinómico R = ℤq[X]/(X^N + 1)',
          description: 'Kyber opera en el anillo de polinomios módulo X^256 + 1 con coeficientes en ℤ3329. Este anillo ciclotómico proporciona estructura algebraica eficiente para operaciones criptográficas.',
          formula: 'R = ℤ₃₃₂₉[X]/(X²⁵⁶ + 1)',
          importance: 'high'
        },
        {
          label: 'Matriz Pública A (K×K)',
          description: 'Matriz de polinomios uniformemente aleatorios generada a partir de una semilla pública. En Kyber-512, K=2, resultando en una matriz 2×2.',
          formula: 'A ∈ Rq^(K×K)',
          importance: 'high'
        },
        {
          label: 'Distribución Binomial Centrada (CBD)',
          description: 'Los secretos y errores se muestrean de CBD con parámetro η=2. Esto garantiza coeficientes pequeños mientras mantiene suficiente entropía para seguridad.',
          formula: 's, e ← CBD(η=2) ⇒ coef ∈ {-2,-1,0,1,2}',
          importance: 'high'
        },
        {
          label: 'Llave Pública t = As + e',
          description: 'La llave pública se calcula multiplicando la matriz A por el secreto s y añadiendo error e. Esta construcción oculta s mediante el problema LWE.',
          formula: 't = A·s + e ∈ Rq^K',
          importance: 'medium'
        }
      ],
      securityNote: 'La seguridad de Kyber se basa en Module-LWE (Learning With Errors sobre módulos), considerado resistente a ataques cuánticos. NIST estima seguridad equivalente a AES-128 (Nivel 1) para Kyber-512.'
    },
    [CryptoOperation.ENCRYPTION]: {
      title: 'Encriptación de Mensaje',
      subtitle: 'Encapsulación de clave usando llave pública',
      concepts: [
        {
          label: 'Codificación del Mensaje',
          description: 'El bit m se codifica como el primer coeficiente de un polinomio: m=0 → 0, m=1 → ⌊q/2⌋ = 1664. Esto maximiza la distancia entre valores para robustez contra ruido.',
          formula: 'encode(m) = m·⌊q/2⌋·(1) ∈ Rq',
          importance: 'high'
        },
        {
          label: 'Vectores Aleatorios r, e₁, e₂',
          description: 'Se generan nuevos vectores de ruido usando CBD. Estos introducen aleatoriedad fresca en cada encriptación, garantizando seguridad IND-CCA.',
          formula: 'r, e₁ ← CBD(η), e₂ ← CBD(η)',
          importance: 'medium'
        },
        {
          label: 'Componente u del Ciphertext',
          description: 'Primera parte del ciphertext calculada como u = A^T·r + e₁. Esto "oculta" el vector aleatorio r usando la matriz pública A.',
          formula: 'u = Aᵀ·r + e₁ ∈ Rq^K',
          importance: 'high'
        },
        {
          label: 'Componente v del Ciphertext',
          description: 'Segunda parte que lleva el mensaje codificado: v = t^T·r + e₂ + encode(m). El mensaje queda protegido por el producto interno con la llave pública.',
          formula: 'v = tᵀ·r + e₂ + encode(m) ∈ Rq',
          importance: 'high'
        }
      ],
      securityNote: 'El ciphertext (u, v) es indistinguible de uniforme bajo el problema Module-LWE. Cada encriptación usa ruido fresco, garantizando semántica segura contra adversarios cuánticos.'
    },
    [CryptoOperation.DECRYPTION]: {
      title: 'Desencriptación de Ciphertext',
      subtitle: 'Recuperación del mensaje usando llave secreta',
      concepts: [
        {
          label: 'Producto Interno s^T·u',
          description: 'El primer paso calcula s^T·u = s^T(A^T·r + e₁). Expandiendo: s^T·A^T·r + s^T·e₁. Este término aproxima t^T·r debido a que t ≈ As.',
          formula: 'sᵀ·u = sᵀ·Aᵀ·r + sᵀ·e₁',
          importance: 'high'
        },
        {
          label: 'Mensaje Ruidoso m\' = v - s^T·u',
          description: 'Restando s^T·u de v: m\' = (t^T·r + e₂ + m) - (s^T·A^T·r + s^T·e₁). Dado que t ≈ As, los términos principales se cancelan, dejando m más ruido.',
          formula: 'm\' = v - sᵀ·u = encode(m) + ruido_total',
          importance: 'high'
        },
        {
          label: 'Umbral de Decodificación',
          description: 'Se compara el coeficiente m\'[0] con umbrales ⌊q/4⌋ y ⌊3q/4⌋. Si está en [⌊q/4⌋, ⌊3q/4⌋], se decodifica como 1; de lo contrario, como 0.',
          formula: 'm = 1 si m\'[0] ∈ [832, 2497], sino 0',
          importance: 'high'
        },
        {
          label: 'Análisis del Ruido Total',
          description: 'El ruido acumulado es e_total = e₂ + s^T·e₁ - e^T·r. Por CBD, este ruido es suficientemente pequeño para no cruzar los umbrales de decodificación con alta probabilidad.',
          formula: '||e_total||∞ < ⌊q/4⌋ con prob ≈ 1 - 2^(-128)',
          importance: 'medium'
        }
      ],
      securityNote: 'La probabilidad de error de decodificación en Kyber-512 es < 2^(-139), garantizando correctitud práctica. El análisis de ruido es crucial para la seguridad y correctitud del esquema.'
    }
  };

  get content(): EducationalContent | null {
    return this.currentOperation ? this.educationalContent[this.currentOperation] : null;
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }
}
