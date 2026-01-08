import * as THREE from 'three';
import {
  MatrixPolynomial,
  VectorPolynomial,
  TorusPolynomial,
  MessageSphere,
  CipherCapsule,
  SharedKeySphere,
  KYBER_COLORS,
} from '../entities';

export type KyberPhase = 'idle' | 'keygen' | 'encaps' | 'decaps' | 'complete';

export interface KyberState {
  phase: KyberPhase;
  subPhase: string;
  progress: number;
}

/**
 * Orquestador de la visualización de CRYSTALS-Kyber.
 * Gestiona los tres actos del protocolo: KeyGen, Encaps, Decaps.
 */
export class KyberOrchestrator {
  private scene: THREE.Scene;

  private matrixA?: MatrixPolynomial;
  private secretS?: VectorPolynomial;
  private errorE?: VectorPolynomial;
  private vectorT?: VectorPolynomial;

  private ephemeralR?: VectorPolynomial;
  private error1?: VectorPolynomial;
  private error2?: TorusPolynomial;
  private vectorU?: VectorPolynomial;
  private torusV?: TorusPolynomial;

  private messageSphere?: MessageSphere;
  private cipherCapsule?: CipherCapsule;
  private sharedKeyEmitter?: SharedKeySphere;
  private sharedKeyReceiver?: SharedKeySphere;

  private readonly PUBLIC_ZONE = new THREE.Vector3(-100, 0, 50);
  private readonly PRIVATE_ZONE = new THREE.Vector3(100, 0, -100);
  private readonly MESSAGE_ZONE = new THREE.Vector3(0, 150, 0);
  private readonly CIPHER_ZONE = new THREE.Vector3(0, 50, 100);

  private currentPhase: KyberPhase = 'idle';
  private k = 3;
  private onStateChange?: (state: KyberState) => void;
  private isAborted = false;

  constructor(scene: THREE.Scene, k = 3) {
    this.scene = scene;
    this.k = k;
  }

  setStateChangeCallback(callback: (state: KyberState) => void): void {
    this.onStateChange = callback;
  }

  private emitState(subPhase: string, progress: number): void {
    this.onStateChange?.({ phase: this.currentPhase, subPhase, progress });
  }

  /** Acto 1: Generación de claves (pk, sk) */
  async runKeyGen(): Promise<void> {
    this.currentPhase = 'keygen';
    this.emitState('Iniciando generación de claves', 0);

    this.emitState('Generando matriz pública A', 0.1);
    this.matrixA = new MatrixPolynomial(this.k, KYBER_COLORS.MATRIX_A, 'A');
    this.matrixA.position.set(-50, 0, 0);
    this.scene.add(this.matrixA);

    await this.matrixA.animateAppear(2000);
    this.matrixA.animateGeneration(2000);
    await this.delay(2000);

    this.emitState('Generando vector secreto s', 0.3);
    this.secretS = new VectorPolynomial(this.k, KYBER_COLORS.SECRET_S, 's');
    this.secretS.position.set(80, 0, 0);
    this.scene.add(this.secretS);

    await this.secretS.animateSequentialAppear(400);
    this.secretS.generateSmallCoefficients(2);

    this.emitState('Generando vector de error e', 0.4);
    this.errorE = new VectorPolynomial(this.k, KYBER_COLORS.ERROR_E, 'e');
    this.errorE.position.set(150, 0, 0);
    this.scene.add(this.errorE);

    await this.errorE.animateSequentialAppear(400);
    this.errorE.generateSmallCoefficients(2);
    await this.delay(1000);

    this.emitState('Calculando t = A·s + e', 0.5);
    await this.animateMatrixVectorProduct();

    this.vectorT = new VectorPolynomial(this.k, KYBER_COLORS.VECTOR_T, 't');
    this.vectorT.position.set(80, 0, 80);
    this.scene.add(this.vectorT);

    await this.vectorT.animateSequentialAppear(400);
    this.vectorT.generateRandomCoefficients();
    await this.delay(1000);

    this.emitState('Separando claves pública y privada', 0.8);
    await Promise.all([
      this.matrixA.animateMoveTo(this.PUBLIC_ZONE, 2000),
      this.vectorT.animateMoveTo(
        new THREE.Vector3(this.PUBLIC_ZONE.x + 100, this.PUBLIC_ZONE.y, this.PUBLIC_ZONE.z),
        2000
      ),
    ]);

    await this.secretS.animateMoveTo(this.PRIVATE_ZONE, 2000);
    await this.fadeOutEntity(this.errorE, 1000);
    this.scene.remove(this.errorE);
    this.errorE = undefined;

    this.emitState('Claves generadas: pk=(A,t), sk=s', 1);
    await this.delay(1000);
    this.currentPhase = 'idle';
  }

