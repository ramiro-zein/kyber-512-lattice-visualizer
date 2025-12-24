# Fundamentos Matemáticos de la Visualización CRYSTALS-Kyber

## Documento de Justificación Formal para Presentación Doctoral

---

## 1. PROPÓSITO Y CONTEXTO CRIPTOGRÁFICO

### 1.1 Objetivo del Modelo

CRYSTALS-Kyber es un mecanismo de encapsulamiento de claves (KEM) seleccionado por NIST como estándar para criptografía post-cuántica (PQC). Su seguridad se fundamenta en la dificultad computacional del problema **Module Learning With Errors (M-LWE)**, una variante estructurada del problema LWE sobre módulos de anillos.

**Propósito de la visualización**: Representar tridimensionalmente las estructuras algebraicas y operaciones de Kyber de manera que:
1. Cada elemento visual corresponda biunívocamente a una entidad matemática
2. Las transformaciones geométricas reflejen las operaciones algebraicas subyacentes
3. La topología de los objetos 3D capture propiedades estructurales del álgebra

---

## 2. FUNDAMENTOS ALGEBRAICOS FORMALES

### 2.1 El Anillo Base

**Definición 2.1** (Anillo de Polinomios Ciclotómicos)

Sea $R = \mathbb{Z}[X]/\langle X^n + 1 \rangle$ el anillo cociente de polinomios enteros módulo el polinomio ciclotómico $\Phi_{2n}(X) = X^n + 1$, donde $n = 256 = 2^8$.

**Definición 2.2** (Anillo Cociente Modular)

Para el primo $q = 3329$, definimos:
$$R_q = \mathbb{Z}_q[X]/\langle X^n + 1 \rangle = R/qR$$

Cada elemento $a \in R_q$ se representa como:
$$a(X) = \sum_{i=0}^{n-1} a_i X^i, \quad a_i \in \mathbb{Z}_q = \{0, 1, \ldots, q-1\}$$

**Proposición 2.1** (Estructura Algebraica)

$R_q$ es un anillo conmutativo con unidad donde:
- La **suma** es componente a componente módulo $q$
- La **multiplicación** es convolución negacíclica: $X^n \equiv -1 \pmod{X^n + 1}$

**Justificación de Representación Toroidal**:

La relación $X^n \equiv -1$ induce una estructura cíclica con "torsión". El toro $\mathbb{T}^2 = S^1 \times S^1$ captura esta ciclicidad:
- El círculo mayor ($S^1$ principal) representa los índices $i \in \{0, \ldots, n-1\}$
- El círculo menor (radio variable) codifica el valor $a_i \in \mathbb{Z}_q$

La reducción $X^n \equiv -1$ (no $X^n \equiv 1$) se visualiza como una "media vuelta" adicional en la topología del toro, distinguiéndolo de un anillo cíclico simple.

### 2.2 Módulos sobre el Anillo

**Definición 2.3** (Módulo Libre)

Para $k \in \{2, 3, 4\}$ (parámetro de seguridad), el módulo libre:
$$R_q^k = \underbrace{R_q \times R_q \times \cdots \times R_q}_{k \text{ veces}}$$

Un vector $\mathbf{s} \in R_q^k$ es una $k$-tupla de polinomios:
$$\mathbf{s} = (s_0, s_1, \ldots, s_{k-1}), \quad s_i \in R_q$$

**Justificación de Representación como Torre**:

La estructura de producto directo $R_q^k$ sugiere una disposición ortogonal de las componentes. La "torre vertical" de $k$ toros representa:
- **Independencia algebraica**: Cada componente es un elemento independiente de $R_q$
- **Estructura vectorial**: La verticalidad indica ordenamiento en el módulo
- **Conectores luminosos**: Simbolizan la pertenencia a una única estructura vectorial

### 2.3 Matrices sobre el Módulo

**Definición 2.4** (Matriz de Módulo)

Una matriz $\mathbf{A} \in R_q^{k \times k}$ es un arreglo bidimensional:
$$\mathbf{A} = \begin{pmatrix} a_{0,0} & a_{0,1} & \cdots & a_{0,k-1} \\ a_{1,0} & a_{1,1} & \cdots & a_{1,k-1} \\ \vdots & \vdots & \ddots & \vdots \\ a_{k-1,0} & a_{k-1,1} & \cdots & a_{k-1,k-1} \end{pmatrix}, \quad a_{i,j} \in R_q$$

**Operación Matriz-Vector**:
$$\mathbf{A} \cdot \mathbf{s} = \mathbf{t}, \quad t_i = \sum_{j=0}^{k-1} a_{i,j} \cdot s_j$$

donde $\cdot$ denota multiplicación en $R_q$ (convolución negacíclica).

**Justificación de Representación Matricial**:

La cuadrícula $k \times k$ de toros preserva:
- **Semántica de filas/columnas**: Esencial para producto matriz-vector
- **Visualización de la transposición**: Rotación 90° corresponde a $\mathbf{A}^T$
- **Rayos de operación**: Conexiones fila→vector visualizan el producto interno

