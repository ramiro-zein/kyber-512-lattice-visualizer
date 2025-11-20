import { Component, ElementRef, ViewChild, afterNextRender, Injector } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';

// --- CONSTANTES KYBER-512 ---
const N = 256;
const Q = 3329;
const K = 2;
const ETA = 2;

const randInt = (max: number) => Math.floor(Math.random() * max);

const cbd = () => {
  let a = 0,
    b = 0;
  for (let i = 0; i < ETA; i++) {
    a += randInt(2);
    b += randInt(2);
  }
  return a - b;
};

const mod = (n: number, m: number) => ((n % m) + m) % m;

class Poly {
  coeffs: number[];

  constructor(coeffs: number[] = []) {
    this.coeffs = new Array(N).fill(0).map((_, i) => coeffs[i] || 0);
  }

  toString() {
    return `[${this.coeffs.slice(0, 3).join(',')},..,${this.coeffs[N - 1]}]`;
  }

  add(o: Poly) {
    return new Poly(this.coeffs.map((c, i) => mod(c + o.coeffs[i], Q)));
  }

  sub(o: Poly) {
    return new Poly(this.coeffs.map((c, i) => mod(c - o.coeffs[i], Q)));
  }

  mul(o: Poly) {
    let res = new Array(2 * N).fill(0);
    for (let i = 0; i < N; i++) {
      if (this.coeffs[i] === 0) continue;
      for (let j = 0; j < N; j++) {
        res[i + j] += this.coeffs[i] * o.coeffs[j];
      }
    }
    for (let i = 2 * N - 2; i >= N; i--) {
      res[i - N] -= res[i];
    }
    return new Poly(res.slice(0, N).map((c) => mod(c, Q)));
  }

  static random() {
    return new Poly(Array(N).fill(0).map(() => randInt(Q)));
  }

  static noise() {
    return new Poly(Array(N).fill(0).map(() => mod(cbd(), Q)));
  }
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;

  // Estado
  state: any = {
    A: [],
    s: [],
    e: [],
    t: [],
    r: [],
    e1: [],
    e2: null,
    u: [],
    v: null,
    msgBit: 0,
  };

  // Three.js
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  controls!: OrbitControls;

  // Grupos
  groupA = new THREE.Group();
  groupS = new THREE.Group();
  groupT = new THREE.Group();
  groupU = new THREE.Group();
  groupV: THREE.Group | null = null;
  lastMsgGroup: THREE.Group | null = null;
  lastResGroup: THREE.Group | null = null;

  operationId = 0;

  // Configuración Visual
  ZONE_ALICE_X = -12;
  ZONE_BOB_X = 12;
  ROW_0_Z = -3;
  ROW_1_Z = 1;
  BASE_Y = 1.2;

  COLOR_MATRIX = 0x06b6d4;
  COLOR_SECRET = 0xd946ef;
  COLOR_PUBLIC = 0x8b5cf6;
  COLOR_BOB_OP = 0x10b981;
  COLOR_MSG = 0xfacc15;

  constructor(private injector: Injector) {
    afterNextRender(() => {
      this.initThree();
      this.animate();
    }, { injector: this.injector });
  }

