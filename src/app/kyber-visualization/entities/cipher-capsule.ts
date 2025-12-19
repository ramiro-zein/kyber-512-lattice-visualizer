import * as THREE from 'three';
import { VectorPolynomial } from './vector-polynomial';
import { TorusPolynomial } from './torus-polynomial';
import { KYBER_COLORS } from './colors';

/**
 * Cápsula de cifrado que contiene el ciphertext (u, v).
 * Visualizada como una esfera translúcida con partículas internas.
 */
export class CipherCapsule extends THREE.Group {
  private outerSphere!: THREE.Mesh;
  private innerGlow!: THREE.Mesh;
  private particles!: THREE.Points;
  private vectorU?: VectorPolynomial;
  private torusV?: TorusPolynomial;

  private readonly RADIUS = 40;
  private isSealed = false;

  constructor() {
    super();
    this.createOuterSphere();
    this.createInnerGlow();
    this.createParticles();
  }

  private createOuterSphere(): void {
    const geometry = new THREE.SphereGeometry(this.RADIUS, 64, 64);
    const material = new THREE.MeshPhysicalMaterial({
      color: KYBER_COLORS.CIPHERTEXT,
      transparent: true,
      opacity: 0.3,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.7,
      thickness: 2,
      envMapIntensity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide,
    });

    this.outerSphere = new THREE.Mesh(geometry, material);
    this.add(this.outerSphere);
  }

  private createInnerGlow(): void {
    const geometry = new THREE.SphereGeometry(this.RADIUS * 0.9, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: KYBER_COLORS.CIPHERTEXT,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });

    this.innerGlow = new THREE.Mesh(geometry, material);
    this.add(this.innerGlow);
  }

  /** Crea partículas con movimiento browniano dentro de la cápsula */
  private createParticles(): void {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * this.RADIUS * 0.8;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      velocities[i * 3] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.userData['velocities'] = velocities;

    const material = new THREE.PointsMaterial({
      color: KYBER_COLORS.CIPHERTEXT,
      size: 0.5,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geometry, material);
    this.add(this.particles);
  }

  /** Inserta el vector u y el toro v dentro de la cápsula */
  setContent(u: VectorPolynomial, v: TorusPolynomial): void {
    if (this.vectorU) this.remove(this.vectorU);
    if (this.torusV) this.remove(this.torusV);

    const scale = 0.5;
    u.scale.setScalar(scale);
    v.scale.setScalar(scale);

    u.position.set(-10, 0, 0);
    v.position.set(15, 0, 0);

    this.vectorU = u;
    this.torusV = v;

    this.add(u);
    this.add(v);
  }

  /** Anima el sellado de la cápsula */
  animateSeal(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const material = this.outerSphere.material as THREE.MeshPhysicalMaterial;
      const startOpacity = 0.3;
      const targetOpacity = 0.5;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        material.opacity = startOpacity + (targetOpacity - startOpacity) * progress;
        const pulse = 1 + Math.sin(progress * Math.PI * 4) * 0.05;
        this.outerSphere.scale.setScalar(pulse);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.outerSphere.scale.setScalar(1);
          this.isSealed = true;
          resolve();
        }
      };

      animate();
    });
  }

  /** Anima la apertura de la cápsula */
  animateOpen(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const material = this.outerSphere.material as THREE.MeshPhysicalMaterial;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        material.opacity = 0.5 * (1 - progress);
        this.outerSphere.scale.setScalar(1 + progress * 0.5);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isSealed = false;
          resolve();
        }
      };

      animate();
    });
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
        this.rotation.y += 0.02;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  /** Actualiza el movimiento browniano de partículas */
  update(delta: number): void {
    const positions = this.particles.geometry.attributes['position'].array as Float32Array;
    const velocities = this.particles.geometry.userData['velocities'] as Float32Array;
    const particleCount = positions.length / 3;

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += velocities[i * 3] * delta;
      positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;

      const dist = Math.sqrt(
        positions[i * 3] ** 2 + positions[i * 3 + 1] ** 2 + positions[i * 3 + 2] ** 2
      );

      if (dist > this.RADIUS * 0.8) {
        velocities[i * 3] *= -1;
        velocities[i * 3 + 1] *= -1;
        velocities[i * 3 + 2] *= -1;
      }

      velocities[i * 3] += (Math.random() - 0.5) * 0.1;
      velocities[i * 3 + 1] += (Math.random() - 0.5) * 0.1;
      velocities[i * 3 + 2] += (Math.random() - 0.5) * 0.1;
    }

    this.particles.geometry.attributes['position'].needsUpdate = true;
    this.particles.rotation.y += delta * 0.1;
  }

  animateAppear(duration: number): Promise<void> {
    return new Promise((resolve) => {
      this.scale.set(0, 0, 0);
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
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

  getVectorU(): VectorPolynomial | undefined {
    return this.vectorU;
  }

  getTorusV(): TorusPolynomial | undefined {
    return this.torusV;
  }

  isCurrentlySealed(): boolean {
    return this.isSealed;
  }
}
