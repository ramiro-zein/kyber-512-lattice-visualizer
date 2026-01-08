import {Injectable, ElementRef} from '@angular/core';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Advanced scene configuration for professional 3D visualization
 * Provides comprehensive control over rendering quality and visual appearance
 */
export interface SceneConfiguration {
  /** Background color (hex) */
  backgroundColor?: number;
  /** Fog density for depth perception (0-1) */
  fogDensity?: number;
  /** Enable shadow mapping */
  enableShadows?: boolean;
  /** Anti-aliasing quality */
  antialias?: boolean;
  /** Tone mapping exposure (brightness) */
  toneMappingExposure?: number;
}

/**
 * Camera configuration parameters
 * Controls perspective and viewing frustum
 */
export interface CameraConfiguration {
  /** Field of view in degrees */
  fov?: number;
  /** Near clipping plane */
  near?: number;
  /** Far clipping plane */
  far?: number;
  /** Initial camera position */
  position?: THREE.Vector3;
  /** Camera look-at target */
  target?: THREE.Vector3;
}

/**
 * Lighting configuration for the scene
 * Supports multiple light types and intensities
 */
export interface LightingConfiguration {
  /** Ambient light intensity (0-1) */
  ambientIntensity?: number;
  /** Ambient light color (hex) */
  ambientColor?: number;
  /** Enable directional lights */
  enableDirectional?: boolean;
  /** Main directional light intensity */
  directionalIntensity?: number;
  /** Main directional light color */
  directionalColor?: number;
}

/**
 * Control configuration for camera interaction
 * Defines user interaction with the 3D scene
 */
export interface ControlConfiguration {
  /** Enable smooth damping */
  enableDamping?: boolean;
  /** Damping factor for smooth motion (0-1) */
  dampingFactor?: number;
  /** Minimum zoom distance */
  minDistance?: number;
  /** Maximum zoom distance */
  maxDistance?: number;
  /** Maximum polar angle (vertical rotation limit in radians) */
  maxPolarAngle?: number;
  /** Enable auto-rotation */
  autoRotate?: boolean;
  /** Auto-rotation speed */
  autoRotateSpeed?: number;
}

/**
 * Grid helper configuration
 */
export interface GridConfiguration {
  /** Grid size */
  size?: number;
  /** Number of divisions */
  divisions?: number;
  /** Primary grid color */
  colorCenterLine?: number;
  /** Secondary grid color */
  colorGrid?: number;
  /** Enable ground plane for shadows */
  enableGroundPlane?: boolean;
}

/**
 * Default visual configuration constants
 * Industry-standard values for professional 3D visualization
 */
const DEFAULT_CONFIG = {
  // Scene
  BACKGROUND_COLOR: 0x020617,
  FOG_DENSITY: 0.015,

  // Camera
  CAMERA_FOV: 40,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 1000,
  CAMERA_POSITION: new THREE.Vector3(0, 30, 55),
  CAMERA_TARGET: new THREE.Vector3(0, 0, 0),

  // Lighting
  AMBIENT_INTENSITY: 0.4,
  AMBIENT_COLOR: 0xffffff,
  MAIN_LIGHT_COLOR: 0x22d3ee,
  MAIN_LIGHT_INTENSITY: 1.0,
  FILL_LIGHT_COLOR: 0xd946ef,
  FILL_LIGHT_INTENSITY: 0.4,
  RIM_LIGHT_COLOR: 0x6366f1,
  RIM_LIGHT_INTENSITY: 0.3,

  // Grid
  GRID_SIZE: 100,
  GRID_DIVISIONS: 50,
  GRID_COLOR_CENTER: 0x1e293b,
  GRID_COLOR_GRID: 0x0f172a,

  // Controls
  DAMPING_FACTOR: 0.05,
  MIN_DISTANCE: 20,
  MAX_DISTANCE: 100,
  MAX_POLAR_ANGLE: Math.PI / 2 - 0.1,
  AUTO_ROTATE_SPEED: 0.5,

  // Rendering
  PIXEL_RATIO_LIMIT: 2,
  TONE_MAPPING_EXPOSURE: 1.2,
  SHADOW_MAP_SIZE: 2048,
} as const;