  /** Acto 2: Encapsulamiento - genera ciphertext y clave compartida */
  async runEncaps(): Promise<void> {
    if (!this.matrixA || !this.vectorT) {
      console.error('Debe ejecutar KeyGen primero');
      return;
    }

    this.currentPhase = 'encaps';
    this.emitState('Iniciando encapsulamiento', 0);

    this.emitState('Generando mensaje aleatorio m', 0.1);
    this.messageSphere = new MessageSphere();
    this.messageSphere.position.copy(this.MESSAGE_ZONE);
    this.scene.add(this.messageSphere);

    await this.messageSphere.animateAppear(1000);
    await this.messageSphere.animateGeneration(1500);

    this.emitState('Derivando vectores efímeros r, e1, e2', 0.2);

    this.ephemeralR = new VectorPolynomial(this.k, KYBER_COLORS.EPHEMERAL_R, 'r');
    this.ephemeralR.position.set(0, 100, 50);
    this.scene.add(this.ephemeralR);
    await this.ephemeralR.animateSequentialAppear(300);
    this.ephemeralR.generateSmallCoefficients(2);

    this.error1 = new VectorPolynomial(this.k, KYBER_COLORS.ERROR_E, 'e1');
    this.error1.position.set(-50, 100, 50);
    this.scene.add(this.error1);
    await this.error1.animateSequentialAppear(300);
    this.error1.generateSmallCoefficients(2);

    this.error2 = new TorusPolynomial(KYBER_COLORS.ERROR_E, 'e2');
    this.error2.position.set(50, 100, 50);
    this.scene.add(this.error2);
    await this.error2.animateAppear(500);
    this.error2.generateSmallCoefficients(2);
    await this.delay(1000);

    this.emitState('Calculando u = A^T·r + e1', 0.4);
    await this.matrixA.animateTranspose(1000);

    this.vectorU = new VectorPolynomial(this.k, KYBER_COLORS.CIPHERTEXT, 'u');
    this.vectorU.position.set(0, 50, 0);
    this.scene.add(this.vectorU);
    await this.vectorU.animateSequentialAppear(400);
    this.vectorU.generateRandomCoefficients();
    await this.delay(500);

    this.emitState('Calculando v = t^T·r + e2 + encode(m)', 0.6);
    this.torusV = new TorusPolynomial(KYBER_COLORS.CIPHERTEXT, 'v');
    this.torusV.position.set(50, 50, 0);
    this.scene.add(this.torusV);
    await this.torusV.animateAppear(500);
    this.torusV.generateRandomCoefficients();
    await this.delay(500);

    this.emitState('Encapsulando cifrado (u, v)', 0.8);
    this.cipherCapsule = new CipherCapsule();
    this.cipherCapsule.position.copy(this.CIPHER_ZONE);
    this.scene.add(this.cipherCapsule);
    await this.cipherCapsule.animateAppear(1000);

    await Promise.all([
      this.vectorU.animateMoveTo(this.CIPHER_ZONE, 1000),
      this.animateTorusMoveTo(this.torusV, this.CIPHER_ZONE, 1000),
    ]);

    this.scene.remove(this.vectorU);
    this.scene.remove(this.torusV);
    this.cipherCapsule.setContent(this.vectorU, this.torusV);
    await this.cipherCapsule.animateSeal(1000);

    this.emitState('Derivando clave compartida K', 0.9);
    this.sharedKeyEmitter = new SharedKeySphere();
    this.sharedKeyEmitter.position.set(-50, 80, 100);
    this.scene.add(this.sharedKeyEmitter);
    await this.sharedKeyEmitter.animateAppear(1000);

    await this.fadeOutEntity(this.ephemeralR, 500);
    await this.fadeOutEntity(this.error1, 500);
    await this.fadeOutEntity(this.error2, 500);

    this.scene.remove(this.ephemeralR);
    this.scene.remove(this.error1);
    this.scene.remove(this.error2);
    this.ephemeralR = undefined;
    this.error1 = undefined;
    this.error2 = undefined;

    this.emitState('Cifrado completado: c=(u,v), K derivada', 1);
    await this.delay(1000);
    this.currentPhase = 'idle';
  }