---

## 3. EL PROBLEMA M-LWE

### 3.1 Formulación Formal

**Definición 3.1** (Distribución de Error)

Sea $\chi_\eta$ la distribución binomial centrada con parámetro $\eta$:
$$\text{CBD}_\eta: x = \sum_{i=0}^{\eta-1}(a_i - b_i), \quad a_i, b_i \leftarrow \{0,1\}$$

Para Kyber-768: $\eta = 2$, produciendo $x \in \{-2, -1, 0, 1, 2\}$ con distribución:
$$\Pr[x = k] = \binom{2\eta}{\eta + k} / 2^{2\eta}$$

**Definición 3.2** (Problema M-LWE Decisional)

Dados:
- $\mathbf{A} \leftarrow U(R_q^{k \times k})$ (matriz uniformemente aleatoria)
- $\mathbf{s} \leftarrow \chi_\eta^k$ (secreto con coeficientes pequeños)
- $\mathbf{e} \leftarrow \chi_\eta^k$ (error con coeficientes pequeños)

Distinguir $(\mathbf{A}, \mathbf{b} = \mathbf{A}\mathbf{s} + \mathbf{e})$ de $(\mathbf{A}, \mathbf{u})$ donde $\mathbf{u} \leftarrow U(R_q^k)$.

**Justificación Visual de Coeficientes Pequeños**:

Los vectores $\mathbf{s}$ y $\mathbf{e}$ se visualizan con esferas de radio reducido (proporcional a $|a_i|/q$), comunicando:
- **Concentración alrededor del cero**: Refleja $\mathbb{E}[\chi_\eta] = 0$
- **Contraste con aleatorio**: Elementos uniformes tienen esferas de tamaño variable
- **Color distintivo**: Rojo (secreto crítico) vs. violeta (ruido perturbador)

---

## 4. PROTOCOLO KYBER-KEM

### 4.1 Generación de Claves (KeyGen)

**Algoritmo formal**:

```
KeyGen():
  ρ, σ ← {0,1}^256
  A ← Sam(ρ) ∈ R_q^{k×k}           // Matriz pseudoaleatoria
  s ← CBD_η(PRF(σ, 0..k-1))        // Secreto
  e ← CBD_η(PRF(σ, k..2k-1))       // Error
  t = A·s + e                       // Vector público
  pk = (ρ, t)                       // Clave pública
  sk = s                            // Clave secreta
```

**Visualización**:
1. **Génesis de A**: Emergencia de cuadrícula con valores estabilizándose
2. **Cristalización de s, e**: Coeficientes pequeños visibles
3. **Cálculo t = As + e**: Rayos de operación matriz-vector + absorción de error
4. **Separación**: División espacial público/privado

### 4.2 Encapsulamiento (Encaps)

**Algoritmo formal**:

```
Encaps(pk):
  m ← {0,1}^256                     // Mensaje aleatorio
  (K̄, r) = G(m || H(pk))           // Derivación determinista
  r ← CBD_η(PRF(r, 0..k-1))
  e₁ ← CBD_η(PRF(r, k..2k-1))
  e₂ ← CBD_η(PRF(r, 2k))
  u = A^T·r + e₁                    // Vector cifrado
  v = t^T·r + e₂ + ⌈q/2⌋·m         // Escalar cifrado
  c = (Compress(u), Compress(v))    // Ciphertext comprimido
  K = H(K̄ || H(c))                 // Clave compartida
```

**Fórmula de codificación del mensaje**:
$$\text{Encode}(m) = \left\lfloor \frac{q}{2} \right\rfloor \cdot m = 1664 \cdot m$$

donde $m \in \{0,1\}^{256}$ se interpreta como vector de coeficientes.

**Visualización**:
1. **Esfera de mensaje**: 256 bits en vértices de icosaedro subdividido
2. **Transposición visual**: Matriz A rota 90° para $A^T$
3. **Operaciones paralelas**: u y v se calculan simultáneamente
4. **Encapsulación**: Cápsula translúcida envuelve (u, v)

### 4.3 Decapsulamiento (Decaps)

**Algoritmo formal**:

```
Decaps(sk, c):
  u, v = Decompress(c)
  m' = Compress₁(v - s^T·u)         // Recuperación del mensaje
  (K̄', r') = G(m' || H(pk))
  u', v' = Reencrypt(pk, m', r')    // Re-cifrado para verificación
  if (u, v) = (u', v'):
    K = H(K̄' || H(c))              // Clave válida
  else:
    K = H(z || H(c))                // Clave de rechazo implícito
```

