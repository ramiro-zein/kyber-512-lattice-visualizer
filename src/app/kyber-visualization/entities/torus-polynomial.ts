import * as THREE from 'three';
import { createGlassMaterial, createEmissiveMaterial, KYBER_COLORS } from './colors';

/**
 * Representa un polinomio en Rq = Zq[X]/(X^256 + 1)
 * Visualizado como un toro con 256 marcadores para los coeficientes
 */
export class TorusPolynomial extends THREE.Group {
  private torus!: THREE.Mesh;
  private coefficientSpheres: THREE.Mesh[] = [];
  private readonly MAJOR_RADIUS = 25;
  private readonly MINOR_RADIUS = 8;
  private readonly NUM_COEFFICIENTS = 256;
  private readonly Q = 3329; // Módulo de Kyber

  private coefficients: number[] = [];
  private baseColor: THREE.Color;
  private label: string;

  constructor(color: THREE.Color = KYBER_COLORS.MATRIX_A, label = '') {
    super();
    this.baseColor = color;
    this.label = label;
    this.coefficients = new Array(this.NUM_COEFFICIENTS).fill(0);
    this.createTorus();
    this.createCoefficientMarkers();
  }

  private createTorus(): void {
    const geometry = new THREE.TorusGeometry(this.MAJOR_RADIUS, this.MINOR_RADIUS, 32, 256);

    const material = createGlassMaterial(this.baseColor, 0.4);

    this.torus = new THREE.Mesh(geometry, material);
    this.torus.castShadow = true;
    this.torus.receiveShadow = true;
    this.add(this.torus);
  }

  private createCoefficientMarkers(): void {
    const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);

    for (let i = 0; i < this.NUM_COEFFICIENTS; i++) {
      const angle = (i / this.NUM_COEFFICIENTS) * Math.PI * 2;
      const x = Math.cos(angle) * this.MAJOR_RADIUS;
      const z = Math.sin(angle) * this.MAJOR_RADIUS;

      const material = createEmissiveMaterial(this.baseColor, 0.3);
      const sphere = new THREE.Mesh(sphereGeometry, material);
      sphere.position.set(x, 0, z);
      sphere.userData['index'] = i;

      this.coefficientSpheres.push(sphere);
      this.add(sphere);
    }
  }

  /**
   * Establece los coeficientes del polinomio
   */
  setCoefficients(coeffs: number[]): void {
    this.coefficients = coeffs.slice(0, this.NUM_COEFFICIENTS);

    // Actualizar tamaño y brillo de las esferas según el valor
    this.coefficientSpheres.forEach((sphere, i) => {
      const coeff = this.coefficients[i] || 0;
      const normalizedValue = Math.abs(coeff) / this.Q;

      // Escala entre 0.5 y 3 unidades según especificación
      const scale = 0.5 + normalizedValue * 2.5;
      sphere.scale.setScalar(scale);

      // Actualizar intensidad emisiva
      const material = sphere.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.3 + normalizedValue * 0.7;
    });
  }

  /**
   * Genera coeficientes aleatorios uniformes en Zq
   */
  generateRandomCoefficients(): void {
    const coeffs = [];
    for (let i = 0; i < this.NUM_COEFFICIENTS; i++) {
      coeffs.push(Math.floor(Math.random() * this.Q));
    }
    this.setCoefficients(coeffs);
  }

  /**
   * Genera coeficientes pequeños según distribución CBD
   * CBD_eta con eta=2: valores en {-2, -1, 0, 1, 2}
   */
  generateSmallCoefficients(eta = 2): void {
    const coeffs = [];
    for (let i = 0; i < this.NUM_COEFFICIENTS; i++) {
      let sum = 0;
      for (let j = 0; j < eta; j++) {
        sum += Math.round(Math.random()) - Math.round(Math.random());
      }
      // Convertir a positivo en Zq si es negativo
      coeffs.push(sum < 0 ? this.Q + sum : sum);
    }
    this.setCoefficients(coeffs);
  }

  /**
   * Animación de parpadeo durante generación
   */
  animateGeneration(duration: number, onComplete?: () => void): void {
    const startTime = Date.now();
    const flickerInterval = 50;
    let lastFlicker = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed < duration) {
        if (elapsed - lastFlicker > flickerInterval) {
          // Generar valores aleatorios temporales
          this.coefficientSpheres.forEach((sphere) => {
            const randomScale = 0.5 + Math.random() * 2;
            sphere.scale.setScalar(randomScale);
            (sphere.material as THREE.MeshStandardMaterial).emissiveIntensity =
              0.3 + Math.random() * 0.7;
          });
          lastFlicker = elapsed;
        }
        requestAnimationFrame(animate);
      } else {
        // Estabilizar con valores finales
        this.generateRandomCoefficients();
        onComplete?.();
      }
    };

    animate();
  }

  /**
   * Anima la aparición del toro desde escala 0
   */
  animateAppear(duration: number): Promise<void> {
    return new Promise((resolve) => {
      this.scale.set(0, 0, 0);
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing suave
        const eased = 1 - Math.pow(1 - progress, 3);
        this.scale.setScalar(eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Cambia el color del toro con transición
   */
  transitionColor(newColor: THREE.Color, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startColor = this.baseColor.clone();
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const currentColor = startColor.clone().lerp(newColor, progress);

        // Actualizar material del toro
        (this.torus.material as THREE.MeshPhysicalMaterial).color = currentColor;

        // Actualizar esferas
        this.coefficientSpheres.forEach((sphere) => {
          const mat = sphere.material as THREE.MeshStandardMaterial;
          mat.color = currentColor;
          mat.emissive = currentColor;
        });

        if (progress < 1) {
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
  }
}
