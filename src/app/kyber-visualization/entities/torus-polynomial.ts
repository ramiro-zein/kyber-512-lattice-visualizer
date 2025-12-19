import * as THREE from 'three';
import { createGlassMaterial, createEmissiveMaterial, KYBER_COLORS } from './colors';
import { RING_PARAMS, VISUALIZATION_PARAMS, MathUtils, MATH_LABELS } from './kyber-constants';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * REPRESENTACIÓN VISUAL DE UN ELEMENTO DEL ANILLO R_q
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * DEFINICIÓN MATEMÁTICA:
 *   Sea R_q = Z_q[X] / ⟨X^n + 1⟩ el anillo de polinomios módulo X^n + 1
 *   donde n = 256 y q = 3329.
 *
 *   Un elemento a ∈ R_q se representa como:
 *     a(X) = Σᵢ₌₀^{n-1} aᵢXⁱ,  donde aᵢ ∈ Z_q = {0, 1, ..., q-1}
 *
 * JUSTIFICACIÓN DE REPRESENTACIÓN TOROIDAL:
 *   El toro T² = S¹ × S¹ captura la estructura algebraica:
 *   - El círculo mayor S¹ (índice i): representa los n = 256 coeficientes
 *   - El radio variable r(aᵢ): codifica el valor del coeficiente en Z_q
 *
 *   La relación X^n ≡ -1 (mod X^n + 1) induce ciclicidad con torsión,
 *   distinguiendo R_q de un anillo cíclico simple Z[X]/(X^n - 1).
 *
 * ESCALA VISUAL:
 *   Se usa escala logarítmica para mejorar la percepción de coeficientes:
 *     r(aᵢ) = r_min + log(1 + |aᵢ|_centered / (q/2)) · (r_max - r_min)
 *
 *   donde |aᵢ|_centered = min(aᵢ, q - aᵢ) es la reducción centrada.
 */
export class TorusPolynomial extends THREE.Group {
  private torus!: THREE.Mesh;
  private coefficientSpheres: THREE.Mesh[] = [];
  private labelSprite?: THREE.Sprite;

  // Constantes matemáticas del anillo
  private readonly n = RING_PARAMS.N; // 256
  private readonly q = RING_PARAMS.Q; // 3329

  // Parámetros de visualización
  private readonly majorRadius = VISUALIZATION_PARAMS.TORUS_MAJOR_RADIUS;
  private readonly minorRadius = VISUALIZATION_PARAMS.TORUS_MINOR_RADIUS;
  private readonly sphereMinRadius = VISUALIZATION_PARAMS.COEFF_SPHERE_MIN_RADIUS;
  private readonly sphereMaxRadius = VISUALIZATION_PARAMS.COEFF_SPHERE_MAX_RADIUS;

  // Estado del polinomio
  private coefficients: number[] = [];
  private baseColor: THREE.Color;
  private label: string;

  // Metadatos matemáticos
  private isSmallNorm = false; // true si proviene de distribución CBD

  /**
   * Constructor
   * @param color Color base del toro (semántica según tipo de elemento)
   * @param label Identificador matemático (e.g., "s₀", "a_{1,2}")
   */
  constructor(color: THREE.Color = KYBER_COLORS.MATRIX_A, label = '') {
    super();
    this.baseColor = color;
    this.label = label;
    this.coefficients = new Array(this.n).fill(0);
    this.createTorus();
    this.createCoefficientMarkers();
    if (label) {
      this.createLabel();
    }
  }

  /**
   * Crea la geometría del toro base
   * El toro representa el espacio del anillo R_q
   */
  private createTorus(): void {
    // Subdivisiones: n segmentos radiales para coincidir con coeficientes
    const geometry = new THREE.TorusGeometry(
      this.majorRadius,
      this.minorRadius,
      32, // segmentos del tubo
      this.n // segmentos radiales = n coeficientes
    );

    const material = createGlassMaterial(this.baseColor, 0.35);

    this.torus = new THREE.Mesh(geometry, material);
    this.torus.castShadow = true;
    this.torus.receiveShadow = true;
    this.add(this.torus);
  }

