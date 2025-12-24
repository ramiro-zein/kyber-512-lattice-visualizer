# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Educational implementation and 3D visualization of the **CRYSTALS-Kyber-512** post-quantum cryptographic algorithm. This is a PhD-level project demonstrating the full Kyber Key Encapsulation Mechanism with real-time 3D rendering of lattice structures using Three.js.

**Critical**: This is an educational/research implementation. NOT for production use. Recommend audited libraries (liboqs, PQClean) for real applications.

## Key Commands

### Development
```bash
npm start              # Start dev server at http://localhost:4200
npm run build          # Production build with SSR
npm run watch          # Continuous build (development mode)
npm test               # Run Karma unit tests
```

### SSR (Server-Side Rendering)
```bash
npm run build                              # Build for SSR
npm run serve:ssr:modelo-cifrado          # Serve SSR build
```

### Package Manager
This project uses **npm** (not pnpm, despite what README.md says). The `bun.lock` file is present but npm is the primary package manager.

## Architecture

### Service-Oriented Design

The application follows strict separation of concerns with three core services:

1. **KyberCryptoService** (`src/app/core/services/kyber-crypto.service.ts`)
   - Pure cryptographic logic implementing Kyber-512 algorithms
   - Manages cryptographic state via RxJS BehaviorSubject
   - Emits CryptoEvent stream for operation logging
   - Methods: `generateKeys()`, `encrypt(bit)`, `decrypt()`
   - All operations are async and return Promises

2. **ThreeVisualizationService** (`src/app/core/services/three-visualization.service.ts`)
   - Professional 3D rendering engine using Three.js
   - Scene lifecycle: `initialize()`, `dispose()`, `clearScene()`
   - Configurable: scene, camera, lighting, controls, grid
   - Three-point lighting system (directional key + fill + rim lights)
   - Auto-rotation and orbit controls support

3. **App Component** (`src/app/app.ts`)
   - Orchestrates crypto service and visualization service
   - NO direct cryptographic or rendering logic
   - Manages UI state and user interactions
   - Platform-aware (SSR safe with `isPlatformBrowser`)

### Mathematical Foundation

**Polynomial Ring**: R = ℤ₃₃₂₉[X]/(X²⁵⁶ + 1)

**Security**: Based on Module-LWE (Learning With Errors over modules), resistant to quantum computers.

**Kyber-512 Parameters**:
- N = 256 (polynomial degree)
- Q = 3329 (prime modulus)
- K = 2 (module dimension)
- η = 2 (CBD parameter)
- Security: NIST Level 1 (equivalent to AES-128)

### Core Data Structures

**Poly class** (`src/app/core/models/kyber.types.ts:22`):
- Represents polynomials in the ring R
- Immutable: all operations return new instances
- Operations: `add()`, `sub()`, `mul()` (schoolbook O(N²) multiplication)
- Generators: `Poly.random()` (uniform), `Poly.noise()` (CBD distribution)

**KyberState interface**:
```typescript
{
  A: PolyMatrix,     // Public matrix (K×K)
  s: PolyVector,     // Secret key (K×1)
  t: PolyVector,     // Public key = As + e
  r: PolyVector,     // Encryption randomness
  u: PolyVector,     // Ciphertext component 1
  v: Poly | null,    // Ciphertext component 2
  msgBit: number     // Message (0 or 1)
}
```

## Cryptographic Flow

1. **Key Generation** (Algorithm 1):
   - Generate uniform matrix A (K×K polynomials)
   - Sample secret s, error e using CBD(η=2)
   - Compute public key t = As + e

2. **Encryption** (Algorithm 2):
   - Input: public key (A, t), message bit m
   - Sample r, e₁, e₂ using CBD
   - Encode m: 0→0, 1→⌊Q/2⌋
   - Compute u = Aᵀr + e₁
   - Compute v = tᵀr + e₂ + encode(m)

3. **Decryption** (Algorithm 3):
   - Compute m' = v - sᵀu
   - Decode: if m'[0] ∈ [⌊Q/4⌋, ⌊3Q/4⌋] → 1, else → 0

## Code Style & Patterns

### TypeScript Strictness
- NO use of `any` type (strict typing enforced)
- Explicit interfaces for all contracts
- Immutability: state objects are read-only, operations return new instances