**Análisis de correctitud**:
$$v - \mathbf{s}^T \mathbf{u} = (\mathbf{t}^T\mathbf{r} + e_2 + \text{Encode}(m)) - \mathbf{s}^T(\mathbf{A}^T\mathbf{r} + \mathbf{e}_1)$$
$$= \mathbf{t}^T\mathbf{r} - \mathbf{s}^T\mathbf{A}^T\mathbf{r} + e_2 - \mathbf{s}^T\mathbf{e}_1 + \text{Encode}(m)$$
$$= (\mathbf{A}\mathbf{s} + \mathbf{e})^T\mathbf{r} - \mathbf{s}^T\mathbf{A}^T\mathbf{r} + e_2 - \mathbf{s}^T\mathbf{e}_1 + \text{Encode}(m)$$
$$= \mathbf{e}^T\mathbf{r} + e_2 - \mathbf{s}^T\mathbf{e}_1 + \text{Encode}(m)$$
$$= \underbrace{\mathbf{e}^T\mathbf{r} + e_2 - \mathbf{s}^T\mathbf{e}_1}_{\text{error total (pequeño)}} + \text{Encode}(m)$$

**Visualización del error residual**:

El término $\mathbf{e}^T\mathbf{r} + e_2 - \mathbf{s}^T\mathbf{e}_1$ es pequeño porque todos los vectores involucrados tienen coeficientes pequeños. Esto se visualiza como:
- **Cancelación de ondas**: La resta $v - \mathbf{s}^T\mathbf{u}$ elimina la componente principal
- **Ruido residual**: Perturbación menor visualizada como "temblor" en los coeficientes
- **Proyección a retícula**: El redondeo a $\{0, \lfloor q/2 \rfloor\}$ recupera el bit original

---

## 5. JUSTIFICACIÓN DE DECISIONES VISUALES

### 5.1 Elección del Toro como Primitiva

**Teorema (Isomorfismo Topológico)**

El grupo aditivo $\mathbb{Z}_n \times \mathbb{Z}_m$ es topológicamente equivalente al toro $\mathbb{T}^2$ discretizado.

**Aplicación a $R_q$**:
- Los índices $\{0, \ldots, n-1\}$ forman $\mathbb{Z}_n$
- Los valores $\{0, \ldots, q-1\}$ forman $\mathbb{Z}_q$
- El producto $\mathbb{Z}_n \times \mathbb{Z}_q$ se mapea naturalmente al toro

**Parámetros geométricos**:
- Radio mayor $R = 25u$: Proporcional a $n/10$ para legibilidad
- Radio menor $r$: Variable según $a_i/q$ (0.5u a 3u)

### 5.2 Codificación de Color

| Entidad | Color | Justificación Matemática |
|---------|-------|--------------------------|
| $\mathbf{A}$ | Plateado | Matriz pública, generada aleatoriamente, neutral |
| $\mathbf{s}$ | Rojo | Secreto crítico, su exposición compromete seguridad |
| $\mathbf{e}, \mathbf{e}_1, \mathbf{e}_2$ | Violeta | Ruido aditivo, perturbación del espacio |
| $\mathbf{r}$ | Azul | Vector efímero, fresco por sesión |
| $\mathbf{t}$ | Dorado | Derivado público del secreto, "máscara" de $\mathbf{s}$ |
| $\mathbf{u}, v$ | Esmeralda | Datos cifrados, protegidos |
| $m$ | Blanco | Información pura, mensaje original |
| $K$ | Holográfico | Clave compartida, síntesis criptográfica |

### 5.3 Representación de la NTT

**Definición (Number Theoretic Transform)**

Para $\omega$ raíz $n$-ésima primitiva de la unidad en $\mathbb{Z}_q$:
$$\hat{a}_i = \text{NTT}(a)_i = \sum_{j=0}^{n-1} a_j \omega^{ij} \pmod{q}$$

**Visualización propuesta** (mejora):
- **Dominio temporal**: Toro con coeficientes $a_0, \ldots, a_{n-1}$
- **Transformación**: Desenrollado + reorganización según patrón de mariposa Cooley-Tukey
- **Dominio frecuencial**: Arreglo lineal con $\hat{a}_0, \ldots, \hat{a}_{n-1}$

La multiplicación puntual en dominio NTT: $\text{NTT}(a \cdot b) = \text{NTT}(a) \odot \text{NTT}(b)$

---

## 6. OPTIMIZACIONES PROPUESTAS

### 6.1 Mejoras de Fidelidad Matemática

1. **Escala logarítmica para coeficientes**: $r = r_{\min} + \log(1 + |a_i|) \cdot c$
2. **Visualización de la distribución CBD**: Histograma 3D emergente durante muestreo
3. **Indicadores de módulo**: Efecto de "wrap-around" visible cuando $a + b \geq q$
4. **Anotaciones LaTeX**: Fórmulas renderizadas en tiempo real

### 6.2 Mejoras de Comunicación Visual

1. **Trazabilidad de operaciones**: Líneas de flujo persistentes con degradado temporal
2. **Panel de ecuaciones**: Mostrar la ecuación activa durante cada operación
3. **Modo "paso a paso"**: Control granular sobre cada operación atómica
4. **Comparación lado a lado**: Original vs. cifrado vs. recuperado

---

*Documento preparado según estándares de rigor doctoral.*
*Todas las definiciones siguen la especificación FIPS 203 (ML-KEM).*
