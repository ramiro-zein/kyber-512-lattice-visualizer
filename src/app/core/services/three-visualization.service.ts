/**
 * @fileoverview Three.js Visualization Service for Kyber-512
 * @description Professional 3D rendering service for cryptographic operations
 * @author Doctorate Level Implementation
 */

import { Injectable, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';
import { Poly, KYBER_512_PARAMS, PolyVector, PolyMatrix } from '../models/kyber.types';

/**
 * Visual configuration constants
 */
const VISUAL_CONFIG = {
  // Scene positioning
  ZONE_ALICE_X: -12,
  ZONE_BOB_X: 12,
  ROW_0_Z: -3,
  ROW_1_Z: 1,
  BASE_Y: 1.2,

  // Colors (semantic color scheme)
  COLOR_MATRIX: 0x06b6d4, // Cyan - Public matrix A
  COLOR_SECRET: 0xd946ef, // Magenta - Secret key s
  COLOR_PUBLIC: 0x8b5cf6, // Purple - Public key t
  COLOR_BOB_OP: 0x10b981, // Green - Bob's operations (u, v)
  COLOR_MSG: 0xfacc15, // Yellow - Message
  COLOR_ERROR: 0xef4444, // Red - Error states
  COLOR_SUCCESS: 0x22c55e, // Bright green - Success

  // Lattice visualization
  LATTICE_SIZE: 1.8,
  LATTICE_SEGMENTS: 3,
  NODE_SIZE: 0.05,
  CORE_OPACITY: 0.3,
  WIREFRAME_OPACITY: 0.15,

  // Camera
  CAMERA_FOV: 40,
  CAMERA_BASE_Z: 55,

  // Animation
  ANIM_DURATION: 1000,
  ANIM_DELAY_STEP: 1200,
} as const;

/**
 * Visual element representing a polynomial in 3D space
 */
export interface PolyVisual {
  group: THREE.Group;
  polynomial: Poly;
  label: string;
  color: number;
}

/**
 * Scene management service for Three.js visualization
 */
@Injectable({
  providedIn: 'root',
})
export class ThreeVisualizationService {
  // Three.js core objects
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;

  // Scene groups for different cryptographic components
  private groupA!: THREE.Group; // Matrix A
  private groupS!: THREE.Group; // Secret s
  private groupT!: THREE.Group; // Public key t
  private groupU!: THREE.Group; // Ciphertext u
  private groupV: THREE.Group | null = null; // Ciphertext v
  private groupMessage: THREE.Group | null = null; // Message
  private groupResult: THREE.Group | null = null; // Decryption result

  // State
  private animationFrameId: number | null = null;
  private isInitialized = false;

  constructor() {}

  /**
   * Initialize Three.js scene with given container
   */
  public initialize(container: ElementRef<HTMLDivElement>): void {
    if (this.isInitialized) {
      console.warn('ThreeVisualizationService already initialized');
      return;
    }

    this.initScene();
    this.initCamera();
    this.initRenderer(container);
    this.initControls();
    this.initLighting();
    this.initGrid();
    this.initGroups();

    this.isInitialized = true;
    this.startAnimation();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Dispose and cleanup all Three.js resources
   */
  public dispose(): void {
    if (!this.isInitialized) return;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.controls?.dispose();
    this.renderer?.dispose();
    TWEEN.removeAll();

    // Cleanup geometry and materials
    this.scene?.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material?.dispose();
        }
      }
    });

    this.isInitialized = false;
  }

  // ========================================================================
  // INITIALIZATION METHODS
  // ========================================================================

  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020617);
    this.scene.fog = new THREE.FogExp2(0x020617, 0.015);
  }

  private initCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      VISUAL_CONFIG.CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.updateCameraPosition();
  }

  private initRenderer(container: ElementRef<HTMLDivElement>): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    container.nativeElement.appendChild(this.renderer.domElement);
  }

  private initControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 100;
  }

  private initLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Main directional light (cyan tint)
    const dirLight = new THREE.DirectionalLight(0x22d3ee, 1.0);
    dirLight.position.set(15, 30, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    this.scene.add(dirLight);

    // Fill light (magenta tint)
    const fillLight = new THREE.DirectionalLight(0xd946ef, 0.4);
    fillLight.position.set(-15, 10, -15);
    this.scene.add(fillLight);

    // Rim light for depth
    const rimLight = new THREE.DirectionalLight(0x6366f1, 0.3);
    rimLight.position.set(0, 5, -20);
    this.scene.add(rimLight);
  }

  private initGrid(): void {
    // Grid helper
    const gridHelper = new THREE.GridHelper(100, 50, 0x1e293b, 0x0f172a);
    this.scene.add(gridHelper);

    // Ground plane for shadows
    const planeGeometry = new THREE.PlaneGeometry(300, 300);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.4 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.01;
    plane.receiveShadow = true;
    this.scene.add(plane);
  }

  private initGroups(): void {
    this.groupA = new THREE.Group();
    this.groupS = new THREE.Group();
    this.groupT = new THREE.Group();
    this.groupU = new THREE.Group();

    this.scene.add(this.groupA);
    this.scene.add(this.groupS);
    this.scene.add(this.groupT);
    this.scene.add(this.groupU);
  }

  // ========================================================================
  // VISUALIZATION METHODS
  // ========================================================================

  /**
   * Visualize matrix A (public matrix)
   */
  public visualizeMatrixA(matrix: PolyMatrix): void {
    this.groupA.clear();
    const { K } = KYBER_512_PARAMS;

    for (let i = 0; i < K; i++) {
      for (let j = 0; j < K; j++) {
        const z = i === 0 ? VISUAL_CONFIG.ROW_0_Z : VISUAL_CONFIG.ROW_1_Z;
        const x = VISUAL_CONFIG.ZONE_ALICE_X + j * 3.0;
        const group = this.createPolyBlock(
          matrix[i][j],
          VISUAL_CONFIG.COLOR_MATRIX,
          x,
          z,
          `A[${i},${j}]`
        );
        this.groupA.add(group);
      }
    }
  }

  /**
   * Visualize secret vector s
   */
  public visualizeSecretS(vector: PolyVector): void {
    this.groupS.clear();
    const { K } = KYBER_512_PARAMS;
    const s_x = VISUAL_CONFIG.ZONE_ALICE_X + 7;

    for (let i = 0; i < K; i++) {
      const z = i === 0 ? VISUAL_CONFIG.ROW_0_Z : VISUAL_CONFIG.ROW_1_Z;
      const group = this.createPolyBlock(
        vector[i],
        VISUAL_CONFIG.COLOR_SECRET,
        s_x,
        z,
        `s[${i}]`
      );
      this.groupS.add(group);
    }
  }

  /**
   * Visualize public key t
   */
  public visualizePublicKeyT(vector: PolyVector): void {
    this.groupT.clear();
    const { K } = KYBER_512_PARAMS;
    const t_x = VISUAL_CONFIG.ZONE_ALICE_X + 12;

    for (let i = 0; i < K; i++) {
      const z = i === 0 ? VISUAL_CONFIG.ROW_0_Z : VISUAL_CONFIG.ROW_1_Z;
      const group = this.createPolyBlock(
        vector[i],
        VISUAL_CONFIG.COLOR_PUBLIC,
        t_x,
        z,
        `t[${i}]`
      );
      this.groupT.add(group);
    }
  }

  /**
   * Visualize message before encryption
   */
  public visualizeMessage(bit: number): void {
    const { Q, N } = KYBER_512_PARAMS;
    const encodedVal = bit === 1 ? Math.floor(Q / 2) : 0;
    const msgPoly = new Poly([encodedVal, ...new Array(N - 1).fill(0)]);

    if (this.groupMessage) {
      this.scene.remove(this.groupMessage);
    }

    this.groupMessage = this.createPolyBlock(
      msgPoly,
      VISUAL_CONFIG.COLOR_MSG,
      VISUAL_CONFIG.ZONE_BOB_X,
      3,
      `m:${bit}`
    );
    this.scene.add(this.groupMessage);
  }

  /**
   * Visualize ciphertext u vector
   */
  public visualizeCiphertextU(vector: PolyVector): void {
    this.groupU.clear();
    const { K } = KYBER_512_PARAMS;
    const u_x = VISUAL_CONFIG.ZONE_BOB_X - 4;

    for (let i = 0; i < K; i++) {
      const z = i === 0 ? VISUAL_CONFIG.ROW_0_Z : VISUAL_CONFIG.ROW_1_Z;
      const group = this.createPolyBlock(
        vector[i],
        VISUAL_CONFIG.COLOR_BOB_OP,
        u_x,
        z,
        `u[${i}]`
      );
      this.groupU.add(group);
    }
  }

  /**
   * Visualize ciphertext v polynomial
   */
  public visualizeCiphertextV(poly: Poly): void {
    if (this.groupMessage) {
      this.scene.remove(this.groupMessage);
      this.groupMessage = null;
    }

    if (this.groupV) {
      this.scene.remove(this.groupV);
    }

    this.groupV = this.createPolyBlock(
      poly,
      VISUAL_CONFIG.COLOR_BOB_OP,
      VISUAL_CONFIG.ZONE_BOB_X + 2,
      0,
      'v'
    );
    this.scene.add(this.groupV);
  }

  /**
   * Animate ciphertext transmission from Bob to Alice
   */
  public animateCiphertextTransmission(): Promise<void> {
    return new Promise((resolve) => {
      const targetX = VISUAL_CONFIG.ZONE_ALICE_X + 17;

      const tweenU = new TWEEN.Tween(this.groupU.position)
        .to({ x: targetX - 5 }, 2000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();

      if (this.groupV) {
        const tweenV = new TWEEN.Tween(this.groupV.position)
          .to({ x: targetX, z: 0 }, 2000)
          .easing(TWEEN.Easing.Cubic.InOut)
          .onComplete(() => resolve())
          .start();
      } else {
        tweenU.onComplete(() => resolve());
      }
    });
  }

  /**
   * Visualize decryption result
   */
  public visualizeDecryptionResult(
    noisyPoly: Poly,
    decryptedBit: number,
    success: boolean
  ): void {
    if (this.groupResult) {
      this.scene.remove(this.groupResult);
    }

    const color = success ? VISUAL_CONFIG.COLOR_MSG : VISUAL_CONFIG.COLOR_ERROR;
    this.groupResult = this.createPolyBlock(
      noisyPoly,
      color,
      VISUAL_CONFIG.ZONE_ALICE_X + 7,
      3,
      `m':${decryptedBit}`
    );
    this.scene.add(this.groupResult);

    // Dramatic entrance animation
    this.groupResult.scale.set(0.5, 0.5, 0.5);
    new TWEEN.Tween(this.groupResult.scale)
      .to({ x: 1.2, y: 1.2, z: 1.2 }, VISUAL_CONFIG.ANIM_DURATION)
      .easing(TWEEN.Easing.Elastic.Out)
      .start();

    // Move secret key for visual clarity
    new TWEEN.Tween(this.groupS.position)
      .to({ x: 7 }, VISUAL_CONFIG.ANIM_DURATION)
      .easing(TWEEN.Easing.Cubic.InOut)
      .start();
  }

  /**
   * Clear all visualizations for new operation
   */
  public clearRound(): void {
    TWEEN.removeAll();

    this.groupU.position.set(0, 0, 0);
    this.groupS.position.set(0, 0, 0);
    this.groupU.clear();

    if (this.groupV) {
      this.scene.remove(this.groupV);
      this.groupV = null;
    }
    if (this.groupMessage) {
      this.scene.remove(this.groupMessage);
      this.groupMessage = null;
    }
    if (this.groupResult) {
      this.scene.remove(this.groupResult);
      this.groupResult = null;
    }
  }

  /**
   * Clear all visualizations completely
   */
  public clearAll(): void {
    this.clearRound();
    this.groupA.clear();
    this.groupS.clear();
    this.groupT.clear();
  }

  // ========================================================================
  // LATTICE VISUALIZATION
  // ========================================================================

  /**
   * Create 3D lattice block representing a polynomial
   */
  private createPolyBlock(
    poly: Poly,
    colorHex: number,
    x: number,
    z: number,
    labelText: string
  ): THREE.Group {
    const group = new THREE.Group();
    const { LATTICE_SIZE, LATTICE_SEGMENTS, NODE_SIZE, BASE_Y } = VISUAL_CONFIG;

    const step = LATTICE_SIZE / LATTICE_SEGMENTS;
    const offset = LATTICE_SIZE / 2;

    group.position.set(x, BASE_Y + offset - 0.5, z);

    // 1. LATTICE NODES (spheres at lattice points)
    const sphereGeo = new THREE.SphereGeometry(NODE_SIZE, 8, 8);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
    });

    const numPoints = Math.pow(LATTICE_SEGMENTS + 1, 3);
    const instancedSpheres = new THREE.InstancedMesh(sphereGeo, sphereMat, numPoints);
    instancedSpheres.castShadow = true;

    let idx = 0;
    const dummy = new THREE.Object3D();
    for (let i = 0; i <= LATTICE_SEGMENTS; i++) {
      for (let j = 0; j <= LATTICE_SEGMENTS; j++) {
        for (let k = 0; k <= LATTICE_SEGMENTS; k++) {
          dummy.position.set(
            i * step - offset,
            j * step - offset,
            k * step - offset
          );
          dummy.updateMatrix();
          instancedSpheres.setMatrixAt(idx++, dummy.matrix);
        }
      }
    }
    instancedSpheres.instanceMatrix.needsUpdate = true;
    group.add(instancedSpheres);

    // 2. WIREFRAME EDGES
    const boxGeo = new THREE.BoxGeometry(
      LATTICE_SIZE,
      LATTICE_SIZE,
      LATTICE_SIZE,
      LATTICE_SEGMENTS,
      LATTICE_SEGMENTS,
      LATTICE_SEGMENTS
    );
    const wireframe = new THREE.WireframeGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: VISUAL_CONFIG.WIREFRAME_OPACITY,
    });
    const lines = new THREE.LineSegments(wireframe, lineMat);
    group.add(lines);

    // 3. INNER GLOWING CORE
    const coreGeo = new THREE.BoxGeometry(
      LATTICE_SIZE * 0.4,
      LATTICE_SIZE * 0.4,
      LATTICE_SIZE * 0.4
    );
    const coreMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: VISUAL_CONFIG.CORE_OPACITY,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.userData = { pulse: true }; // Marker for animation
    group.add(core);

    // 4. LABEL SPRITE
    const sprite = this.createTextSprite(
      labelText,
      poly.toString(),
      new THREE.Vector3(0, offset + 1.0, 0)
    );
    group.add(sprite);

    // 5. ENTRANCE ANIMATION
    group.scale.set(0, 0, 0);
    new TWEEN.Tween(group.scale)
      .to({ x: 1, y: 1, z: 1 }, VISUAL_CONFIG.ANIM_DURATION)
      .easing(TWEEN.Easing.Elastic.Out)
      .start();

    return group;
  }

  /**
   * Create text sprite label
   */
  private createTextSprite(
    mainText: string,
    subText: string,
    position: THREE.Vector3
  ): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 128;

    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 512, 128);

    // Main text
    ctx.font = 'bold 42px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.fillText(mainText, 256, 48);

    // Subtext
    if (subText) {
      ctx.font = '24px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.shadowBlur = 0;
      ctx.fillText(subText, 256, 96);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.position.copy(position);
    sprite.scale.set(6, 1.5, 1);

    return sprite;
  }

  // ========================================================================
  // ANIMATION & RENDERING
  // ========================================================================

  private startAnimation(): void {
    const animate = (time: number) => {
      this.animationFrameId = requestAnimationFrame(animate);

      TWEEN.update(time);
      this.controls.update();

      // Pulse animation for core elements
      const scale = 1 + Math.sin(time * 0.002) * 0.1;
      this.scene.traverse((object) => {
        if (object.userData['pulse']) {
          object.scale.set(scale, scale, scale);
        }
      });

      this.renderer.render(this.scene, this.camera);
    };
    animate(0);
  }

  private updateCameraPosition(): void {
    const aspect = window.innerWidth / window.innerHeight;
    const baseZ = VISUAL_CONFIG.CAMERA_BASE_Z;

    if (aspect < 1.0) {
      // Mobile/portrait
      this.camera.position.set(0, 40 + (1 / aspect) * 15, baseZ / (aspect * 0.7));
    } else {
      // Desktop/landscape
      this.camera.position.set(0, 30, baseZ);
    }
  }

  private onWindowResize(): void {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.updateCameraPosition();
  }
}