### Reactive Programming
- Services use RxJS BehaviorSubject for state management
- Components subscribe to `state$` and `events$` observables
- Always unsubscribe in `ngOnDestroy()` or use AsyncPipe

### SSR Compatibility
```typescript
// Always check platform before browser APIs
if (isPlatformBrowser(inject(PLATFORM_ID))) {
  // Browser-only code
}

// Use afterNextRender for initialization
afterNextRender(() => {
  this.initializeVisualization();
}, { injector: this.injector });
```

### Resource Management
- Three.js requires manual cleanup: call `visualService.dispose()` in `ngOnDestroy()`
- Traverse scene to dispose geometries/materials
- Cancel animation frames on cleanup

## 3D Visualization

### Rendering Pipeline
- WebGL renderer with ACES Filmic tone mapping
- Exponential fog for depth perception
- PCF soft shadow mapping (2048x2048 shadow map)
- Pixel ratio capped at 2 for performance

### Visual Encoding
Each polynomial is rendered as a lattice structure:
- **Instanced Meshes**: 64 sphere instances (4×4×4 grid) for performance
- **Wireframe**: Box geometry showing lattice structure
- **Core**: Central cube with pulse animation
- **Label Sprite**: Text showing polynomial name and first coefficients

**Color Scheme** (semantic):
- Cyan `0x06b6d4`: Public matrix A
- Magenta `0xd946ef`: Secret vector s
- Purple `0x8b5cf6`: Public key t
- Green `0x10b981`: Ciphertext (u, v)
- Yellow `0xfacc15`: Message m

## Testing

### Running Tests
```bash
npm test                    # Run all tests with Karma
```

### Test Structure
- Unit tests in `*.spec.ts` files
- Karma + Jasmine test runner
- Test crypto operations: verify encrypt→decrypt returns original bit
- Test polynomial operations: addition, multiplication, modular reduction

## Git Workflow

**Branches**:
- `master`: Production-stable code
- `dev`: Active development (current branch)
- `feature/*`: Feature branches

**Commits**: Recent commits show incremental development with date-based markers (#26112025, #19112025).

## Documentation

- `README.md`: User-facing guide and quick start
- `KYBER-TECHNICAL-DOCUMENTATION.md`: PhD-level technical documentation
  - Mathematical foundations (Module-LWE, CBD, ring operations)
  - Security analysis and proofs
  - Implementation details and complexity analysis
  - Academic references and papers

## Common Pitfalls

1. **Polynomial Multiplication**: Uses schoolbook O(N²) algorithm for educational clarity. Production would use NTT (Number Theoretic Transform) for O(N log N).

2. **Random Number Generation**: Uses `Math.random()` for simplicity. Production requires cryptographically secure randomness (Web Crypto API).

3. **Memory Leaks**: Three.js objects must be manually disposed. Always call `geometry.dispose()` and `material.dispose()` when removing objects.

4. **SSR Issues**: Never access `window`, `document`, or DOM APIs without platform checks. Initialize Three.js only in `afterNextRender()`.

5. **Module-LWE Noise**: CBD must produce small coefficients ({-2,-1,0,1,2} for η=2). Large noise breaks security and causes decryption failures.

## Angular Configuration

- **Framework**: Angular 20.3 (standalone components, no NgModules)
- **Builder**: `@angular/build:application` (modern esbuild-based builder)
- **Styles**: SCSS with Tailwind CSS 4
- **SSR**: Enabled via `outputMode: "server"`
- **Prefix**: `app` (component selector prefix)

## Performance Considerations

- **Bundle Size**: ~863 kB (201 kB gzipped) - acceptable for educational app
- **Draw Calls**: Minimized via InstancedMesh for lattice nodes
- **Animation Loop**: Uses `requestAnimationFrame` with orbit control damping
- **Viewport**: Responsive camera positioning based on aspect ratio

## References

When discussing cryptographic correctness, cite:
- CRYSTALS-Kyber specification: https://pq-crystals.org/kyber/
- NIST PQC standardization: https://csrc.nist.gov/projects/post-quantum-cryptography
- Module-LWE paper: DOI 10.1007/s10623-014-9938-4
