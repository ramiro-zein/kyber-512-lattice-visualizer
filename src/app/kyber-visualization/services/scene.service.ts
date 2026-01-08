import { Injectable, ElementRef, NgZone } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Servicio de gestión de la escena Three.js.
 * Maneja el renderer, cámara, controles y loop de animación.
 */
@Injectable({
  providedIn: 'root',
})
export class SceneService {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationId: number | null = null;
  private clock = new THREE.Clock();
  private animationCallbacks: ((delta: number, elapsed: number) => void)[] = [];

  constructor(private ngZone: NgZone) {}

  /** Inicializa la escena con canvas, cámara, renderer e iluminación */
  initialize(canvas: ElementRef<HTMLCanvasElement>, width: number, height: number): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000a14);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    this.camera.position.set(0, 200, 400);
    this.camera.lookAt(0, 50, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas.nativeElement,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 50;
    this.controls.maxDistance = 800;

    this.setupLighting();
    this.startAnimationLoop();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(100, 200, 100);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    this.scene.add(mainLight);

    const blueLight = new THREE.PointLight(0x00bfff, 0.5, 500);
    blueLight.position.set(-100, 100, -100);
    this.scene.add(blueLight);

    const redLight = new THREE.PointLight(0x8b0000, 0.3, 400);
    redLight.position.set(100, 50, -200);
    this.scene.add(redLight);
  }

  private startAnimationLoop(): void {
    this.ngZone.runOutsideAngular(() => {
      const animate = () => {
        this.animationId = requestAnimationFrame(animate);

        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime();

        this.animationCallbacks.forEach((cb) => cb(delta, elapsed));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
      };
      animate();
    });
  }

  addAnimationCallback(callback: (delta: number, elapsed: number) => void): void {
    this.animationCallbacks.push(callback);
  }

  removeAnimationCallback(callback: (delta: number, elapsed: number) => void): void {
    const index = this.animationCallbacks.indexOf(callback);
    if (index > -1) {
      this.animationCallbacks.splice(index, 1);
    }
  }

  addToScene(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  removeFromScene(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setCameraPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
  }

  setCameraTarget(x: number, y: number, z: number): void {
    this.controls.target.set(x, y, z);
    this.controls.update();
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.animationCallbacks = [];
    this.controls.dispose();
    this.renderer.dispose();
  }
}
