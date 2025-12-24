import * as THREE from 'three';

/** Paleta de colores semánticos para elementos del algoritmo Kyber */
export const KYBER_COLORS = {
  MATRIX_A: new THREE.Color(0xc0c0c0),      // Matriz pública A - plateado
  SECRET_S: new THREE.Color(0x8b0000),       // Secreto s - rojo oscuro
  ERROR_E: new THREE.Color(0x9400d3),        // Errores e - violeta
  EPHEMERAL_R: new THREE.Color(0x00bfff),    // Vector efímero r - azul
  VECTOR_T: new THREE.Color(0xffd700),       // Vector público t - dorado
  CIPHERTEXT: new THREE.Color(0x50c878),     // Cifrado (u, v) - esmeralda
  MESSAGE_M: new THREE.Color(0xffffff),      // Mensaje m - blanco
  OPERATION_RAY: new THREE.Color(0xffe4b5),  // Rayos de operaciones
  SUCCESS: new THREE.Color(0x00ff00),        // Verificación exitosa
  FAILURE: new THREE.Color(0xff0000),        // Verificación fallida
  BACKGROUND_DARK: new THREE.Color(0x000a14),
  BACKGROUND_LIGHT: new THREE.Color(0x001133),
};

/** Material tipo vidrio con transmisión de luz */
export function createGlassMaterial(color: THREE.Color, opacity = 0.7): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: color,
    transparent: true,
    opacity: opacity,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.6,
    thickness: 0.5,
    envMapIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  });
}

/** Material emisivo para elementos que brillan */
export function createEmissiveMaterial(color: THREE.Color, intensity = 0.5): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: intensity,
    metalness: 0.8,
    roughness: 0.2,
  });
}

/** Material para líneas wireframe */
export function createWireframeMaterial(color: THREE.Color): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.5,
  });
}
