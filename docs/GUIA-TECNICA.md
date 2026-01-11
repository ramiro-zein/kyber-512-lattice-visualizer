# Guía Técnica del Proyecto

## Visualización 3D de CRYSTALS-Kyber-512

---

## Propósito de Este Documento

Este documento proporciona la información técnica necesaria para instalar, configurar y desarrollar el proyecto de visualización de CRYSTALS-Kyber-512. Para comprender los fundamentos conceptuales del algoritmo y su contexto criptográfico, consulte el documento [README.md](README.md). Para los detalles matemáticos formales, consulte [FUNDAMENTO-MATEMATICO.md](FUNDAMENTO-MATEMATICO.md).

---

## 1. Requisitos del Sistema

### 1.1 Software Requerido

| Componente | Versión Mínima | Recomendada |
|------------|----------------|-------------|
| Node.js | 18.0 | 20.0 o superior |
| npm | 9.0 | 10.0 o superior |
| pnpm (alternativo) | 8.0 | 9.0 o superior |

### 1.2 Navegador Web

La aplicación requiere un navegador moderno con soporte para:

- WebGL 2.0
- ECMAScript 2022
- CSS Grid y Flexbox

Navegadores compatibles verificados:

- Google Chrome 90+
- Mozilla Firefox 90+
- Microsoft Edge 90+
- Safari 15+

### 1.3 Hardware Recomendado

Para una experiencia óptima de visualización 3D:

- Procesador: 4 núcleos, 2.0 GHz o superior
- Memoria RAM: 8 GB mínimo
- GPU: Compatible con WebGL 2.0 (integrada o dedicada)
- Resolución de pantalla: 1920×1080 o superior

---

## 2. Instalación

### 2.1 Clonar el Repositorio

Obtenga una copia del código fuente desde el sistema de control de versiones:

```bash
git clone https://github.com/ramiro-zein/kyber-512-lattice-visualizer.git
cd kyber-512-lattice-visualizer
```

### 2.2 Instalar Dependencias

Utilizando npm:

```bash
npm install
```



### 2.3 Verificar la Instalación

Ejecute el servidor de desarrollo para confirmar que la instalación se completó correctamente:

```bash
npm start
```

Si la instalación fue exitosa, verá un mensaje indicando que el servidor está activo en `http://localhost:4200/`.

---

## 4. Estructura del Proyecto

### 4.1 Árbol de Directorios

```
modelo-cifrado/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/
│   │   │   │   └── kyber.types.ts
│   │   │   └── services/
│   │   │       ├── kyber-crypto.service.ts
│   │   │       └── three-visualization.service.ts
│   │   ├── components/
│   │   │   └── kyber-visualization/
│   │   │       ├── math-analysis-panel.component.ts
│   │   │       └── educational-panel.component.ts
│   │   ├── app.ts
│   │   ├── app.html
│   │   └── app.scss
│   ├── assets/
│   ├── environments/
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── docs/
│   ├── README.md
│   ├── GUIA-TECNICA.md
│   ├── FUNDAMENTO-MATEMATICO.md
│   └── VISUALIZACION-3D-CRYSTALS-KYBER.md
├── angular.json
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

### 4.2 Descripción de Directorios

| Directorio | Contenido |
|------------|-----------|
| `src/app/core/models/` | Definiciones de tipos TypeScript para estructuras matemáticas (polinomios, vectores, matrices) y estados criptográficos |
| `src/app/core/services/` | Servicios Angular que encapsulan la lógica criptográfica y de visualización |
| `src/app/components/` | Componentes de interfaz de usuario (paneles de análisis, controles) |
| `src/assets/` | Recursos estáticos (imágenes, fuentes) |
| `docs/` | Documentación del proyecto |

### 4.3 Archivos Principales

| Archivo | Responsabilidad |
|---------|-----------------|
| `kyber.types.ts` | Clase `Poly` (polinomios), tipos para estado criptográfico, interfaces de eventos |
| `kyber-crypto.service.ts` | Implementación de algoritmos Kyber (KeyGen, Encaps, Decaps) |
| `three-visualization.service.ts` | Motor de renderizado 3D, gestión de escena, animaciones |
| `app.ts` | Componente orquestador que coordina servicios y UI |
| `math-analysis-panel.component.ts` | Panel de estadísticas matemáticas en tiempo real |
| `educational-panel.component.ts` | Panel con explicaciones contextuales |

---

## 5. Arquitectura del Software

### 5.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    App Component                            │
│  • Gestiona estado de UI                                    │
│  • Coordina interacción entre servicios                     │
│  • Maneja eventos de usuario                                │
└──────────────┬─────────────────────────┬────────────────────┘
               │                         │
               ▼                         ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│   KyberCryptoService     │  │  ThreeVisualizationService   │
│                          │  │                              │
│  • generateKeys()        │  │  • initialize()              │
│  • encrypt(bit)          │  │  • visualizeMatrix()         │
│  • decrypt()             │  │  • visualizeVector()         │
│  • Estado criptográfico  │  │  • animateTransmission()     │
│  • Emisión de eventos    │  │  • createLatticeStructure()  │
└──────────────┬───────────┘  └──────────────────────────────┘
               │
               ▼
┌──────────────────────────┐
│     Kyber Models         │
│                          │
│  • Clase Poly            │
│  • Operaciones de anillo │
│  • Distribución CBD      │
│  • Funciones auxiliares  │
└──────────────────────────┘
```