  /**
   * Crea los marcadores esféricos para cada coeficiente aᵢ
   * Posición: (R·cos(2πi/n), 0, R·sin(2πi/n)) sobre el círculo mayor
   */
  private createCoefficientMarkers(): void {
    const sphereGeometry = new THREE.SphereGeometry(this.sphereMinRadius, 12, 12);

    for (let i = 0; i < this.n; i++) {
      // Ángulo θᵢ = 2πi/n para distribución uniforme
      const theta = (i / this.n) * Math.PI * 2;
      const x = Math.cos(theta) * this.majorRadius;
      const z = Math.sin(theta) * this.majorRadius;

      const material = createEmissiveMaterial(this.baseColor, 0.3);
      const sphere = new THREE.Mesh(sphereGeometry.clone(), material);
      sphere.position.set(x, 0, z);

      // Metadatos del coeficiente
      sphere.userData['coeffIndex'] = i;
      sphere.userData['coeffValue'] = 0;

      this.coefficientSpheres.push(sphere);
      this.add(sphere);
    }
  }

  /**
   * Crea etiqueta flotante con el identificador del polinomio
   */
  private createLabel(): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;

    context.fillStyle = 'transparent';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = 'bold 28px "Courier New", monospace';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(this.label, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });

    this.labelSprite = new THREE.Sprite(spriteMaterial);
    this.labelSprite.scale.set(20, 5, 1);
    this.labelSprite.position.y = this.minorRadius + 8;
    this.add(this.labelSprite);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * ESTABLECER COEFICIENTES DEL POLINOMIO
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * @param coeffs Array de n coeficientes en Z_q = {0, ..., q-1}
   *
   * VISUALIZACIÓN:
   *   El radio de cada esfera es proporcional a |aᵢ|_centered usando
   *   escala logarítmica para mejor percepción visual:
   *
   *     r(aᵢ) = r_min + log₁₀(1 + 10·|aᵢ|_centered/(q/2)) / log₁₀(11) · (r_max - r_min)
   */
  setCoefficients(coeffs: number[]): void {
    this.coefficients = coeffs.slice(0, this.n);

    // Detectar si son coeficientes pequeños (distribución CBD)
    const maxCentered = Math.max(
      ...this.coefficients.map((c) => Math.abs(MathUtils.centerReduce(c, this.q)))
    );
    this.isSmallNorm = maxCentered <= 3; // η ≤ 3 para CBD

    // Actualizar visualización de cada coeficiente
    this.coefficientSpheres.forEach((sphere, i) => {
      const coeff = this.coefficients[i] ?? 0;
      const centered = MathUtils.centerReduce(coeff, this.q);
      const normalizedAbs = Math.abs(centered) / (this.q / 2);

      // Escala logarítmica para mejor visualización
      const logNormalized = MathUtils.logScale(coeff, this.q);

      // Radio proporcional al valor (escala log)
      const radius =
        this.sphereMinRadius + logNormalized * (this.sphereMaxRadius - this.sphereMinRadius);

      sphere.scale.setScalar(radius / this.sphereMinRadius);

      // Intensidad emisiva proporcional
      const material = sphere.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.2 + logNormalized * 0.8;

      // Guardar metadatos
      sphere.userData['coeffValue'] = coeff;
      sphere.userData['centeredValue'] = centered;
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * MUESTREO UNIFORME EN R_q
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * Genera a ← U(R_q) donde cada aᵢ ← U(Z_q)
   *
   * APLICACIÓN: Generación de matriz pública A
   */
  generateUniformCoefficients(): void {
    const coeffs = MathUtils.sampleUniform(this.n);
    this.setCoefficients(coeffs);
    this.isSmallNorm = false;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * MUESTREO CBD (DISTRIBUCIÓN BINOMIAL CENTRADA)
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * Genera a donde aᵢ ← CBD_η
   *
   * DEFINICIÓN CBD_η:
   *   Sea (a₀,...,a_{η-1}), (b₀,...,b_{η-1}) ← {0,1}^η
   *   x = Σⱼ(aⱼ - bⱼ)
   *
   * PROPIEDADES:
   *   - E[x] = 0
   *   - Var[x] = η/2
   *   - Soporte: {-η, ..., +η}
   *
   * APLICACIÓN: Generación de secreto s, errores e, e₁, e₂, vector r
   *
   * @param eta Parámetro de la distribución (default: 2 para Kyber-768)
   */
  generateSmallCoefficients(eta = 2): void {
    const coeffs = MathUtils.sampleCBDVector(this.n, eta);
    this.setCoefficients(coeffs);
    this.isSmallNorm = true;
  }

  /**
   * Genera coeficientes aleatorios uniformes (alias para compatibilidad)
   */
  generateRandomCoefficients(): void {
    this.generateUniformCoefficients();
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * ANIMACIÓN DE MUESTREO
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * Visualiza el proceso de muestreo con parpadeo que converge
   * al valor final, simulando el proceso estocástico.
   */
  animateGeneration(duration: number, onComplete?: () => void): void {
    const startTime = Date.now();
    const flickerInterval = 50;
    let lastFlicker = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (elapsed < duration) {
        if (elapsed - lastFlicker > flickerInterval) {
          // Reducir varianza del parpadeo conforme avanza (convergencia visual)
          const variance = 1 - progress * 0.8;

          this.coefficientSpheres.forEach((sphere) => {
            const randomScale =
              this.sphereMinRadius +
              Math.random() * variance * (this.sphereMaxRadius - this.sphereMinRadius);
            sphere.scale.setScalar(randomScale / this.sphereMinRadius);

            const material = sphere.material as THREE.MeshStandardMaterial;
            material.emissiveIntensity = 0.2 + Math.random() * 0.6 * variance;
          });
          lastFlicker = elapsed;
        }
        requestAnimationFrame(animate);
      } else {
        // Estabilizar con valores finales
        this.generateUniformCoefficients();
        onComplete?.();
      }
    };

    animate();
  }

  /**
   * Animación de aparición con easing cúbico
   */
  animateAppear(duration: number): Promise<void> {
    return new Promise((resolve) => {
      this.scale.set(0, 0, 0);
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);

        // Easing cúbico: f(t) = 1 - (1-t)³
        const eased = 1 - Math.pow(1 - t, 3);
        this.scale.setScalar(eased);

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Transición de color suave
   */
  transitionColor(newColor: THREE.Color, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startColor = this.baseColor.clone();
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);

        const currentColor = startColor.clone().lerp(newColor, t);

        // Actualizar material del toro
        (this.torus.material as THREE.MeshPhysicalMaterial).color = currentColor;

        // Actualizar esferas
        this.coefficientSpheres.forEach((sphere) => {
          const mat = sphere.material as THREE.MeshStandardMaterial;
          mat.color = currentColor;
          mat.emissive = currentColor;
        });

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          this.baseColor = newColor;
          resolve();
        }
      };

      animate();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS Y UTILIDADES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Retorna copia de los coeficientes */
  getCoefficients(): number[] {
    return this.coefficients.slice();
  }

  /** Retorna el identificador del polinomio */
  getLabel(): string {
    return this.label;
  }

  /** Actualiza el identificador */
  setLabel(label: string): void {
    this.label = label;
    // Actualizar sprite si existe
    if (this.labelSprite) {
      this.remove(this.labelSprite);
      this.createLabel();
    }
  }

  /** Verifica si tiene coeficientes pequeños (CBD) */
  hasSmallNorm(): boolean {
    return this.isSmallNorm;
  }

  /**
   * Calcula ||a||_∞ (norma infinito centrada)
   */
  getInfinityNorm(): number {
    return MathUtils.infinityNorm(this.coefficients);
  }

  /** Retorna parámetros del anillo */
  getRingParams(): { n: number; q: number } {
    return { n: this.n, q: this.q };
  }
}
