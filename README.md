# Kyber-512 3D Visualization 🔐

> **Visualización Interactiva 3D del Algoritmo Post-Cuántico Kyber-512**
> Proyecto de Nivel Doctorado

<p align="center">
  <img src="https://img.shields.io/badge/Angular-20.3-red?style=for-the-badge&logo=angular" />
  <img src="https://img.shields.io/badge/Three.js-r128-black?style=for-the-badge&logo=three.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Security-Post_Quantum-green?style=for-the-badge" />
</p>

## 🎯 Descripción

Implementación completa y visualización interactiva en 3D del algoritmo de cifrado post-cuántico **CRYSTALS-Kyber-512**, seleccionado por el NIST como estándar para criptografía resistente a ataques cuánticos.

### Características Principales

- ✅ **Implementación Matemática Rigurosa**: Kyber-512 completo con operaciones en anillos polinómicos
- ✅ **Visualización 3D en Tiempo Real**: Estructuras lattice renderizadas con Three.js
- ✅ **Panel de Análisis Matemático**: Estadísticas en vivo de polinomios
- ✅ **Modo Educativo Avanzado**: Explicaciones de nivel doctoral
- ✅ **Arquitectura Modular**: Separación clara de responsabilidades (SOLID)
- ✅ **TypeScript Estricto**: Tipado fuerte sin uso de `any`

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 20+
- pnpm (recomendado) o npm

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd modelo-cifrado

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm start
```

Navega a `http://localhost:4200/` para ver la aplicación.

## 📚 Uso de la Aplicación

### 1. Generación de Llaves

Haz clic en **"Generar Llaves"** para:
- Generar matriz pública A (2×2 de polinomios)
- Crear vector secreto s usando CBD(η=2)
- Calcular llave pública t = As + e

### 2. Encriptación

Selecciona un bit (0 o 1) para:
- Codificar mensaje como polinomio
- Generar vectores aleatorios r, e₁, e₂
- Calcular ciphertext (u, v)
- Visualizar transmisión

### 3. Desencriptación

Haz clic en **"Descifrar"** para:
- Calcular s^T · u
- Recuperar mensaje ruidoso
- Decodificar bit original
- Verificar correctitud

## 🏗️ Arquitectura

```
src/app/
├── core/
│   ├── models/
│   │   └── kyber.types.ts              # Tipos matemáticos
│   └── services/
│       ├── kyber-crypto.service.ts      # Lógica criptográfica
│       └── three-visualization.service.ts # Motor 3D
├── components/
│   └── kyber-visualization/
│       ├── math-analysis-panel.component.ts
│       └── educational-panel.component.ts
└── app.ts                               # Orquestador principal
```

### Servicios Principales

#### KyberCryptoService
- Implementa algoritmos de Kyber-512
- Gestiona estado criptográfico
- Emite eventos para logging

#### ThreeVisualizationService
- Renderiza estructuras lattice en 3D
- Gestiona animaciones y transiciones
- Optimiza performance visual

## 🔬 Fundamentos Matemáticos

### Anillo Polinómico

```
R = ℤ₃₃₂₉[X]/(X²⁵⁶ + 1)
```

### Parámetros Kyber-512

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| N | 256 | Grado del polinomio |
| Q | 3329 | Módulo primo |
| K | 2 | Dimensión del módulo |
| η | 2 | Parámetro CBD |
| Security | NIST Level 1 | Equivalente a AES-128 |

### Seguridad

La seguridad se basa en **Module-LWE** (Learning With Errors sobre módulos), considerado resistente a:
- ✅ Computadoras clásicas
- ✅ Computadoras cuánticas (algoritmo de Shor)
- ✅ Ataques de lado de canal (con implementación adecuada)

## 📖 Documentación

Para documentación técnica completa de nivel doctorado, ver:
- [KYBER-TECHNICAL-DOCUMENTATION.md](KYBER-TECHNICAL-DOCUMENTATION.md)

Incluye:
- Fundamentos matemáticos detallados
- Análisis de seguridad
- Guía de desarrollo
- Referencias académicas

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
pnpm start              # Servidor dev con HMR

# Build
pnpm run build          # Build de producción
pnpm run watch          # Build continuo

# Testing
pnpm test               # Tests unitarios
```

## 🎨 Tecnologías

- **Framework**: Angular 20.3
- **3D**: Three.js + OrbitControls
- **Animaciones**: Tween.js
- **Estilos**: Tailwind CSS 4
- **TypeScript**: 5.9
- **Build**: esbuild (vía Angular)

## 📊 Características Técnicas

### Visualización 3D

- **Instanced Meshes**: Optimización de draw calls
- **Iluminación Profesional**: 3 luces direccionales + ambiente
- **Esquema de Colores Semántico**: Color-coding por tipo de datos
- **Animaciones Fluidas**: Tween.js para transiciones suaves

### Paneles de Análisis

#### Panel Matemático
- Media y desviación estándar
- Norma L2 euclidiana
- Valores máximo/mínimo
- Interpretación automática

#### Panel Educativo
- Explicaciones contextuales
- Fórmulas matemáticas
- Notas de seguridad
- 3 niveles de importancia

## ⚠️ Nota de Seguridad

Esta es una implementación **educativa** y de **investigación**. NO usar en producción.

Para aplicaciones reales, use bibliotecas auditadas:
- [liboqs](https://github.com/open-quantum-safe/liboqs) (Open Quantum Safe)
- [PQClean](https://github.com/PQClean/PQClean)
- Implementaciones oficiales de CRYSTALS

## 📄 Licencia

Proyecto académico para propósitos educativos y de investigación.

## 🤝 Referencias

- [CRYSTALS-Kyber Official](https://pq-crystals.org/kyber/)
- [NIST Post-Quantum Cryptography](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [Module-LWE Paper](https://doi.org/10.1007/s10623-014-9938-4)

## 👨‍🎓 Autor

Proyecto de Nivel Doctorado - Implementación Completa de Kyber-512

---

**Versión**: 2.0.0
**Build Status**: ✅ Compilación exitosa
**Bundle Size**: 862.73 kB (200.53 kB gzipped)
