import * as THREE from 'three';
import { createGlassMaterial, createEmissiveMaterial, KYBER_COLORS } from './colors';
import { RING_PARAMS, VISUALIZATION_PARAMS, MathUtils } from './kyber-constants';

/**
 * Representación visual de un elemento del anillo R_q.
 * Usa un toro donde cada punto representa un coeficiente del polinomio.
 */
export class TorusPolynomial extends THREE.Group {
  private torus!: THREE.Mesh;
  private coefficientSpheres: THREE.Mesh[] = [];
  private labelSprite?: THREE.Sprite;

  private readonly n = RING_PARAMS.N;
  private readonly q = RING_PARAMS.Q;
  private readonly majorRadius = VISUALIZATION_PARAMS.TORUS_MAJOR_RADIUS;
  private readonly minorRadius = VISUALIZATION_PARAMS.TORUS_MINOR_RADIUS;
  private readonly sphereMinRadius = VISUALIZATION_PARAMS.COEFF_SPHERE_MIN_RADIUS;
  private readonly sphereMaxRadius = VISUALIZATION_PARAMS.COEFF_SPHERE_MAX_RADIUS;

  private coefficients: number[] = [];
  private baseColor: THREE.Color;
  private label: string;
  private isSmallNorm = false;

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

  /** Crea la geometría toroidal base */
  private createTorus(): void {
    const geometry = new THREE.TorusGeometry(this.majorRadius, this.minorRadius, 32, this.n);
    const material = createGlassMaterial(this.baseColor, 0.35);
    this.torus = new THREE.Mesh(geometry, material);
    this.torus.castShadow = true;
    this.torus.receiveShadow = true;
    this.add(this.torus);
  }

  /** Crea esferas para visualizar cada coeficiente */
  private createCoefficientMarkers(): void {
    const sphereGeometry = new THREE.SphereGeometry(this.sphereMinRadius, 12, 12);

    for (let i = 0; i < this.n; i++) {
      const theta = (i / this.n) * Math.PI * 2;
      const x = Math.cos(theta) * this.majorRadius;
      const z = Math.sin(theta) * this.majorRadius;

      const material = createEmissiveMaterial(this.baseColor, 0.3);
      const sphere = new THREE.Mesh(sphereGeometry.clone(), material);
      sphere.position.set(x, 0, z);
      sphere.userData['coeffIndex'] = i;
      sphere.userData['coeffValue'] = 0;

      this.coefficientSpheres.push(sphere);
      this.add(sphere);
    }
  }

  /** Crea etiqueta flotante con el identificador */
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
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    this.labelSprite = new THREE.Sprite(spriteMaterial);
    this.labelSprite.scale.set(20, 5, 1);
    this.labelSprite.position.y = this.minorRadius + 8;
    this.add(this.labelSprite);
  }

  /** Establece los coeficientes y actualiza la visualización */
  setCoefficients(coeffs: number[]): void {
    this.coefficients = coeffs.slice(0, this.n);

    const maxCentered = Math.max(
      ...this.coefficients.map((c) => Math.abs(MathUtils.centerReduce(c, this.q)))
    );
    this.isSmallNorm = maxCentered <= 3;

    this.coefficientSpheres.forEach((sphere, i) => {
      const coeff = this.coefficients[i] ?? 0;
      const centered = MathUtils.centerReduce(coeff, this.q);
      const logNormalized = MathUtils.logScale(coeff, this.q);

      const radius =
        this.sphereMinRadius + logNormalized * (this.sphereMaxRadius - this.sphereMinRadius);
      sphere.scale.setScalar(radius / this.sphereMinRadius);

      const material = sphere.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.2 + logNormalized * 0.8;

      sphere.userData['coeffValue'] = coeff;
      sphere.userData['centeredValue'] = centered;
    });
  }

  /** Genera coeficientes uniformes en Z_q (para matriz A) */
  generateUniformCoefficients(): void {
    const coeffs = MathUtils.sampleUniform(this.n);
    this.setCoefficients(coeffs);
    this.isSmallNorm = false;
  }

  /** Genera coeficientes pequeños según CBD_η (para secreto s, errores e) */
  generateSmallCoefficients(eta = 2): void {
    const coeffs = MathUtils.sampleCBDVector(this.n, eta);
    this.setCoefficients(coeffs);
    this.isSmallNorm = true;
  }

  generateRandomCoefficients(): void {
    this.generateUniformCoefficients();
  }

  /** Anima el proceso de muestreo con efecto de parpadeo */
  animateGeneration(duration: number, onComplete?: () => void): void {
    const startTime = Date.now();
    const flickerInterval = 50;
    let lastFlicker = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (elapsed < duration) {
        if (elapsed - lastFlicker > flickerInterval) {
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
        this.generateUniformCoefficients();
        onComplete?.();
      }
    };

    animate();
  }

  /** Anima la aparición con easing cúbico */
  animateAppear(duration: number): Promise<void> {
    return new Promise((resolve) => {
      this.scale.set(0, 0, 0);
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
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

  /** Transición suave de color */
  transitionColor(newColor: THREE.Color, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startColor = this.baseColor.clone();
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const currentColor = startColor.clone().lerp(newColor, t);

        (this.torus.material as THREE.MeshPhysicalMaterial).color = currentColor;

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

  getCoefficients(): number[] {
    return this.coefficients.slice();
  }

  getLabel(): string {
    return this.label;
  }

  setLabel(label: string): void {
    this.label = label;
    if (this.labelSprite) {
      this.remove(this.labelSprite);
      this.createLabel();
    }
  }

  hasSmallNorm(): boolean {
    return this.isSmallNorm;
  }

  getInfinityNorm(): number {
    return MathUtils.infinityNorm(this.coefficients);
  }

  getRingParams(): { n: number; q: number } {
    return { n: this.n, q: this.q };
  }
}