  initThree() {
    console.log('Inicializando Three.js...');
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020617);
    this.scene.fog = new THREE.FogExp2(0x020617, 0.015);

    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    if (this.canvasContainer) {
      this.canvasContainer.nativeElement.appendChild(this.renderer.domElement);
    }

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1;

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x22d3ee, 1.0);
    dirLight.position.set(15, 30, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xd946ef, 0.4);
    fillLight.position.set(-15, 10, -15);
    this.scene.add(fillLight);

    // Grilla
    const gridHelper = new THREE.GridHelper(100, 50, 0x1e293b, 0x0f172a);
    this.scene.add(gridHelper);

    const planeGeometry = new THREE.PlaneGeometry(300, 300);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.4 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.01;
    plane.receiveShadow = true;
    this.scene.add(plane);

    this.updateCamera();
    window.addEventListener('resize', () => this.updateCamera());

    // Añadir grupos a la escena
    this.scene.add(this.groupA);
    this.scene.add(this.groupS);
    this.scene.add(this.groupT);
    this.scene.add(this.groupU);
  }

  updateCamera() {
    if (!this.camera || !this.renderer) return;
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Posicionamiento responsive mejorado
    const baseZ = 55;
    if (aspect < 1.0) {
      this.camera.position.set(0, 40 + (1/aspect)*15, baseZ / (aspect * 0.7));
    } else {
      this.camera.position.set(0, 30, baseZ);
    }
  }

  createLabel(text: string, pos: THREE.Vector3, subtext = '') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Object3D();

    canvas.width = 512;
    canvas.height = 128;
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 512, 128);

    ctx.font = 'bold 42px Inter, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.fillText(text, 256, 48);

    if (subtext) {
      ctx.font = '24px JetBrains Mono, monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.shadowBlur = 0;
      ctx.fillText(subtext, 256, 96);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.position.copy(pos);
    sprite.position.y += 1.3;
    sprite.scale.set(6, 1.5, 1);
    return sprite;
  }

  createPolyBlock(poly: Poly, colorHex: number, x: number, z: number, labelText = '') {
    const group = new THREE.Group();
    const size = 1.8;
    const segments = 3;
    const step = size / segments;
    const offset = size / 2;

    group.position.set(x, this.BASE_Y + offset - 0.5, z);

    // NODOS (InstancedMesh)
    const sphereGeo = new THREE.SphereGeometry(0.05, 6, 6);
    const sphereMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const numPoints = (segments + 1) ** 3;
    const instancedSpheres = new THREE.InstancedMesh(sphereGeo, sphereMat, numPoints);

    let idx = 0;
    const dummy = new THREE.Object3D();
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        for (let k = 0; k <= segments; k++) {
          dummy.position.set(i * step - offset, j * step - offset, k * step - offset);
          dummy.updateMatrix();
          instancedSpheres.setMatrixAt(idx++, dummy.matrix);
        }
      }
    }
    instancedSpheres.instanceMatrix.needsUpdate = true;
    group.add(instancedSpheres);

    // WIREFRAME
    const boxGeo = new THREE.BoxGeometry(size, size, size, segments, segments, segments);
    const wireframe = new THREE.WireframeGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.15 });
    const lines = new THREE.LineSegments(wireframe, lineMat);
    group.add(lines);

    // NÚCLEO CON PULSACIÓN
    const coreGeo = new THREE.BoxGeometry(size * 0.4, size * 0.4, size * 0.4);
    const coreMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.3 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.userData = { pulse: true };
    group.add(core);

    // ETIQUETA
    const sprite = this.createLabel(labelText, new THREE.Vector3(0, offset + 1.0, 0), poly.toString());
    group.add(sprite);

    // ANIMACIÓN DE APARICIÓN ELÁSTICA
    group.scale.set(0, 0, 0);
    new TWEEN.Tween(group.scale)
      .to({ x: 1, y: 1, z: 1 }, 1000)
      .easing(TWEEN.Easing.Elastic.Out)
      .start();

    console.log(`Created poly block at (${x}, ${this.BASE_Y + offset - 0.5}, ${z}) with label: ${labelText}`);

    return group;
  }

  log(msg: string, type = 'info') {
    const logDiv = document.getElementById('status-log');
    if (!logDiv) return;
    const p = document.createElement('div');
    let clr = 'text-slate-400';
    let borderClr = 'border-slate-800';

    if (type === 'success') { clr = 'text-emerald-400'; borderClr = 'border-emerald-600'; }
    if (type === 'error') { clr = 'text-red-400'; borderClr = 'border-red-600'; }
    if (type === 'action') { clr = 'text-cyan-300'; borderClr = 'border-cyan-600'; }

    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    p.innerHTML = `<span class="text-slate-600 text-[10px] mr-2 font-sans hidden sm:inline">${time}</span> ${msg}`;
    p.className = `pl-2 border-l-2 ${borderClr} ${clr} py-1 transition-all hover:bg-slate-800/50 mb-1`;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;
  }

  cleanupRound() {
    // Detener todos los tweens activos para evitar conflictos
    TWEEN.removeAll();

    // Resetear posiciones
    this.groupU.position.set(0, 0, 0);
    this.groupS.position.set(0, 0, 0);

    // Limpiar grupos temporales
    this.groupU.clear();

    if (this.groupV) {
      this.scene.remove(this.groupV);
      this.groupV = null;
    }
    if (this.lastMsgGroup) {
      this.scene.remove(this.lastMsgGroup);
      this.lastMsgGroup = null;
    }
    if (this.lastResGroup) {
      this.scene.remove(this.lastResGroup);
      this.lastResGroup = null;
    }
  }

  runKeyGen() {
    this.operationId++;
    const currentOp = this.operationId;

    this.cleanupRound();
    this.groupA.clear();
    this.groupS.clear();
    this.groupT.clear();

    const btnKeyGen = document.getElementById('btn-keygen') as HTMLButtonElement;
    if (btnKeyGen) btnKeyGen.disabled = true;
    document.getElementById('step-1')?.classList.add('opacity-50');

    this.log(`Iniciando KeyGen Kyber-512 (N=${N}, Q=${Q})`, 'action');

    this.state.A = Array(K).fill(0).map(() => Array(K).fill(0).map(Poly.random));
    this.state.s = Array(K).fill(0).map(Poly.noise);
    this.state.e = Array(K).fill(0).map(Poly.noise);

    let As = this.state.A.map((row: Poly[]) => {
      let sum = new Poly();
      row.forEach((p, i) => (sum = sum.add(p.mul(this.state.s[i]))));
      return sum;
    });
    this.state.t = As.map((p: Poly, i: number) => p.add(this.state.e[i]));

    // Generar matriz A
    for (let i = 0; i < K; i++) {
      for (let j = 0; j < K; j++) {
        let z = i === 0 ? this.ROW_0_Z : this.ROW_1_Z;
        let x = this.ZONE_ALICE_X + j * 3.0;
        let group = this.createPolyBlock(this.state.A[i][j], this.COLOR_MATRIX, x, z, `A[${i},${j}]`);
        this.groupA.add(group);
      }
    }

    setTimeout(() => {
      if (this.operationId !== currentOp) return;
      this.log('Generando secreto s (ruido CBD eta=2)');
      let s_x = this.ZONE_ALICE_X + 7;
      for (let i = 0; i < K; i++) {
        let z = i === 0 ? this.ROW_0_Z : this.ROW_1_Z;
        let group = this.createPolyBlock(this.state.s[i], this.COLOR_SECRET, s_x, z, `s[${i}]`);
        this.groupS.add(group);
      }
    }, 1200);

    setTimeout(() => {
      if (this.operationId !== currentOp) return;
      this.log('Calculando llave pública t = As + e...', 'action');
      let t_x = this.ZONE_ALICE_X + 12;
      for (let i = 0; i < K; i++) {
        let z = i === 0 ? this.ROW_0_Z : this.ROW_1_Z;
        let group = this.createPolyBlock(this.state.t[i], this.COLOR_PUBLIC, t_x, z, `t[${i}]`);
        this.groupT.add(group);
      }
    }, 3000);

    setTimeout(() => {
      if (this.operationId !== currentOp) return;
      this.log('Setup completo. Llaves listas.', 'success');
      document.getElementById('step-2')?.classList.remove('opacity-40', 'pointer-events-none');
    }, 4500);
  }

  startEncrypt(bit: number) {
    if (this.state.t.length === 0) {
      this.log('Error: Primero genera las llaves.', 'error');
      return;
    }
    this.operationId++;
    const currentOp = this.operationId;
    this.cleanupRound();

    this.log(`Encriptando bit m = ${bit}`, 'action');
    this.state.msgBit = bit;

    this.state.r = Array(K).fill(0).map(Poly.noise);
    this.state.e1 = Array(K).fill(0).map(Poly.noise);
    this.state.e2 = Poly.noise();

    const encodedVal = bit === 1 ? Math.floor(Q / 2) : 0;
    const msgPoly = new Poly([encodedVal, ...new Array(N - 1).fill(0)]);

    let u_vec = Array(K).fill(0).map(() => new Poly());
    for (let i = 0; i < K; i++) {
      for (let j = 0; j < K; j++) {
        u_vec[j] = u_vec[j].add(this.state.A[i][j].mul(this.state.r[i]));
      }
    }
    this.state.u = u_vec.map((p: Poly, i: number) => p.add(this.state.e1[i]));

    let t_dot_r = new Poly();
    this.state.t.forEach((p: Poly, i: number) => (t_dot_r = t_dot_r.add(p.mul(this.state.r[i]))));
    this.state.v = t_dot_r.add(this.state.e2).add(msgPoly);

    this.lastMsgGroup = this.createPolyBlock(msgPoly, this.COLOR_MSG, this.ZONE_BOB_X, 3, `m:${bit}`);
    this.scene.add(this.lastMsgGroup);

    setTimeout(() => {
      if (this.operationId !== currentOp) return;
      this.log('Calculando u = A^T r + e1');
      this.groupU.clear();
      let u_x = this.ZONE_BOB_X - 4;
      for (let i = 0; i < K; i++) {
        let z = i === 0 ? this.ROW_0_Z : this.ROW_1_Z;
        let group = this.createPolyBlock(this.state.u[i], this.COLOR_BOB_OP, u_x, z, `u[${i}]`);
        this.groupU.add(group);
      }
    }, 1200);

    setTimeout(() => {
      if (this.operationId !== currentOp) return;
      this.log('Calculando v = t^T r + e2 + m');
      if (this.lastMsgGroup) this.scene.remove(this.lastMsgGroup);
      this.groupV = this.createPolyBlock(this.state.v, this.COLOR_BOB_OP, this.ZONE_BOB_X + 2, 0, `v`);
      this.scene.add(this.groupV);
    }, 2500);

    setTimeout(() => {
      if (this.operationId !== currentOp) return;
      this.log('Transmitiendo Ciphertext (u, v)...', 'action');

      const targetX = this.ZONE_ALICE_X + 17;

      new TWEEN.Tween(this.groupU.position)
        .to({ x: targetX - this.groupU.position.x - 5 }, 2000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();

      if (this.groupV) {
        new TWEEN.Tween(this.groupV.position)
          .to({ x: targetX, z: 0 }, 2000)
          .easing(TWEEN.Easing.Cubic.InOut)
          .start();
      }
    }, 4000);

    setTimeout(() => {
      if (this.operationId !== currentOp) return;
      document.getElementById('step-3')?.classList.remove('opacity-40', 'pointer-events-none');
      this.log('Ciphertext recibido.', 'success');
    }, 6000);
  }

  runDecrypt() {
    if (!this.state.v) {
      this.log('Error: No hay mensaje cifrado.', 'error');
      return;
    }
    this.operationId++;
    const currentOp = this.operationId;

    // Limpiar solo resultado anterior, mantener ciphertext
    if (this.lastResGroup) {
      this.scene.remove(this.lastResGroup);
      this.lastResGroup = null;
    }

    this.log('Desencriptando...', 'action');

    let s_dot_u = new Poly();
    this.state.s.forEach((p: Poly, i: number) => (s_dot_u = s_dot_u.add(p.mul(this.state.u[i]))));
    const noisyM = this.state.v.sub(s_dot_u);

    const coeff = noisyM.coeffs[0];
    const lowerBound = Math.floor(Q / 4);
    const upperBound = Math.floor((3 * Q) / 4);
    const decryptedBit = coeff > lowerBound && coeff < upperBound ? 1 : 0;

    // Mover S para simular operación
    new TWEEN.Tween(this.groupS.position).to({ x: 7 }, 1000).start();

    setTimeout(() => {
      if (this.operationId !== currentOp) return;
      this.log(`Coeficiente principal: ${coeff}`);
      this.lastResGroup = this.createPolyBlock(
        noisyM,
        decryptedBit === 1 ? this.COLOR_MSG : 0x94a3b8,
        this.ZONE_ALICE_X + 7,
        3,
        `m':${decryptedBit}`
      );
      this.scene.add(this.lastResGroup);

      this.lastResGroup.scale.set(0.5, 0.5, 0.5);
      new TWEEN.Tween(this.lastResGroup.scale)
        .to({ x: 1.2, y: 1.2, z: 1.2 }, 1000)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();

      const success = decryptedBit === this.state.msgBit;
      if (success) this.log(`¡Éxito! Bit ${decryptedBit} recuperado.`, 'success');
      else this.log(`Error. Coeficiente ${coeff} ambiguo.`, 'error');
    }, 1800);
  }

  animate(time?: number) {
    if (!this.renderer) return;

    requestAnimationFrame((t) => this.animate(t));

    TWEEN.update(time);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    const scale = 1 + Math.sin((time || Date.now()) * 0.002) * 0.1;
    this.scene.traverse((object) => {
      if (object.userData && object.userData['pulse']) {
        object.scale.set(scale, scale, scale);
      }
    });
  }
}
