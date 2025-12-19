import * as THREE from 'three';
import { TorusPolynomial } from './torus-polynomial';
import { KYBER_COLORS, createEmissiveMaterial } from './colors';

/**
 * Representa un vector de k polinomios en Rq^k
 * Visualizado como una torre de k toros apilados verticalmente
 */
export class VectorPolynomial extends THREE.Group {
  private tori: TorusPolynomial[] = [];
  private connectors: THREE.Mesh[] = [];
  private platform!: THREE.Mesh;
  private labelSprite?: THREE.Sprite;

  private readonly TORUS_SEPARATION = 20;
  private readonly PLATFORM_RADIUS = 30;
  private readonly k: number;
  private baseColor: THREE.Color;
  private label: string;

  constructor(k: number, color: THREE.Color = KYBER_COLORS.MATRIX_A, label = '') {
    super();
    this.k = k;
    this.baseColor = color;
    this.label = label;

    this.createPlatform();
    this.createTori();
    this.createConnectors();
    if (label) {
      this.createLabel();
    }
  }

  private createPlatform(): void {
    // Plataforma hexagonal según especificación
    const shape = new THREE.Shape();
    const sides = 6;
    const radius = this.PLATFORM_RADIUS;

    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 2,
      bevelEnabled: true,
      bevelThickness: 0.5,
      bevelSize: 0.5,
      bevelSegments: 3,
    });

    const material = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.8,
      roughness: 0.3,
    });

    this.platform = new THREE.Mesh(geometry, material);
    this.platform.rotation.x = -Math.PI / 2;
    this.platform.position.y = -10;
    this.platform.castShadow = true;
    this.platform.receiveShadow = true;
    this.add(this.platform);
  }

  private createTori(): void {
    for (let i = 0; i < this.k; i++) {
      const torus = new TorusPolynomial(this.baseColor, `${this.label}[${i}]`);
      torus.position.y = i * this.TORUS_SEPARATION;
      this.tori.push(torus);
      this.add(torus);
    }
  }

  private createConnectors(): void {
    const connectorGeometry = new THREE.CylinderGeometry(1, 1, this.TORUS_SEPARATION - 16, 16);
    const connectorMaterial = createEmissiveMaterial(this.baseColor, 0.4);

    for (let i = 0; i < this.k - 1; i++) {
      const connector = new THREE.Mesh(connectorGeometry, connectorMaterial);
      connector.position.y = i * this.TORUS_SEPARATION + this.TORUS_SEPARATION / 2;
      this.connectors.push(connector);
      this.add(connector);
    }
  }

  private createLabel(): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;

    context.fillStyle = 'transparent';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = 'bold 32px JetBrains Mono, Fira Code, monospace';
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
    this.labelSprite.scale.set(30, 7.5, 1);
    this.labelSprite.position.y = this.k * this.TORUS_SEPARATION + 15;
    this.add(this.labelSprite);
  }

  /**
   * Establece los coeficientes para cada polinomio del vector
   */
  setCoefficients(coefficients: number[][]): void {
    coefficients.forEach((coeffs, i) => {
      if (this.tori[i]) {
        this.tori[i].setCoefficients(coeffs);
      }
    });
  }

  /**
   * Genera coeficientes aleatorios para todos los polinomios
   */
  generateRandomCoefficients(): void {
    this.tori.forEach((torus) => torus.generateRandomCoefficients());
  }

  /**
   * Genera coeficientes pequeños (para secreto s o errores e)
   */
  generateSmallCoefficients(eta = 2): void {
    this.tori.forEach((torus) => torus.generateSmallCoefficients(eta));
  }

  /**
   * Anima la aparición de la torre
   */
  async animateAppear(duration: number): Promise<void> {
    this.scale.set(0, 0, 0);

    return new Promise((resolve) => {
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing elástico
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
   * Anima la aparición secuencial de cada toro
   */
  async animateSequentialAppear(torusDuration: number): Promise<void> {
    // Primero ocultar todos
    this.tori.forEach((torus) => torus.scale.set(0, 0, 0));
    this.connectors.forEach((conn) => conn.scale.set(0, 0, 0));

    // Aparecer secuencialmente
    for (let i = 0; i < this.tori.length; i++) {
      await this.tori[i].animateAppear(torusDuration);

      // Aparecer conector después del toro (excepto el último)
      if (i < this.connectors.length) {
        await this.animateConnector(this.connectors[i], torusDuration / 2);
      }
    }
  }

  private animateConnector(connector: THREE.Mesh, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        connector.scale.setScalar(progress);

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
   * Transición de color para todo el vector
   */
  async transitionColor(newColor: THREE.Color, duration: number): Promise<void> {
    const promises = this.tori.map((torus) => torus.transitionColor(newColor, duration));

    // También cambiar conectores
    this.connectors.forEach((connector) => {
      const material = connector.material as THREE.MeshStandardMaterial;
      const startColor = material.color.clone();

      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        material.color = startColor.clone().lerp(newColor, progress);
        material.emissive = material.color;

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    });

    this.baseColor = newColor;
    await Promise.all(promises);
  }

  /**
   * Mueve el vector a una nueva posición con animación
   */
  animateMoveTo(
    targetPosition: THREE.Vector3,
    duration: number,
    easing: 'linear' | 'ease-out' = 'ease-out'
  ): Promise<void> {
    return new Promise((resolve) => {
      const startPosition = this.position.clone();
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        let progress = Math.min(elapsed / duration, 1);

        if (easing === 'ease-out') {
          progress = 1 - Math.pow(1 - progress, 3);
        }

        this.position.lerpVectors(startPosition, targetPosition, progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  getTori(): TorusPolynomial[] {
    return this.tori;
  }

  getK(): number {
    return this.k;
  }

  getLabel(): string {
    return this.label;
  }

  updateLabel(newLabel: string): void {
    this.label = newLabel;
    if (this.labelSprite) {
      this.remove(this.labelSprite);
    }
    this.createLabel();
  }
}