### 5.2 Principios de Diseño

El proyecto sigue los principios SOLID de diseño orientado a objetos:

**Responsabilidad Única (SRP)**

Cada servicio tiene una única responsabilidad bien definida:
- `KyberCryptoService`: Exclusivamente lógica criptográfica
- `ThreeVisualizationService`: Exclusivamente renderizado 3D
- Componentes: Exclusivamente presentación de UI

**Inversión de Dependencias (DIP)**

Los componentes dependen de abstracciones en lugar de implementaciones concretas, facilitando pruebas y mantenimiento.

**Segregación de Interfaces (ISP)**

Las interfaces expuestas por los servicios son mínimas y específicas para cada caso de uso.

### 5.3 Flujo de Datos

El proyecto utiliza programación reactiva mediante RxJS:

1. **Estado criptográfico**: Gestionado mediante `BehaviorSubject` en `KyberCryptoService`
2. **Eventos**: Las operaciones criptográficas emiten eventos observables
3. **Suscripción**: Los componentes se suscriben a los cambios de estado
4. **Actualización de UI**: Las actualizaciones se propagan automáticamente

```typescript
// Ejemplo de flujo reactivo
cryptoService.state$.subscribe(state => {
  if (state.publicKey) {
    visualizationService.visualizeMatrix(state.publicKey.A);
  }
});
```

---


## 6. Comandos Disponibles

### 6.1 Desarrollo

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia servidor de desarrollo con HMR |
| `npm run watch` | Compilación continua sin servidor |
| `npm test` | Ejecuta pruebas unitarias con Karma |
| `npm run lint` | Verifica estilo de código con ESLint |

### 6.2 Producción

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Genera build optimizado para producción |
| `npm run serve:ssr:kyber-512-lattice-visualizer` | Sirve build SSR |

### 6.3 Utilidades

| Comando | Descripción |
|---------|-------------|
| `npx prettier --write "src/**/*.ts"` | Formatea código TypeScript |
| `npm update --latest` | Actualiza dependencias |

### 6.4 Análisis

Para analizar el tamaño del bundle:

```bash
npm run build -- --stats-json
npx webpack-bundle-analyzer dist/kyber-512-lattice-visualizer/stats.json
```

---

## 7. Notas de Seguridad

### 7.1 Advertencia Importante

**Esta implementación es exclusivamente para propósitos educativos y de investigación.**

No utilice este código en aplicaciones de producción. Las siguientes limitaciones hacen que esta implementación sea inadecuada para entornos de seguridad real:

| Limitación | Riesgo |
|------------|--------|
| Uso de `Math.random()` | No es criptográficamente seguro; patrones predecibles |
| Sin protección de tiempo constante | Vulnerable a ataques de canal lateral (timing attacks) |
| Sin compresión de texto cifrado | Tamaños mayores que el estándar |
| Implementación en JavaScript | Menor control sobre gestión de memoria |

---

## Referencias Técnicas

### Documentación de Dependencias

- Angular: https://angular.io/docs
- Three.js: https://threejs.org/docs/
- Tween.js: https://github.com/tweenjs/tween.js
- Tailwind CSS: https://tailwindcss.com/docs
- TypeScript: https://www.typescriptlang.org/docs/
- RxJS: https://rxjs.dev/guide/overview
