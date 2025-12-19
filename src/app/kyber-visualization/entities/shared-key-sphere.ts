import * as THREE from 'three';

/**
 * Clave compartida K visualizada como una esfera holográfica iridiscente.
 * Usa shaders personalizados para efecto de arcoíris dinámico.
 */
export class SharedKeySphere extends THREE.Group {
  private sphere!: THREE.Mesh;
  private rings: THREE.Mesh[] = [];
  private glowSphere!: THREE.Mesh;

  private readonly RADIUS = 10;

  constructor() {
    super();
    this.createSphere();
    this.createRings();
    this.createGlow();
  }

  /** Crea la esfera principal con shader holográfico */
  private createSphere(): void {
    const geometry = new THREE.IcosahedronGeometry(this.RADIUS, 4);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        colorA: { value: new THREE.Color(0xff0080) },
        colorB: { value: new THREE.Color(0x00ffff) },
        colorC: { value: new THREE.Color(0xffff00) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 colorA;
        uniform vec3 colorB;
        uniform vec3 colorC;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          float wave = sin(vPosition.x * 2.0 + time) * 0.5 + 0.5;
          float wave2 = sin(vPosition.y * 2.0 + time * 1.3) * 0.5 + 0.5;
          float wave3 = sin(vPosition.z * 2.0 + time * 0.7) * 0.5 + 0.5;

          vec3 color = mix(colorA, colorB, wave);
          color = mix(color, colorC, wave2);
          color = mix(color, colorA, wave3 * 0.5);

          float alpha = 0.7 + fresnel * 0.3;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });

    this.sphere = new THREE.Mesh(geometry, material);
    this.add(this.sphere);
  }

  /** Crea anillos orbitales decorativos */
  private createRings(): void {
    const ringGeometry = new THREE.TorusGeometry(this.RADIUS * 1.3, 0.3, 16, 64);

    for (let i = 0; i < 3; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(i / 3, 1, 0.6),
        transparent: true,
        opacity: 0.6,
      });

      const ring = new THREE.Mesh(ringGeometry, material);
      ring.rotation.x = (i * Math.PI) / 3;
      ring.rotation.y = (i * Math.PI) / 6;

      this.rings.push(ring);
      this.add(ring);
    }
  }

  private createGlow(): void {
    const geometry = new THREE.SphereGeometry(this.RADIUS * 1.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });

    this.glowSphere = new THREE.Mesh(geometry, material);
    this.add(this.glowSphere);
  }

  update(delta: number, elapsed: number): void {
    const material = this.sphere.material as THREE.ShaderMaterial;
    material.uniforms['time'].value = elapsed;

    this.rings.forEach((ring, i) => {
      ring.rotation.z += delta * (0.5 + i * 0.2);
    });

    const pulse = 1 + Math.sin(elapsed * 2) * 0.1;
    this.glowSphere.scale.setScalar(pulse);
  }

  animateAppear(duration: number): Promise<void> {
    return new Promise((resolve) => {
      this.scale.set(0, 0, 0);
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.elasticEaseOut(progress);
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

  private elasticEaseOut(t: number): number {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
  }

  /** Crea línea de conexión visual entre dos claves compartidas */
  createConnectionTo(target: SharedKeySphere): THREE.Line {
    const points = [this.position.clone(), target.position.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });

    return new THREE.Line(geometry, material);
  }
}