  /** Acto 3: Decapsulamiento - recupera la clave compartida */
  async runDecaps(): Promise<void> {
    if (!this.cipherCapsule || !this.secretS) {
      console.error('Debe ejecutar Encaps primero');
      return;
    }

    this.currentPhase = 'decaps';
    this.emitState('Iniciando decapsulamiento', 0);

    this.emitState('Recibiendo y abriendo cápsula', 0.1);
    await this.cipherCapsule.animateMoveTo(new THREE.Vector3(0, 50, 0), 1500);
    await this.cipherCapsule.animateOpen(1000);

    await this.secretS.animateMoveTo(new THREE.Vector3(80, 50, 0), 1000);
    await this.delay(500);

    this.emitState('Calculando s^T·u', 0.3);
    await this.animateSecretOperation();
    await this.delay(500);

    this.emitState("Recuperando mensaje m' = decode(v - s^T·u)", 0.5);
    const recoveredMessage = new MessageSphere();
    recoveredMessage.position.set(0, 120, 0);
    this.scene.add(recoveredMessage);
    await recoveredMessage.animateAppear(1000);

    if (this.messageSphere) {
      recoveredMessage.setBits(this.messageSphere.getBits());
    }
    await this.delay(1000);

    this.emitState('Verificando integridad (Fujisaki-Okamoto)', 0.7);
    await this.animateVerification(true);
    await this.delay(500);

    this.emitState('Derivando clave compartida K', 0.9);
    this.sharedKeyReceiver = new SharedKeySphere();
    this.sharedKeyReceiver.position.set(50, 80, 100);
    this.scene.add(this.sharedKeyReceiver);
    await this.sharedKeyReceiver.animateAppear(1000);

    if (this.sharedKeyEmitter) {
      const connection = this.sharedKeyEmitter.createConnectionTo(this.sharedKeyReceiver);
      this.scene.add(connection);
    }

    this.emitState('Clave compartida establecida - Comunicación segura', 1);
    await this.delay(1000);
    this.currentPhase = 'complete';
  }

  async runFullDemo(): Promise<void> {
    await this.runKeyGen();
    await this.delay(1000);
    await this.runEncaps();
    await this.delay(1000);
    await this.runDecaps();
  }

