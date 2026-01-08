# Kyber-512 3D Visualization - Documentación Técnica Completa

> **Proyecto de Nivel Doctorado**
> Visualización interactiva 3D del algoritmo de cifrado post-cuántico Kyber-512

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Fundamentos Matemáticos](#fundamentos-matemáticos)
3. [Arquitectura del Software](#arquitectura-del-software)
4. [Implementación Criptográfica](#implementación-criptográfica)
5. [Visualización 3D](#visualización-3d)
6. [Componentes Educativos](#componentes-educativos)
7. [Guía de Desarrollo](#guía-de-desarrollo)
8. [Referencias Académicas](#referencias-académicas)

---

## Resumen Ejecutivo

### Descripción del Proyecto

Este proyecto implementa una visualización interactiva 3D completa del algoritmo de encapsulación de claves post-cuántico **CRYSTALS-Kyber** (específicamente Kyber-512, NIST Level 1), seleccionado por el NIST como estándar para criptografía resistente a computadoras cuánticas.

### Objetivos

- Implementación matemática rigurosa de Kyber-512
- Visualización 3D de estructuras lattice en tiempo real
- Panel de análisis matemático con estadísticas en vivo
- Modo educativo con explicaciones de nivel doctorado
- Arquitectura modular siguiendo principios SOLID
- Código documentado con estándares académicos

### Tecnologías Core

- **Framework**: Angular 20.3 (SSR habilitado)
- **Visualización 3D**: Three.js + OrbitControls
- **Animaciones**: Tween.js
- **Estilos**: Tailwind CSS 4
- **TypeScript**: 5.9 (tipado estricto)

---

## Fundamentos Matemáticos

### 1. Anillo Polinómico Base

Kyber-512 opera en el anillo ciclotómico:

```
R = ℤq[X]/(X^N + 1)
```

Donde:
- **N = 256**: Grado del polinomio
- **Q = 3329**: Módulo primo (Q ≡ 1 mod 2N)
- **X^N + 1**: Polinomio ciclotómico 2N-ésimo

#### Propiedades Algebraicas

1. **Multiplicación modular**: El producto de dos polinomios se reduce módulo X^N + 1
2. **Sustitución**: X^N = -1 en el anillo
3. **Estructura de lattice**: Cada polinomio representa un punto en ℤ^N

### 2. Module-LWE (Seguridad Base)

La seguridad de Kyber se fundamenta en el problema **Module Learning With Errors**:

```
Dado: A ∈ Rq^(K×K), t = As + e ∈ Rq^K
Encontrar: s ∈ Rq^K
```

Donde:
- **A**: Matriz pública uniforme
- **s**: Vector secreto con coeficientes pequeños
- **e**: Vector de error con distribución CBD

**Complejidad**: Este problema es intratatable incluso para computadoras cuánticas bajo la hipótesis de la dureza del Shortest Vector Problem (SVP) en lattices ideales.

### 3. Centered Binomial Distribution (CBD)

Para generar ruido criptográfico con propiedades estadísticas controladas:

```python
CBD(η):
  a = Σ(i=0 to η-1) random_bit()
  b = Σ(i=0 to η-1) random_bit()
  return a - b
```

Para Kyber-512, η = 2, produciendo valores en **{-2, -1, 0, 1, 2}** con distribución:

```
P(CBD(2) = k) = (2 choose (2+k)/2) / 16   para k ∈ {-2,...,2}
```

### 4. Operaciones Criptográficas

#### Key Generation

```
1. Generar A ∈ Rq^(2×2) (uniforme)
2. s, e ← CBD(η=2)  (vectores en Rq^2)
3. t = As + e
4. pk = (A, t), sk = s
```

#### Encryption

```
Entrada: pk = (A, t), mensaje m ∈ {0,1}
1. r, e₁, e₂ ← CBD(η=2)
2. u = A^T·r + e₁
3. v = t^T·r + e₂ + encode(m)
   donde encode(0) = 0, encode(1) = ⌊q/2⌋
Salida: ciphertext = (u, v)
```

#### Decryption

```
Entrada: sk = s, ciphertext = (u, v)
1. m' = v - s^T·u
2. decode(m'):
   si m'[0] ∈ [⌊q/4⌋, ⌊3q/4⌋]: return 1
   sino: return 0
```

### 5. Análisis de Ruido

El ruido acumulado durante decrypt es:

```
e_total = e₂ + s^T·e₁ - e^T·r
```

**Bound de Norma Infinito**: ||e_total||∞ < ⌊q/4⌋ con probabilidad ≥ 1 - 2^(-128)

**Probabilidad de Error**: < 2^(-139) para Kyber-512

---

## Arquitectura del Software

### Estructura de Directorios

```
src/app/
├── core/
│   ├── models/
│   │   └── kyber.types.ts          # Tipos matemáticos y Poly class
│   └── services/
│       ├── kyber-crypto.service.ts  # Lógica criptográfica
│       └── three-visualization.service.ts # Motor 3D
├── components/
│   └── kyber-visualization/
│       ├── math-analysis-panel.component.ts
│       └── educational-panel.component.ts
├── app.ts                           # Componente principal
├── app.html                         # Template UI
└── app.scss                         # Estilos globales
```

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────┐
│            App Component (Orchestrator)              │
│  • Gestiona estado UI                               │
│  • Coordina crypto + visualización                  │
└────────────┬────────────────────────┬───────────────┘
             │                        │
    ┌────────▼────────┐      ┌────────▼────────────┐
    │ KyberCryptoSvc  │      │ ThreeVisualizationSvc│
    │                 │      │                      │
    │ • generateKeys()│      │ • visualizeMatrix() │
    │ • encrypt()     │      │ • animateTransmit() │
    │ • decrypt()     │      │ • createLattice()   │
    └─────────────────┘      └─────────────────────┘
             │
    ┌────────▼────────┐
    │  Kyber Models   │
    │                 │
    │ • Poly class    │
    │ • CBD, mod      │
    │ • Statistics    │
    └─────────────────┘
```

### Principios de Diseño

#### 1. Separation of Concerns
- **Crypto Service**: Solo lógica matemática/criptográfica
- **Visualization Service**: Solo rendering 3D
- **Components**: Solo UI y presentación

#### 2. Immutability
- Todas las operaciones en `Poly` retornan nuevas instancias
- Estado criptográfico es read-only para componentes

#### 3. Type Safety
- Sin uso de `any` (excepto migraciones iniciales)
- Interfaces explícitas para todos los contratos

#### 4. Reactive Programming
- Uso de RxJS Observables para flujo de datos
- `BehaviorSubject` para estado compartido

---

## Implementación Criptográfica

### Clase `Poly` (Polinomios)

```typescript
class Poly {
  readonly coeffs: number[];  // Always length N=256

  constructor(coeffs: number[] = []) {
    this.coeffs = new Array(N).fill(0).map((_, i) => coeffs[i] ?? 0);
  }

  // Operaciones del anillo
  add(other: Poly): Poly
  sub(other: Poly): Poly
  mul(other: Poly): Poly  // Con reducción X^N + 1

  // Generadores estáticos
  static random(): Poly    // Uniforme en Zq
  static noise(): Poly     // CBD(η=2)
}
```

#### Multiplicación Polinómica

La implementación usa **schoolbook multiplication** con reducción:

```typescript
mul(other: Poly): Poly {
  const res = new Array(2*N).fill(0);

  // Paso 1: Multiplicación estándar
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      res[i + j] += this.coeffs[i] * other.coeffs[j];
    }
  }

  // Paso 2: Reducción módulo X^N + 1 (X^N = -1)
  for (let i = 2*N-2; i >= N; i--) {
    res[i - N] -= res[i];
  }

  // Paso 3: Reducción módulo Q
  return new Poly(res.slice(0, N).map(c => mod(c, Q)));
}
```

**Complejidad**: O(N²) - Adecuado para visualización educativa. Para producción, se usaría NTT (Number Theoretic Transform) para O(N log N).

### Service Pattern

#### KyberCryptoService

**Responsabilidades**:
- Gestión de estado criptográfico
- Ejecución de algoritmos Kyber
- Emisión de eventos para logging

**API Pública**:

```typescript
interface KyberCryptoService {
  // Observables
  state$: Observable<KyberState>;
  events$: Observable<CryptoEvent[]>;

  // Operaciones
  generateKeys(): Promise<void>;
  encrypt(bit: 0 | 1): Promise<void>;
  decrypt(): Promise<number>;

  // Utilidades
  hasKeys(): boolean;
  hasCiphertext(): boolean;
  reset(): void;
}
```

---

## Visualización 3D

### Representación de Lattices

Cada polinomio se visualiza como una **estructura de lattice 3D** con:

1. **Nodos**: Esferas en puntos del lattice (64 puntos en 4×4×4 grid)
2. **Aristas**: Wireframe conectando nodos
3. **Core**: Cubo central con efecto de pulso
4. **Label**: Sprite de texto con nombre y primeros coeficientes

```typescript
createPolyBlock(poly: Poly, color: number, x: number, z: number): THREE.Group {
  const group = new THREE.Group();

  // 1. Instanced spheres para nodos (optimizado)
  const spheres = new THREE.InstancedMesh(sphereGeo, sphereMat, 64);

  // 2. Wireframe para estructura
  const wireframe = new THREE.WireframeGeometry(boxGeo);
  const lines = new THREE.LineSegments(wireframe, lineMat);

  // 3. Core con animación de pulso
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.userData = { pulse: true };

  // 4. Label sprite
  const label = this.createTextSprite(name, poly.toString());

  group.add(spheres, lines, core, label);
  return group;
}
```

### Esquema de Colores Semántico

| Color | Hex | Uso |
|-------|-----|-----|
| Cyan | `0x06b6d4` | Matriz pública A |
| Magenta | `0xd946ef` | Vector secreto s |
| Purple | `0x8b5cf6` | Llave pública t |
| Green | `0x10b981` | Operaciones de Bob (u, v) |
| Yellow | `0xfacc15` | Mensaje m |

### Iluminación Profesional

```typescript
// Luz ambiente (fill general)
ambientLight = new THREE.AmbientLight(0xffffff, 0.4);

// Luz direccional principal (cyan tint)
dirLight = new THREE.DirectionalLight(0x22d3ee, 1.0);
dirLight.castShadow = true;

// Luz de relleno (magenta tint)
fillLight = new THREE.DirectionalLight(0xd946ef, 0.4);

// Luz de borde para profundidad
rimLight = new THREE.DirectionalLight(0x6366f1, 0.3);
```

### Performance Optimizations

1. **Instanced Meshes**: Reduce draw calls para nodos
2. **Frustum Culling**: Solo renderiza objetos visibles
3. **LOD**: Geometría simplificada en distancia (no implementado aún)
4. **Pixel Ratio Cap**: `Math.min(devicePixelRatio, 2)`

---

## Componentes Educativos

### Panel de Análisis Matemático

Calcula y muestra en tiempo real:

```typescript
interface PolyStatistics {
  mean: number;      // μ = (Σ coeffs) / N
  stdDev: number;    // σ = sqrt(Var)
  max: number;       // max(coeffs)
  min: number;       // min(coeffs)
  norm: number;      // ||p||₂ = sqrt(Σ coeffs²)
}
```

**Interpretación Automática**:
- Detecta polinomios de ruido (mean ≈ 0, stdDev pequeña)
- Identifica distribuciones CBD
- Explica significado de norma L2 en contexto LWE

### Panel Educativo

Proporciona explicaciones contextuales para cada operación:

#### Estructura de Contenido

```typescript
interface EducationalContent {
  title: string;
  subtitle: string;
  concepts: Array<{
    label: string;           // Ej: "Anillo Polinómico R"
    description: string;     // Explicación técnica
    formula?: string;        // Notación matemática
    importance: 'high' | 'medium' | 'low';
  }>;
  securityNote?: string;     // Nota sobre seguridad cuántica
}
```

#### Niveles de Importancia

- **High** ⚡: Conceptos fundamentales (anillos, CBD, LWE)
- **Medium** ●: Detalles de implementación
- **Low**: Optimizaciones y notas técnicas

---

## Guía de Desarrollo

### Setup del Proyecto

```bash
# Clonar repositorio
git clone <repo-url>
cd modelo-cifrado

# Instalar dependencias (con pnpm)
pnpm install

# Desarrollo
pnpm start  # http://localhost:4200

# Build producción
pnpm run build

# Ver bundle
pnpm run build --stats-json
```

### Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm start` | Dev server con HMR |
| `pnpm run build` | Build producción + SSR |
| `pnpm test` | Tests unitarios (Karma) |
| `pnpm run watch` | Build continuo |

### Estructura de Git

```
master   # Producción estable
dev      # Desarrollo activo (rama actual)
feature/* # Features en desarrollo
```

### Convenciones de Código

#### TypeScript

```typescript
// BUENO: Tipado explícito
function encrypt(bit: 0 | 1): Promise<void> {
  // ...
}

// MALO: any o implícito
function encrypt(bit) {
  // ...
}
```

#### Comentarios

```typescript
/**
 * Multiply two polynomials in R = Zq[X]/(X^N + 1)
 *
 * Uses schoolbook multiplication with modular reduction.
 * Complexity: O(N²)
 *
 * @param other - Polynomial to multiply with
 * @returns Product polynomial in the ring
 */
mul(other: Poly): Poly {
  // ...
}
```

### Testing Strategy

#### Unit Tests

```typescript
describe('Poly', () => {
  it('should add polynomials correctly', () => {
    const p1 = new Poly([1, 2, 3]);
    const p2 = new Poly([4, 5, 6]);
    const result = p1.add(p2);
    expect(result.coeffs[0]).toBe(5);
  });

  it('should reduce modulo Q', () => {
    const p = new Poly([Q + 1]);
    expect(p.coeffs[0]).toBe(1);
  });
});
```

#### Integration Tests

```typescript
describe('Kyber-512 Flow', () => {
  it('should encrypt and decrypt correctly', async () => {
    await service.generateKeys();
    await service.encrypt(1);
    const decrypted = await service.decrypt();
    expect(decrypted).toBe(1);
  });
});
```

### Debugging

#### Chrome DevTools

```javascript
// En consola del navegador
const app = document.querySelector('app-root');
const ngComponent = ng.getComponent(app);

// Ver estado
console.log(ngComponent.currentState);

// Forzar operación
ngComponent.runKeyGen();
```

#### VS Code Launch Config

```json
{
  "type": "chrome",
  "request": "launch",
  "name": "Debug Angular",
  "url": "http://localhost:4200",
  "webRoot": "${workspaceFolder}"
}
```

---

## Referencias Académicas

### Papers Fundamentales

1. **Kyber Specification**
   Bos, J. et al. (2018). "CRYSTALS-Kyber: A CCA-Secure Module-Lattice-Based KEM"
   *IACR Transactions on Cryptographic Hardware and Embedded Systems*
   https://pq-crystals.org/kyber/

2. **Module-LWE**
   Langlois, A. & Stehlé, D. (2015). "Worst-case to average-case reductions for module lattices"
   *Designs, Codes and Cryptography*
   DOI: 10.1007/s10623-014-9938-4

3. **NIST PQC Standardization**
   NIST (2024). "Post-Quantum Cryptography Standardization"
   https://csrc.nist.gov/projects/post-quantum-cryptography

### Libros Recomendados

1. **"An Introduction to Mathematical Cryptography"**
   Hoffstein, Pipher, Silverman (2014)
   ISBN: 978-1493917105

2. **"A Decade of Lattice Cryptography"**
   Peikert, C. (2016)
   *Foundations and Trends in Theoretical Computer Science*

### Recursos Online

- **Kyber Official**: https://pq-crystals.org/kyber/
- **NIST PQC**: https://csrc.nist.gov/projects/post-quantum-cryptography
- **Lattice Learning**: https://lattices.org/
- **Three.js Docs**: https://threejs.org/docs/

---

## Apéndices

### A. Parámetros de Kyber

| Parámetro | Kyber-512 | Kyber-768 | Kyber-1024 |
|-----------|-----------|-----------|------------|
| N | 256 | 256 | 256 |
| Q | 3329 | 3329 | 3329 |
| K | 2 | 3 | 4 |
| η₁ | 3 | 2 | 2 |
| η₂ | 2 | 2 | 2 |
| Security | NIST 1 | NIST 3 | NIST 5 |
| PK Size | 800 B | 1184 B | 1568 B |
| CT Size | 768 B | 1088 B | 1568 B |

### B. Glosario

- **CBD**: Centered Binomial Distribution
- **CCA**: Chosen-Ciphertext Attack
- **KEM**: Key Encapsulation Mechanism
- **LWE**: Learning With Errors
- **Module-LWE**: LWE sobre módulos de anillos
- **NIST**: National Institute of Standards and Technology
- **NTT**: Number Theoretic Transform
- **PQC**: Post-Quantum Cryptography
- **SVP**: Shortest Vector Problem

### C. Comandos Útiles

```bash
# Ver tamaño de bundle
pnpm run build --stats-json
npx webpack-bundle-analyzer dist/modelo-cifrado/stats.json

# Linting
ng lint

# Format code
npx prettier --write "src/**/*.ts"

# Dependency updates
pnpm update --latest
```

---

## Licencia y Contribuciones

Este proyecto es una implementación educativa de Kyber-512 para propósitos académicos y de investigación.

**Nota de Seguridad**: Esta implementación NO está optimizada para uso en producción. Para aplicaciones reales, use bibliotecas auditadas como:
- liboqs (Open Quantum Safe)
- PQClean
- Implementaciones oficiales de CRYSTALS-Kyber

---

**Versión**: 2.0.0
**Última Actualización**: Noviembre 2025
**Autor**: Proyecto de Nivel Doctorado
**Contacto**: [Información del investigador]
