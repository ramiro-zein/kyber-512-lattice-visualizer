import * as THREE from 'three';

// Paleta de colores según especificación
export const KYBER_COLORS = {
  // Matriz pública A - Plateado, público, neutral
  MATRIX_A: new THREE.Color(0xc0c0c0),

  // Secreto s - Rojo sangre, privado, crítico
  SECRET_S: new THREE.Color(0x8b0000),

  // Errores e, e1, e2 - Violeta, ruido cuántico
  ERROR_E: new THREE.Color(0x9400d3),

  // Vector efímero r - Azul eléctrico, temporal
  EPHEMERAL_R: new THREE.Color(0x00bfff),

  // Vector público t - Dorado, derivado valioso
  VECTOR_T: new THREE.Color(0xffd700),

  // Cifrado u, v - Esmeralda, protegido
  CIPHERTEXT: new THREE.Color(0x50c878),

  // Mensaje m - Blanco, información pura
  MESSAGE_M: new THREE.Color(0xffffff),

  // Rayos de operaciones
  OPERATION_RAY: new THREE.Color(0xffe4b5),

  // Verificación
  SUCCESS: new THREE.Color(0x00ff00),
  FAILURE: new THREE.Color(0xff0000),

  // Fondo
  BACKGROUND_DARK: new THREE.Color(0x000a14),
  BACKGROUND_LIGHT: new THREE.Color(0x001133),
};

// Materiales predefinidos
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

export function createEmissiveMaterial(
  color: THREE.Color,
  intensity = 0.5
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: intensity,
    metalness: 0.8,
    roughness: 0.2,
  });
}

export function createWireframeMaterial(color: THREE.Color): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.5,
  });
}