/**
 * Professional Three.js Scene Management Service
 *
 * This service provides a comprehensive foundation for 3D visualization with:
 * - Advanced rendering pipeline with tone mapping and shadows
 * - Flexible camera system with smooth controls
 * - Sophisticated lighting setup (ambient, directional, fill, rim)
 * - Performance-optimized rendering loop
 * - Responsive viewport handling
 * - Proper resource cleanup and memory management
 *
 * @example
 * ```typescript
 * constructor(private viz: ThreeVisualizationService) {}
 *
 * ngAfterViewInit() {
 *   this.viz.initialize(this.container, {
 *     backgroundColor: 0x1a1a2e,
 *     enableShadows: true
 *   });
 * }
 *
 * ngOnDestroy() {
 *   this.viz.dispose();
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ThreeVisualizationService {
  // ========================================================================
  // CORE THREE.JS OBJECTS
  // ========================================================================

  /** Main 3D scene container */
  private scene!: THREE.Scene;

  /** Perspective camera for 3D viewing */
  private camera!: THREE.PerspectiveCamera;

  /** WebGL renderer */
  private renderer!: THREE.WebGLRenderer;

  /** Orbit controls for user interaction */
  private controls!: OrbitControls;

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  /** Animation frame request ID */
  private animationFrameId: number | null = null;

  /** Initialization state flag */
  private isInitialized = false;

  /** Configuration state */
  private config: Required<SceneConfiguration> = {
    backgroundColor: DEFAULT_CONFIG.BACKGROUND_COLOR,
    fogDensity: DEFAULT_CONFIG.FOG_DENSITY,
    enableShadows: true,
    antialias: true,
    toneMappingExposure: DEFAULT_CONFIG.TONE_MAPPING_EXPOSURE,
  };

  constructor() {
  }

  // ========================================================================
  // PUBLIC API - LIFECYCLE MANAGEMENT
  // ========================================================================

  /**
   * Initialize the Three.js scene with optional configuration
   *
   * @param container - DOM element to attach the renderer
   * @param sceneConfig - Optional scene configuration
   * @param cameraConfig - Optional camera configuration
   * @param lightingConfig - Optional lighting configuration
   * @param controlConfig - Optional control configuration
   * @param gridConfig - Optional grid configuration
   */
  public initialize(
    container: ElementRef<HTMLDivElement>,
    sceneConfig?: SceneConfiguration,
    cameraConfig?: CameraConfiguration,
    lightingConfig?: LightingConfiguration,
    controlConfig?: ControlConfiguration,
    gridConfig?: GridConfiguration
  ): void {
    if (this.isInitialized) {
      console.warn('[ThreeVisualizationService] Already initialized. Call dispose() first to reinitialize.');
      return;
    }

    // Merge configurations
    this.config = {...this.config, ...sceneConfig};

    // Initialize core components
    this.initScene();
    this.initCamera(cameraConfig);
    this.initRenderer(container);
    this.initControls(controlConfig);
    this.initLighting(lightingConfig);
    this.initGrid(gridConfig);

    this.isInitialized = true;
    this.startAnimation();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    console.log('[ThreeVisualizationService] Initialized successfully');
  }

  /**
   * Dispose and cleanup all Three.js resources
   * Critical for preventing memory leaks
   */
  public dispose(): void {
    if (!this.isInitialized) return;

    console.log('[ThreeVisualizationService] Disposing resources...');

    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Dispose controls
    this.controls?.dispose();

    // Dispose renderer
    this.renderer?.dispose();

    // Traverse scene and dispose geometries and materials
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

    // Remove event listeners
    window.removeEventListener('resize', () => this.onWindowResize());

    this.isInitialized = false;
    console.log('[ThreeVisualizationService] Disposed successfully');
  }

  // ========================================================================
  // PUBLIC API - SCENE ACCESS
  // ========================================================================

  /**
   * Get the Three.js scene for adding custom objects
   * @returns The main scene object
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get the camera for custom positioning or animation
   * @returns The perspective camera
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get the renderer for custom rendering operations
   * @returns The WebGL renderer
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Get the orbit controls for custom interaction
   * @returns The orbit controls
   */
  public getControls(): OrbitControls {
    return this.controls;
  }

  /**
   * Check if the service is initialized
   * @returns Initialization state
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  // ========================================================================
  // PUBLIC API - SCENE MANIPULATION
  // ========================================================================

  /**
   * Add an object to the scene
   * @param object - Three.js object to add
   */
  public addObject(object: THREE.Object3D): void {
    if (!this.isInitialized) {
      console.warn('[ThreeVisualizationService] Cannot add object: not initialized');
      return;
    }
    this.scene.add(object);
  }

  /**
   * Remove an object from the scene
   * @param object - Three.js object to remove
   */
  public removeObject(object: THREE.Object3D): void {
    if (!this.isInitialized) return;
    this.scene.remove(object);
  }

  /**
   * Clear all objects from the scene (except lights and grid)
   */
  public clearScene(): void {
    if (!this.isInitialized) return;

    const objectsToRemove: THREE.Object3D[] = [];
    this.scene.traverse((object) => {
      if (
        object !== this.scene &&
        !(object instanceof THREE.Light) &&
        !(object instanceof THREE.GridHelper) &&
        !(object.userData['isPermanent'])
      ) {
        objectsToRemove.push(object);
      }
    });

    objectsToRemove.forEach((obj) => this.scene.remove(obj));
  }

  /**
   * Update camera position
   * @param position - New camera position
   */
  public setCameraPosition(position: THREE.Vector3): void {
    if (!this.isInitialized) return;
    this.camera.position.copy(position);
  }

  /**
   * Update camera target (look-at point)
   * @param target - New target position
   */
  public setCameraTarget(target: THREE.Vector3): void {
    if (!this.isInitialized) return;
    this.controls.target.copy(target);
    this.controls.update();
  }

  // ========================================================================
  // PRIVATE - INITIALIZATION METHODS
  // ========================================================================

  /**
   * Initialize the main scene
   */
  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.backgroundColor);
    this.scene.fog = new THREE.FogExp2(
      this.config.backgroundColor,
      this.config.fogDensity
    );
  }

  /**
   * Initialize the perspective camera
   */
  private initCamera(config?: CameraConfiguration): void {
    const fov = config?.fov ?? DEFAULT_CONFIG.CAMERA_FOV;
    const near = config?.near ?? DEFAULT_CONFIG.CAMERA_NEAR;
    const far = config?.far ?? DEFAULT_CONFIG.CAMERA_FAR;
    const aspect = window.innerWidth / window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    const position = config?.position ?? DEFAULT_CONFIG.CAMERA_POSITION;
    this.camera.position.copy(position);

    if (config?.target) {
      this.camera.lookAt(config.target);
    }

    this.updateCameraPosition();
  }

  /**
   * Initialize the WebGL renderer
   */
  private initRenderer(container: ElementRef<HTMLDivElement>): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.config.antialias,
      alpha: true,
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, DEFAULT_CONFIG.PIXEL_RATIO_LIMIT)
    );

    if (this.config.enableShadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.config.toneMappingExposure;

    container.nativeElement.appendChild(this.renderer.domElement);
  }

  /**
   * Initialize orbit controls
   */
  private initControls(config?: ControlConfiguration): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.controls.enableDamping = config?.enableDamping ?? true;
    this.controls.dampingFactor = config?.dampingFactor ?? DEFAULT_CONFIG.DAMPING_FACTOR;
    this.controls.maxPolarAngle = config?.maxPolarAngle ?? DEFAULT_CONFIG.MAX_POLAR_ANGLE;
    this.controls.minDistance = config?.minDistance ?? DEFAULT_CONFIG.MIN_DISTANCE;
    this.controls.maxDistance = config?.maxDistance ?? DEFAULT_CONFIG.MAX_DISTANCE;
    this.controls.autoRotate = config?.autoRotate ?? false;
    this.controls.autoRotateSpeed = config?.autoRotateSpeed ?? DEFAULT_CONFIG.AUTO_ROTATE_SPEED;
  }

  /**
   * Initialize professional lighting setup
   * Creates a three-point lighting system with ambient fill
   */
  private initLighting(config?: LightingConfiguration): void {
    // Ambient light for base illumination
    const ambientIntensity = config?.ambientIntensity ?? DEFAULT_CONFIG.AMBIENT_INTENSITY;
    const ambientColor = config?.ambientColor ?? DEFAULT_CONFIG.AMBIENT_COLOR;
    const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
    ambientLight.userData['isPermanent'] = true;
    this.scene.add(ambientLight);

    if (config?.enableDirectional !== false) {
      // Main directional light (key light)
      const mainIntensity = config?.directionalIntensity ?? DEFAULT_CONFIG.MAIN_LIGHT_INTENSITY;
      const mainColor = config?.directionalColor ?? DEFAULT_CONFIG.MAIN_LIGHT_COLOR;
      const dirLight = new THREE.DirectionalLight(mainColor, mainIntensity);
      dirLight.position.set(15, 30, 15);
      dirLight.castShadow = this.config.enableShadows;

      if (this.config.enableShadows) {
        dirLight.shadow.mapSize.width = DEFAULT_CONFIG.SHADOW_MAP_SIZE;
        dirLight.shadow.mapSize.height = DEFAULT_CONFIG.SHADOW_MAP_SIZE;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
      }

      dirLight.userData['isPermanent'] = true;
      this.scene.add(dirLight);

      // Fill light (softer, from opposite side)
      const fillLight = new THREE.DirectionalLight(
        DEFAULT_CONFIG.FILL_LIGHT_COLOR,
        DEFAULT_CONFIG.FILL_LIGHT_INTENSITY
      );
      fillLight.position.set(-15, 10, -15);
      fillLight.userData['isPermanent'] = true;
      this.scene.add(fillLight);

      // Rim light (edge definition and depth)
      const rimLight = new THREE.DirectionalLight(
        DEFAULT_CONFIG.RIM_LIGHT_COLOR,
        DEFAULT_CONFIG.RIM_LIGHT_INTENSITY
      );
      rimLight.position.set(0, 5, -20);
      rimLight.userData['isPermanent'] = true;
      this.scene.add(rimLight);
    }
  }

  /**
   * Initialize grid helper and ground plane
   */
  private initGrid(config?: GridConfiguration): void {
    const size = config?.size ?? DEFAULT_CONFIG.GRID_SIZE;
    const divisions = config?.divisions ?? DEFAULT_CONFIG.GRID_DIVISIONS;
    const colorCenter = config?.colorCenterLine ?? DEFAULT_CONFIG.GRID_COLOR_CENTER;
    const colorGrid = config?.colorGrid ?? DEFAULT_CONFIG.GRID_COLOR_GRID;

    // Grid helper - Disabled for minimalist design
    // const gridHelper = new THREE.GridHelper(size, divisions, colorCenter, colorGrid);
    // gridHelper.userData['isPermanent'] = true;
    // this.scene.add(gridHelper);

    // Ground plane for shadows
    if (config?.enableGroundPlane !== false && this.config.enableShadows) {
      const planeGeometry = new THREE.PlaneGeometry(300, 300);
      const planeMaterial = new THREE.ShadowMaterial({opacity: 0.4});
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -0.01;
      plane.receiveShadow = true;
      plane.userData['isPermanent'] = true;
      this.scene.add(plane);
    }
  }

  // ========================================================================
  // PRIVATE - ANIMATION & RENDERING
  // ========================================================================

  /**
   * Start the animation loop
   */
  private startAnimation(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      // Update controls
      this.controls.update();

      // Render scene
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * Update camera position based on aspect ratio
   * Ensures proper framing on different screen sizes
   */
  private updateCameraPosition(): void {
    const aspect = window.innerWidth / window.innerHeight;
    const baseZ = DEFAULT_CONFIG.CAMERA_POSITION.z;
    const baseY = DEFAULT_CONFIG.CAMERA_POSITION.y;

    if (aspect < 1.0) {
      // Portrait mode: move camera further back and up
      this.camera.position.set(
        0,
        baseY + (1 / aspect) * 15,
        baseZ / (aspect * 0.7)
      );
    } else {
      // Landscape mode: use standard position
      this.camera.position.set(0, baseY, baseZ);
    }
  }

  /**
   * Handle window resize events
   */
  private onWindowResize(): void {
    if (!this.isInitialized) return;

    const aspect = window.innerWidth / window.innerHeight;

    // Update camera
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Update camera position for aspect ratio
    this.updateCameraPosition();
  }
}
