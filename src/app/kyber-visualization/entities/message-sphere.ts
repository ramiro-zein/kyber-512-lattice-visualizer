import * as THREE from 'three';
import { KYBER_COLORS } from './colors';

/**
 * Representa un mensaje de 256 bits
 * Visualizado como un icosaedro subdividido con puntos emisivos en los vértices
 */
export class MessageSphere extends THREE.Group {
  private sphere!: THREE.Mesh;
  private bitPoints: THREE.Mesh[] = [];
  private bits: boolean[] = [];

  private readonly RADIUS = 15;
  private readonly NUM_BITS = 256;

  constructor() {
    super();
    this.bits = new Array(this.NUM_BITS).fill(false);
    this.createSphere();
    this.createBitPoints();

    // Rotación lenta según especificación
    this.userData['rotationSpeed'] = (5 * Math.PI) / 180; // 5°/s
  }

  private createSphere(): void {
    const geometry = new THREE.IcosahedronGeometry(this.RADIUS, 3);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x111122,
      transparent: true,
      opacity: 0.3,
      metalness: 0.1,
      roughness: 0.2,
      transmission: 0.8,
      thickness: 1,
    });

    this.sphere = new THREE.Mesh(geometry, material);
    this.add(this.sphere);
  }

  private createBitPoints(): void {
    // Distribuir 256 puntos uniformemente en una esfera usando la secuencia de Fibonacci
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = Math.PI * 2 * goldenRatio;

    const pointGeometry = new THREE.SphereGeometry(0.3, 8, 8);

    for (let i = 0; i < this.NUM_BITS; i++) {
      const t = i / this.NUM_BITS;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = angleIncrement * i;

      const x = Math.sin(inclination) * Math.cos(azimuth) * this.RADIUS;
      const y = Math.sin(inclination) * Math.sin(azimuth) * this.RADIUS;
      const z = Math.cos(inclination) * this.RADIUS;

      const material = new THREE.MeshStandardMaterial({
        color: 0x333333,
        emissive: 0x333333,
        emissiveIntensity: 0.2,
      });

      const point = new THREE.Mesh(pointGeometry, material);
      point.position.set(x, y, z);
      point.userData['bitIndex'] = i;

      this.bitPoints.push(point);
      this.add(point);
    }
  }

  /**
   * Establece los bits del mensaje
   */
  setBits(bits: boolean[]): void {
    this.bits = bits.slice(0, this.NUM_BITS);

    this.bitPoints.forEach((point, i) => {
      const isOn = this.bits[i] || false;
      const material = point.material as THREE.MeshStandardMaterial;

      if (isOn) {
        material.color.set(KYBER_COLORS.MESSAGE_M);
        material.emissive.set(KYBER_COLORS.MESSAGE_M);
        material.emissiveIntensity = 1;
        point.scale.setScalar(1.5);
      } else {
        material.color.set(0x333333);
        material.emissive.set(0x333333);
        material.emissiveIntensity = 0.2;
        point.scale.setScalar(1);
      }
    });
  }

  /**
   * Genera bits aleatorios
   */
  generateRandomBits(): void {
    const bits = [];
    for (let i = 0; i < this.NUM_BITS; i++) {
      bits.push(Math.random() > 0.5);
    }
    this.setBits(bits);
  }

  /**
   * Anima la generación de bits aleatorios
   */
  animateGeneration(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const flickerInterval = 30;
      let lastFlicker = 0;

      const animate = () => {
        const elapsed = Date.now() - startTime;

        if (elapsed < duration) {
          if (elapsed - lastFlicker > flickerInterval) {
            // Parpadeo aleatorio
            this.bitPoints.forEach((point) => {
              const isOn = Math.random() > 0.5;
              const material = point.material as THREE.MeshStandardMaterial;

              if (isOn) {
                material.emissive.set(KYBER_COLORS.MESSAGE_M);
                material.emissiveIntensity = 0.8 + Math.random() * 0.2;
              } else {
                material.emissive.set(0x333333);
                material.emissiveIntensity = 0.2;
              }
            });
            lastFlicker = elapsed;
          }
          requestAnimationFrame(animate);
        } else {
          this.generateRandomBits();
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Anima la aparición
   */
  animateAppear(duration: number): Promise<void> {
    return new Promise((resolve) => {
      this.scale.set(0, 0, 0);
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing elástico
        const eased = 1 - Math.pow(1 - progress, 4);
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
   * Actualiza la rotación (llamar en el loop de animación)
   */
  update(delta: number): void {
    this.rotation.y += this.userData['rotationSpeed'] * delta;
  }

  getBits(): boolean[] {
    return this.bits.slice();
  }

  /**
   * Convierte los bits a un array de coeficientes para encode
   * Cada bit 1 se mapea a q/2, cada bit 0 a 0
   */
  toEncodedCoefficients(q = 3329): number[] {
    const halfQ = Math.floor(q / 2);
    return this.bits.map((bit) => (bit ? halfQ : 0));
  }
}