  reset(): void {
    // Abort any running animations
    this.isAborted = true;

    const entitiesToRemove = [
      this.matrixA, this.secretS, this.errorE, this.vectorT,
      this.ephemeralR, this.error1, this.error2, this.vectorU, this.torusV,
      this.messageSphere, this.cipherCapsule, this.sharedKeyEmitter, this.sharedKeyReceiver,
    ];

    entitiesToRemove.forEach((entity) => {
      if (entity) {
        // Dispose of Three.js resources
        entity.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else if (child.material) {
              child.material.dispose();
            }
          }
          if (child instanceof THREE.Line) {
            child.geometry?.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        });
        this.scene.remove(entity);
      }
    });

    // Also clean up any stray lines (rays from matrix operations)
    const linesToRemove: THREE.Object3D[] = [];
    this.scene.traverse((child) => {
      if (child instanceof THREE.Line && child.parent === this.scene) {
        linesToRemove.push(child);
      }
    });
    linesToRemove.forEach((line) => {
      if (line instanceof THREE.Line) {
        line.geometry?.dispose();
        if (line.material instanceof THREE.Material) {
          line.material.dispose();
        }
      }
      this.scene.remove(line);
    });

    this.matrixA = undefined;
    this.secretS = undefined;
    this.errorE = undefined;
    this.vectorT = undefined;
    this.ephemeralR = undefined;
    this.error1 = undefined;
    this.error2 = undefined;
    this.vectorU = undefined;
    this.torusV = undefined;
    this.messageSphere = undefined;
    this.cipherCapsule = undefined;
    this.sharedKeyEmitter = undefined;
    this.sharedKeyReceiver = undefined;

    this.currentPhase = 'idle';
    this.emitState('Listo para iniciar', 0);

    // Reset abort flag after a short delay to allow pending promises to reject
    setTimeout(() => {
      this.isAborted = false;
    }, 100);
  }

  update(delta: number, elapsed: number): void {
    this.messageSphere?.update(delta);
    this.cipherCapsule?.update(delta);
    this.sharedKeyEmitter?.update(delta, elapsed);
    this.sharedKeyReceiver?.update(delta, elapsed);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.isAborted) {
          reject(new Error('Animation aborted'));
        } else {
          resolve();
        }
      }, ms);

      // Store timeout for potential cleanup
      if (this.isAborted) {
        clearTimeout(timeoutId);
        reject(new Error('Animation aborted'));
      }
    });
  }

  private checkAbort(): void {
    if (this.isAborted) {
      throw new Error('Animation aborted');
    }
  }

  /** Visualiza el producto matriz-vector A·s con rayos */
  private async animateMatrixVectorProduct(): Promise<void> {
    if (!this.matrixA || !this.secretS) return;

    const rays: THREE.Line[] = [];
    const rayMaterial = new THREE.LineBasicMaterial({
      color: KYBER_COLORS.OPERATION_RAY,
      transparent: true,
      opacity: 0.8,
    });

    for (let i = 0; i < this.k; i++) {
      const row = this.matrixA.getRow(i);
      const sTori = this.secretS.getTori();

      for (let j = 0; j < this.k; j++) {
        const startPos = new THREE.Vector3();
        const endPos = new THREE.Vector3();
        row[j].getWorldPosition(startPos);
        sTori[j].getWorldPosition(endPos);

        const points = [startPos, endPos];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const ray = new THREE.Line(geometry, rayMaterial.clone());
        rays.push(ray);
        this.scene.add(ray);
      }
    }

    await this.delay(1500);

    for (const ray of rays) {
      const material = ray.material as THREE.LineBasicMaterial;
      const startOpacity = material.opacity;

      await new Promise<void>((resolve) => {
        const startTime = Date.now();
        const duration = 500;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          material.opacity = startOpacity * (1 - progress);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            this.scene.remove(ray);
            resolve();
          }
        };
        animate();
      });
    }
  }

  private async animateSecretOperation(): Promise<void> {
    if (!this.secretS) return;

    const tori = this.secretS.getTori();
    for (const torus of tori) {
      await torus.transitionColor(new THREE.Color(0xff4444), 300);
      await torus.transitionColor(KYBER_COLORS.SECRET_S, 300);
    }
  }

  private async animateVerification(success: boolean): Promise<void> {
    const color = success ? KYBER_COLORS.SUCCESS : KYBER_COLORS.FAILURE;

    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0,
    });

    const verificationSphere = new THREE.Mesh(geometry, material);
    verificationSphere.position.set(0, 80, 0);
    this.scene.add(verificationSphere);

    await new Promise<void>((resolve) => {
      const startTime = Date.now();
      const duration = 800;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        material.opacity = progress * 0.8;
        verificationSphere.scale.setScalar(1 + Math.sin(progress * Math.PI * 4) * 0.2);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });

    await this.delay(1000);
    await this.fadeOutEntity(verificationSphere, 500);
    this.scene.remove(verificationSphere);
  }

  private async fadeOutEntity(entity: THREE.Object3D, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        entity.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const material = child.material as THREE.Material;
            if ('opacity' in material) {
              (material as THREE.MeshBasicMaterial).opacity = 1 - progress;
            }
          }
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  }

  private async animateTorusMoveTo(
    torus: TorusPolynomial,
    target: THREE.Vector3,
    duration: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const startPosition = torus.position.clone();
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        torus.position.lerpVectors(startPosition, target, eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  getCurrentPhase(): KyberPhase {
    return this.currentPhase;
  }
}
