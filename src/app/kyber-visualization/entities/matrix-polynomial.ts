import * as THREE from 'three';
import { TorusPolynomial } from './torus-polynomial';
import { KYBER_COLORS, createWireframeMaterial } from './colors';

/**
 * Matriz k x k de polinomios en R_q.
 * Visualizada como una cuadrícula de toros en el plano XZ.
 */
export class MatrixPolynomial extends THREE.Group {
  private tori: TorusPolynomial[][] = [];
  private wireframe!: THREE.LineSegments;
  private labelSprite?: THREE.Sprite;

  private readonly TORUS_SPACING = 60;
  private readonly k: number;
  private baseColor: THREE.Color;
  private label: string;

  constructor(k: number, color: THREE.Color = KYBER_COLORS.MATRIX_A, label = 'A') {
    super();
    this.k = k;
    this.baseColor = color;
    this.label = label;

    this.createToriGrid();
    // this.createWireframe(); // Disabled for minimalist design
    this.createLabel();
  }

  /** Crea la cuadrícula de toros */
  private createToriGrid(): void {
    const offset = ((this.k - 1) * this.TORUS_SPACING) / 2;

    for (let i = 0; i < this.k; i++) {
      this.tori[i] = [];
      for (let j = 0; j < this.k; j++) {
        const torus = new TorusPolynomial(this.baseColor, `${this.label}[${i}][${j}]`);
        torus.position.x = j * this.TORUS_SPACING - offset;
        torus.position.z = i * this.TORUS_SPACING - offset;
        this.tori[i][j] = torus;
        this.add(torus);
      }
    }
  }

  /** Crea el wireframe delimitador de la matriz */
  private createWireframe(): void {
    const offset = ((this.k - 1) * this.TORUS_SPACING) / 2;
    const halfSpacing = this.TORUS_SPACING / 2 + 10;
    const points: THREE.Vector3[] = [];

    for (let j = 0; j <= this.k; j++) {
      const x = j * this.TORUS_SPACING - offset - halfSpacing + 10;
      points.push(new THREE.Vector3(x, -5, -offset - halfSpacing));
      points.push(new THREE.Vector3(x, -5, offset + halfSpacing - 10));
    }

    for (let i = 0; i <= this.k; i++) {
      const z = i * this.TORUS_SPACING - offset - halfSpacing + 10;
      points.push(new THREE.Vector3(-offset - halfSpacing, -5, z));
      points.push(new THREE.Vector3(offset + halfSpacing - 10, -5, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = createWireframeMaterial(this.baseColor);
    this.wireframe = new THREE.LineSegments(geometry, material);
    this.add(this.wireframe);
  }

  private createLabel(): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 128;
    canvas.height = 64;

    context.fillStyle = 'transparent';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'bold 40px JetBrains Mono, Fira Code, monospace';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(this.label, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    this.labelSprite = new THREE.Sprite(spriteMaterial);
    this.labelSprite.scale.set(20, 10, 1);
    this.labelSprite.position.y = 30;
    this.add(this.labelSprite);
  }

  generateRandomCoefficients(): void {
    for (let i = 0; i < this.k; i++) {
      for (let j = 0; j < this.k; j++) {
        this.tori[i][j].generateRandomCoefficients();
      }
    }
  }

  /** Anima la aparición con efecto de onda desde el centro */
  async animateAppear(duration: number): Promise<void> {
    for (let i = 0; i < this.k; i++) {
      for (let j = 0; j < this.k; j++) {
        this.tori[i][j].scale.set(0, 0, 0);
      }
    }

    const center = (this.k - 1) / 2;
    const maxDist = Math.sqrt(2) * center;
    const delayPerUnit = duration / (maxDist + 1);
    const promises: Promise<void>[] = [];

    for (let i = 0; i < this.k; i++) {
      for (let j = 0; j < this.k; j++) {
        const dist = Math.sqrt(Math.pow(i - center, 2) + Math.pow(j - center, 2));
        const delay = dist * delayPerUnit;

        const promise = new Promise<void>((resolve) => {
          setTimeout(() => {
            this.tori[i][j].animateAppear(duration / 2).then(resolve);
          }, delay);
        });

        promises.push(promise);
      }
    }

    await Promise.all(promises);
  }

  animateGeneration(duration: number, onComplete?: () => void): void {
    let completed = 0;
    const total = this.k * this.k;

    for (let i = 0; i < this.k; i++) {
      for (let j = 0; j < this.k; j++) {
        this.tori[i][j].animateGeneration(duration, () => {
          completed++;
          if (completed === total && onComplete) {
            onComplete();
          }
        });
      }
    }
  }

  /** Rota la matriz 90 grados (visualización de transposición) */
  animateTranspose(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startRotation = this.rotation.y;
      const targetRotation = startRotation + Math.PI / 2;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        this.rotation.y = startRotation + (targetRotation - startRotation) * eased;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  getRow(i: number): TorusPolynomial[] {
    return this.tori[i] || [];
  }

  getColumn(j: number): TorusPolynomial[] {
    return this.tori.map((row) => row[j]);
  }

  getTorus(i: number, j: number): TorusPolynomial | null {
    return this.tori[i]?.[j] || null;
  }

  createRowRays(
    rowIndex: number,
    targetPositions: THREE.Vector3[],
    color: THREE.Color = KYBER_COLORS.OPERATION_RAY
  ): THREE.Line[] {
    const rays: THREE.Line[] = [];
    const row = this.getRow(rowIndex);

    row.forEach((torus, j) => {
      if (targetPositions[j]) {
        const startPos = new THREE.Vector3();
        torus.getWorldPosition(startPos);

        const points = [startPos, targetPositions[j]];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.8,
        });

        const ray = new THREE.Line(geometry, material);
        rays.push(ray);
      }
    });

    return rays;
  }

  getK(): number {
    return this.k;
  }

  getLabel(): string {
    return this.label;
  }

  animateMoveTo(targetPosition: THREE.Vector3, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startPosition = this.position.clone();
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        this.position.lerpVectors(startPosition, targetPosition, eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }
}
