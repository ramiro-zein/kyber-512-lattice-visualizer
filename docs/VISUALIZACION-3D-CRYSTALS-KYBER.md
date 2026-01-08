# Especificación de Visualización 3D para CRYSTALS-Kyber

---

# PARTE I: RAZONAMIENTO Y ANÁLISIS

---

## 1. ANÁLISIS DE ESTRUCTURAS ALGEBRAICAS

### 1.1 El Anillo de Polinomios Rq

CRYSTALS-Kyber opera sobre el anillo cociente:

```
Rq = Zq[X] / (X^n + 1)
```

Donde:
- **n = 256**: El grado máximo de los polinomios
- **q = 3329**: El módulo primo (elegido para permitir NTT eficiente)
- **Zq**: Enteros módulo q, es decir {0, 1, 2, ..., 3328}

**Interpretación matemática**: Cada elemento de Rq es un polinomio de grado máximo 255 con coeficientes en Zq. La reducción por (X^n + 1) significa que X^256 ≡ -1 (mod q), lo cual induce una estructura cíclica específica.

**Decisión de modelado**: Este anillo será representado como un **toro (donut) discretizado** con 256 posiciones angulares, donde cada posición contiene un valor entre 0 y 3328. El toro captura la ciclicidad inherente al cociente por (X^n + 1), mientras que la altura radial codifica el valor del coeficiente.

**Justificación**: La topología del toro refleja matemáticamente la estructura de anillo cociente: el círculo mayor representa los 256 índices de coeficientes, y el círculo menor (radio variable) representa el valor modular. La relación X^256 ≡ -1 crea una "torsión" natural que el toro visualiza geométricamente.

### 1.2 Vectores sobre Rq (Módulos)

Kyber utiliza vectores de dimensión k sobre Rq, donde k ∈ {2, 3, 4} según el nivel de seguridad:
- Kyber-512: k = 2
- Kyber-768: k = 3
- Kyber-1024: k = 4

Un vector **s** ∈ Rq^k es una tupla de k polinomios:
```
s = (s₀, s₁, ..., s_{k-1})
```

**Decisión de modelado**: Representar como k toros apilados verticalmente con conexiones luminosas entre ellos, formando una "torre de toros". Cada toro corresponde a una componente del vector.

**Justificación**: Esta representación mantiene la independencia de cada componente polinomial mientras visualiza su pertenencia a una estructura vectorial unificada. La verticalidad sugiere orden y dimensionalidad.

### 1.3 Matrices sobre Rq

La matriz pública **A** es una matriz k×k donde cada entrada es un elemento de Rq:

```
A = [a₀₀  a₀₁  ...  a₀,k-1]
    [a₁₀  a₁₁  ...  a₁,k-1]
    [...]
    [a_{k-1,0} ... a_{k-1,k-1}]
```

Esto representa k² polinomios de grado 255 cada uno.

**Decisión de modelado**: Una **cuadrícula 3D de toros** dispuestos en formación matricial. Para k=3 (Kyber-768), esto sería una grilla 3×3 de 9 toros, cada uno representando un polinomio de 256 coeficientes.

**Justificación**: La disposición matricial preserva la semántica algebraica de filas y columnas, crítica para las operaciones de producto matriz-vector. Los toros individuales mantienen la fidelidad a la estructura de anillo.

### 1.4 Operaciones Modulares

Las operaciones clave son:
1. **Suma modular**: (a + b) mod q
2. **Multiplicación modular**: (a × b) mod q
3. **Multiplicación de polinomios**: Convolución negacíclica
4. **NTT (Number Theoretic Transform)**: Transformación al dominio de frecuencias

**Decisión de modelado para suma**: Animación de fusión donde dos elementos luminosos convergen y su intensidad combinada "desborda" al superar q, reiniciando desde 0 (visualizado como un pulso de reseteo).

**Decisión de modelado para NTT**: Representar como una transformación espacial donde el toro se "despliega" en un arreglo lineal de 256 puntos, se aplican las mariposas de Cooley-Tukey visualizadas como cruces de conexiones, y luego se "reenvuelve" en forma toroidal.

**Justificación**: La NTT es fundamental para la eficiencia de Kyber. Visualizarla como un desplegamiento temporal captura la esencia de la transformación entre dominios (tiempo/frecuencia análogos a posición/coeficiente).

---

## 2. ANÁLISIS DEL PROBLEMA MATEMÁTICO SUBYACENTE

### 2.1 Module Learning With Errors (M-LWE)

El problema M-LWE es el fundamento de seguridad de Kyber:

**Dado**: Una matriz aleatoria **A** y un vector **b** = **A·s** + **e**
**Problema**: Distinguir **b** de un vector uniformemente aleatorio

Donde:
- **s**: Vector secreto con coeficientes "pequeños" (distribución centrada binomial)
- **e**: Vector de error con coeficientes "pequeños"

**Decisión de modelado**: El secreto **s** y el error **e** se visualizarán con coeficientes de menor altura/intensidad comparados con elementos aleatorios. La distribución binomial centrada se representará como una "nube gaussiana" discreta alrededor del cero.

**Justificación**: Los coeficientes pequeños son la característica definitoria de la seguridad. Visualizar esta "pequeñez" permite comprender intuitivamente por qué el ruido enmascara el secreto pero permite recuperación con la clave privada.

### 2.2 La Geometría de las Retículas (Lattices)

Aunque Kyber es "basado en retículas", opera en una versión algebraica estructurada. Conceptualmente:

Una retícula es un patrón periódico de puntos en el espacio. En Kyber, los puntos válidos del mensaje forman una subretícula dentro de Rq^k.

**Decisión de modelado**: Representar el espacio de mensajes como una retícula 3D visible (red de puntos), donde el cifrado desplaza el punto del mensaje a una región "difusa" del espacio, y el descifrado lo "proyecta" de vuelta al punto reticular más cercano.

**Justificación**: Esta visualización captura el mecanismo de redondeo/decodificación que permite recuperar el mensaje: la clave secreta permite identificar qué punto de la retícula estaba originalmente cerca del punto cifrado.

---

## 3. ANÁLISIS DE LOS FLUJOS ALGORÍTMICOS

### 3.1 KeyGen (Generación de Claves)

```
1. Generar matriz A ← Sample(Rq^{k×k})
2. Generar secreto s ← Sample_small(Rq^k)
3. Generar error e ← Sample_small(Rq^k)
4. Calcular t = A·s + e
5. pk = (A, t)  // Clave pública
6. sk = s       // Clave secreta
```

**Decisión de modelado**:
- **Fase 1**: Una cuadrícula de toros (A) emerge del vacío con valores aleatorios parpadeando
- **Fase 2-3**: Torres de toros pequeños (s, e) cristalizan con distribución visible concentrada cerca del centro
- **Fase 4**: Animación de multiplicación matriz-vector donde hilos de luz conectan cada fila de A con s, produciendo resultados que se suman con e para formar t
- **Fase 5**: División visual: (A, t) se desplazan hacia un lado etiquetado "PÚBLICO", s permanece aislado etiquetado "SECRETO"

**Justificación**: Esta secuencia sigue el orden algorítmico exacto, permitiendo al observador comprender la construcción progresiva y la separación crítica público/privado.

### 3.2 Encaps (Encapsulamiento)

```
1. Generar mensaje aleatorio m ← {0,1}^256
2. Generar (r, e₁, e₂) desde hash de m
3. Calcular u = Aᵀ·r + e₁
4. Calcular v = tᵀ·r + e₂ + Decompress(m)
5. c = (u, v)  // Ciphertext
6. K = Hash(m) // Clave compartida
```

**Decisión de modelado**:
- **Mensaje m**: Una esfera binaria con 256 bits visibles como puntos on/off
- **Vectores efímeros (r, e₁, e₂)**: Torres de toros pequeños, distinguidos por color (ej: azul para r, cian para e₁, e₂)
- **Operaciones Aᵀ·r**: La matriz A rota 90° (transpuesta visual), luego hilos conectan columnas con r
- **Decompress(m)**: La esfera binaria se "expande" en un toro con coeficientes 0 o q/2
- **Cifrado (u, v)**: Los resultados se encapsulan en una esfera brillante etiquetada "CIPHERTEXT"

**Justificación**: El encapsulamiento introduce nuevos elementos aleatorios para cada operación. Diferenciarlos por color permite seguir cada componente a través del flujo.

### 3.3 Decaps (Decapsulamiento)

```
1. Calcular m' = v - sᵀ·u
2. Comprimir m' para recuperar m
3. Recalcular (r', e₁', e₂') desde m
4. Verificar que u = Aᵀ·r' + e₁' y v corresponde
5. Si válido: K = Hash(m), sino: K = Hash(z) con z secreto
```

**Decisión de modelado**:
- **Paso 1**: La torre secreta s se conecta con u mediante hilos, produciendo sᵀ·u, que se resta de v (animación de sustracción como "cancelación de ondas")
- **Paso 2**: El resultado ruidoso se "proyecta" hacia los puntos de la retícula, resaltando el punto más cercano como m recuperado
- **Verificación**: Haces de validación recorren el cifrado recalculado vs. original, mostrando coincidencia (verde) o fallo (rojo)
- **Clave final K**: El hash se visualiza como un túnel de transformación del que emerge la clave compartida

**Justificación**: El decapsulamiento revela por qué el secreto s permite deshacer el cifrado: sᵀ·(Aᵀ·r) = rᵀ·(A·s) ≈ rᵀ·t (con error cancelable), dejando sólo el mensaje enmascarado.

---

## 4. DECISIONES DE REPRESENTACIÓN ESPACIAL 3D

### 4.1 Jerarquía de Escalas

Para mantener claridad visual mientras se respeta la complejidad matemática:

| Entidad | Escala Relativa | Justificación |
|---------|-----------------|---------------|
| Coeficiente individual | 1 unidad | Átomo base del sistema |
| Polinomio (256 coef) | 50 unidades (toro) | Contiene 256 elementos en estructura cíclica |
| Vector (k polinomios) | 150 unidades | k toros apilados con separación |
| Matriz (k² polinomios) | 500 unidades | Cuadrícula k×k de toros |
| Sistema completo | 1500+ unidades | Incluye flujos y transformaciones |

### 4.2 Paleta de Colores con Significado Semántico

| Elemento | Color | Código Hex | Justificación |
|----------|-------|------------|---------------|
| Matriz pública A | Plateado metálico | #C0C0C0 | Neutral, compartido públicamente |
| Secreto s | Rojo profundo | #8B0000 | Crítico, privado, peligro si se expone |
| Errores e, e₁, e₂ | Violeta translúcido | #9400D380 | Ruido, interferencia cuántica |
| Vector r (efímero) | Azul eléctrico | #00BFFF | Aleatorio fresco, temporal |
| Vector público t | Oro | #FFD700 | Derivado valioso del secreto |
| Ciphertext (u, v) | Verde esmeralda | #50C878 | Resultado protegido, datos cifrados |
| Mensaje m | Blanco brillante | #FFFFFF | Información pura original |
| Clave K | Arcoíris/Holográfico | Gradiente | Resultado final, síntesis de todo |

**Justificación**: Los colores comunican inmediatamente el rol y sensibilidad de cada componente sin necesidad de etiquetas textuales constantes.

### 4.3 Representación de Operaciones como Animaciones

#### 4.3.1 Multiplicación de Polinomios (NTT-based)

**Secuencia de 3 fases**:
1. **Forward NTT**: El toro se desenrolla en línea, partículas se reorganizan según patrón de mariposa
2. **Multiplicación puntual**: Elementos correspondientes de dos líneas se fusionan con flash
3. **Inverse NTT**: La línea se re-enrolla en forma toroidal

**Duración sugerida**: 3-5 segundos por multiplicación completa

#### 4.3.2 Producto Matriz-Vector

**Representación**:
- Cada fila de la matriz proyecta "rayos" hacia cada componente del vector
- Los rayos se transforman en el resultado del producto interno
- Los resultados de cada fila convergen verticalmente formando el vector resultado

**Duración sugerida**: 5-8 segundos para k=3

#### 4.3.3 Adición de Error

**Representación**:
- Nube de partículas violetas (distribución binomial) envuelve el vector resultado
- Las partículas se absorben, perturbando levemente la posición de cada coeficiente
- Visualización "antes/después" mostrando el desplazamiento menor

### 4.4 Uso del Espacio 3D

**Ejes semánticos**:
- **Eje X (horizontal)**: Flujo temporal/algorítmico (izquierda=inicio, derecha=fin)
- **Eje Y (vertical)**: Jerarquía de componentes (bajo=primitivos, alto=compuestos)
- **Eje Z (profundidad)**: Separación público/privado (frente=público, atrás=privado)

**Justificación**: Esta asignación semántica permite que la posición espacial comunique información sobre el estado y naturaleza de cada elemento sin anotaciones adicionales.

---

## 5. ANÁLISIS DE ASPECTOS TÉCNICOS ADICIONALES

### 5.1 Compresión y Descompresión

Kyber utiliza compresión con pérdida para reducir el tamaño del cifrado:

```
Compress_d(x) = ⌈(2^d / q) · x⌋ mod 2^d
Decompress_d(x) = ⌈(q / 2^d) · x⌋
```

**Decisión de modelado**: Visualizar como un "embudo cuantizador" donde el toro de entrada (coeficientes en {0,...,q-1}) pasa por una rejilla de discretización que reduce la precisión a 2^d niveles, representados como bandas de color en el toro resultante.

**Justificación**: La compresión introduce la pérdida recuperable que hace al sistema funcionar. El embudo comunica visualmente la reducción de información.

### 5.2 Distribución Binomial Centrada (CBD)

Los coeficientes pequeños se muestrean de CBD_η:
```
CBD_η: Σᵢ(aᵢ - bᵢ) donde aᵢ,bᵢ ← {0,1}
```

Para η=2: rango {-2, -1, 0, 1, 2} con distribución (1, 4, 6, 4, 1)/16

**Decisión de modelado**: Al generar s o e, mostrar una "ruleta de probabilidad" 3D donde sectores de diferentes tamaños (proporcionales a probabilidades) giran y se detienen, emitiendo el coeficiente seleccionado hacia el toro en construcción.

**Justificación**: Hace explícita la naturaleza probabilística y la concentración alrededor del cero que es crítica para la seguridad.

### 5.3 Funciones Hash (G, H, J)

Kyber utiliza:
- **G = SHA3-512**: Para derivar randomness
- **H = SHA3-256**: Para hash de mensajes
- **J = SHAKE-256**: Para generación pseudoaleatoria

**Decisión de modelado**: Representar cada hash como un "túnel de transformación" caótico donde la entrada (bloque de datos) se fragmenta, reorganiza en patrón aparentemente aleatorio, y emerge como salida compactada. Diferentes colores de túnel para cada función.

**Justificación**: Los hashes son cajas negras funcionalmente, pero su rol transformador es esencial. El túnel caótico comunica la irreversibilidad y mezcla de información.

### 5.4 Encapsulamiento con Transformada de Fujisaki-Okamoto

Kyber-KEM incluye la transformación FO que convierte seguridad CPA en CCA:

```
Durante Encaps: La randomness r se deriva del mensaje m
Durante Decaps: Se reencripta y verifica antes de aceptar
```

**Decisión de modelado**: Mostrar el circuito de "verificación circular" donde:
1. El mensaje recuperado m' se usa para regenerar r'
2. Se recalcula el cifrado esperado (u', v')
3. Comparación visual con el cifrado recibido (u, v)
4. Indicador verde/rojo de validación

**Justificación**: Esta protección contra ataques activos es distintiva de Kyber-KEM. Visualizarla destaca la robustez del esquema.

---

## 6. CONSIDERACIONES DE REALISMO VISUAL

### 6.1 Materiales y Texturas

| Componente | Material Sugerido | Propiedades |
|------------|-------------------|-------------|
| Toros (polinomios) | Vidrio iridiscente | Transparencia 70%, refracción 1.3 |
| Coeficientes | Esferas metálicas | Reflectividad alta, tamaño proporcional al valor |
| Conexiones | Rayos de luz | Bloom, intensidad proporcional a magnitud |
| Fondo | Vacío espacial | Gradiente negro-azul oscuro, partículas flotantes tenues |
| Matrices | Estructura cristalina | Aristas visibles, superficie semi-transparente |

### 6.2 Iluminación

- **Luz ambiente**: Muy baja (10%), para mantener misterio y enfoque
- **Luces puntuales**: En cada operación activa, iluminando la zona de trabajo
- **Emisión propia**: Cada elemento matemático emite luz proporcional a su "actividad" o importancia actual
- **Sombras suaves**: Para dar profundidad sin oscurecer detalles

### 6.3 Animaciones Físicamente Plausibles

Aunque son entidades matemáticas abstractas, aplicar física suave para naturalidad:
- **Inercia leve**: Los elementos no aparecen/desaparecen instantáneamente
- **Elasticidad**: Los toros se deforman ligeramente durante transformaciones
- **Partículas residuales**: Operaciones dejan "estelas" temporales
- **Sonido sincronizado**: (Si aplica) Tonos para operaciones matemáticas

---

# PARTE II: ESPECIFICACIÓN FINAL DE LA ESCENA 3D

---

## ESPECIFICACIÓN CONCISA PARA MODELADORES 3D

### A. ENTIDADES PRIMARIAS A MODELAR

#### A.1 Toro Polinomial (Unidad Base)
```
Geometría:    Torus (R_mayor=25u, R_menor=8u)
Subdivisiones: 256 segmentos mayores × 32 segmentos menores
Marcadores:   256 esferas posicionadas en el círculo mayor
Tamaño esfera: Radio proporcional a coef/q (0.5u - 3u)
Etiquetas:    Índice 0-255 visible en modo detalle
```

#### A.2 Vector Polinomial (Torre de k Toros)
```
Composición:  k toros apilados verticalmente
Separación:   20u entre centros de toros consecutivos
Conectores:   Cilindros luminosos (r=1u) entre centros
Base:         Plataforma hexagonal (30u radio)
Etiqueta:     Nombre del vector (s, e, t, etc.) flotante
```

#### A.3 Matriz Polinomial (Cuadrícula k×k)
```
Disposición:  k×k toros en plano XZ
Espaciado:    60u entre centros (ambas direcciones)
Marco:        Estructura de alambre conectando esquinas
Etiquetas:    Índices (i,j) en cada posición
Separadores:  Líneas de fila/columna semi-transparentes
```

#### A.4 Esfera de Mensaje (256 bits)
```
Geometría:    Icosaedro subdividido (aprox. 256 vértices)
Bits:         Puntos emisivos en vértices (ON=blanco, OFF=gris)
Radio:        15u
Animación:    Rotación lenta (5°/s) en eje Y
```

#### A.5 Cápsula de Cifrado
```
Geometría:    Esfera exterior (r=40u) + contenido interno
Interior:     Vector u (torre) + escalar v (toro solo)
Material:     Vidrio verde translúcido (alfa=0.4)
Efecto:       Partículas internas en suspensión
```

### B. ESCENAS PRINCIPALES (3 ACTOS)

#### ACTO 1: KEYGEN (Generación de Claves)
```
Duración estimada: 15-20 segundos

ESCENA 1.1 - Génesis de A (0-4s):
  - Cuadrícula 3×3 de toros emerge del vacío central
  - Coeficientes parpadean con valores aleatorios
  - Estabilización: valores fijos, brillo constante
  - Color final: Plateado (#C0C0C0)

ESCENA 1.2 - Cristalización de s y e (4-8s):
  - Paralelo a la matriz A (lado derecho)
  - Ruleta de probabilidad CBD gira para cada coeficiente
  - Valores pequeños (-2 a +2) visibles
  - s: Rojo profundo, e: Violeta translúcido

ESCENA 1.3 - Cálculo de t = As + e (8-14s):
  - Rayos desde cada fila de A hacia componentes de s
  - Productos parciales convergen en puntos intermedios
  - Suma de error: nube violeta envuelve resultado
  - t emerge con color dorado

ESCENA 1.4 - Separación de claves (14-20s):
  - A y t se desplazan hacia zona "PÚBLICO" (frente, iluminado)
  - s se retrae hacia zona "SECRETO" (fondo, penumbra)
  - Barrera visual entre zonas
  - Etiquetas: "pk = (A, t)" y "sk = s"
```

#### ACTO 2: ENCAPS (Encapsulamiento)
```
Duración estimada: 20-25 segundos

ESCENA 2.1 - Generación de mensaje m (0-3s):
  - Esfera binaria aparece en zona neutral superior
  - 256 bits se iluminan aleatoriamente
  - Hash G visible como túnel que procesa m
  - Salida: vectores r, e₁, e₂ (colores distintos)

ESCENA 2.2 - Cálculo de u = Aᵀr + e₁ (3-10s):
  - Matriz A rota 90° (transposición visual)
  - Rayos desde columnas hacia r
  - Resultado preliminar + error e₁
  - u emerge en azul-verde

ESCENA 2.3 - Cálculo de v = tᵀr + e₂ + encode(m) (10-18s):
  - Vector t proyecta hacia r
  - Producto escalar visualizado como convergencia
  - Mensaje m pasa por "expansor" (q/2 para bits=1)
  - v emerge como toro individual

ESCENA 2.4 - Encapsulamiento final (18-25s):
  - u y v entran en esfera de cifrado verde
  - Cápsula se cierra con efecto de sellado
  - Hash H procesa m → K (clave compartida)
  - K emerge como esfera iridiscente/holográfica
  - Cápsula de cifrado se desplaza hacia receptor
```

#### ACTO 3: DECAPS (Decapsulamiento)
```
Duración estimada: 20-25 segundos

ESCENA 3.1 - Recepción y apertura (0-4s):
  - Cápsula verde llega a zona del receptor
  - Se abre revelando u y v
  - Secreto s emerge de la penumbra

ESCENA 3.2 - Cálculo de sᵀu (4-10s):
  - Rayos rojos desde s hacia componentes de u
  - Producto visualizado como convergencia
  - Resultado es un toro intermedio

ESCENA 3.3 - Recuperación v - sᵀu ≈ encode(m) (10-15s):
  - Resta visualizada como "cancelación de ondas"
  - El ruido residual se muestra como perturbación menor
  - Decodificación: "proyección a retícula"
  - Puntos cercanos a 0 → bit 0
  - Puntos cercanos a q/2 → bit 1
  - Esfera de mensaje m' aparece (match con m original)

ESCENA 3.4 - Verificación FO (15-22s):
  - m' genera (r', e₁', e₂') vía hash
  - Re-cifrado rápido en miniatura
  - Comparación lado a lado: (u,v) vs (u',v')
  - Indicadores verdes de coincidencia
  - Si falla: rayos rojos, K alternativa

ESCENA 3.5 - Derivación de K (22-25s):
  - Hash H procesa m → K
  - Misma esfera holográfica que en emisor
  - Ambas K (emisor y receptor) se muestran idénticas
  - Texto: "Clave compartida establecida"
```

### C. ESPECIFICACIONES TÉCNICAS DE CÁMARA

```
VISTA PRINCIPAL:
  Posición inicial: (0, 200, 400)
  Orientación: Mirando hacia (0, 50, 0)
  FOV: 45°

TRANSICIONES:
  - Dolly suave entre actos (3s)
  - Orbita 180° durante operaciones matriciales
  - Zoom a detalle durante generación de coeficientes
  - Plano cenital para vista de flujo completo

PROFUNDIDAD DE CAMPO:
  - f/2.8 equivalente para enfoque selectivo
  - Bokeh hexagonal para luces desenfocadas
```

### D. INVENTARIO DE OBJETOS

| ID | Nombre | Cantidad | Instancias |
|----|--------|----------|------------|
| OBJ-01 | Toro polinomial | 9+3+3+3+1+1 = 20 | A(9), s(3), e(3), t(3), v(1), encodedM(1) |
| OBJ-02 | Esfera coeficiente | 256 × 20 = 5120 | Distribuidos en toros |
| OBJ-03 | Esfera mensaje | 2 | m (emisor), m' (receptor) |
| OBJ-04 | Cápsula cifrado | 1 | Contiene u, v |
| OBJ-05 | Esfera clave K | 2 | K emisor, K receptor |
| OBJ-06 | Túnel hash | 3 | G, H, J |
| OBJ-07 | Ruleta CBD | 1 | Para animación de muestreo |
| OBJ-08 | Rayo de conexión | ~100 | Para operaciones (dinámicos) |
| OBJ-09 | Plataforma base | 4 | Para pk, sk, mensaje, cifrado |

### E. SISTEMA DE PARTÍCULAS

```
PARTÍCULAS DE ERROR:
  Tipo: Sprites violetas translúcidos
  Cantidad: 500-1000 durante adición de error
  Comportamiento: Movimiento browniano → absorción gradual
  Duración: 2s

PARTÍCULAS DE HASH:
  Tipo: Fragmentos brillantes multicolor
  Cantidad: 200 dentro del túnel
  Comportamiento: Flujo turbulento
  Duración: Mientras hash activo

PARTÍCULAS AMBIENTALES:
  Tipo: Polvo estelar tenue
  Cantidad: 2000 en toda la escena
  Comportamiento: Deriva lenta
  Duración: Permanente
```

### F. MAPA DE COLORES DEFINITIVO

```css
/* Variables de color para la escena */
--matriz-A: #C0C0C0;           /* Plateado - Público, neutral */
--secreto-s: #8B0000;          /* Rojo sangre - Privado, crítico */
--error-e: rgba(148,0,211,0.5); /* Violeta 50% - Ruido cuántico */
--efimero-r: #00BFFF;          /* Azul eléctrico - Temporal */
--vector-t: #FFD700;           /* Dorado - Derivado valioso */
--cifrado-uv: #50C878;         /* Esmeralda - Protegido */
--mensaje-m: #FFFFFF;          /* Blanco - Información pura */
--clave-K: holographic;        /* Iridiscente - Secreto final */
--fondo: linear-gradient(#000011, #001133);
--rayos-op: #FFE4B5;           /* Melocotón - Operaciones */
--exito: #00FF00;              /* Verde brillante - Verificación OK */
--fallo: #FF0000;              /* Rojo brillante - Verificación fallida */
```

### G. ANOTACIONES TEXTUALES EN ESCENA

```
ETIQUETAS PERMANENTES:
  - "CRYSTALS-Kyber-768" (título superior)
  - "PÚBLICO" / "PRIVADO" (zonas)
  - "pk = (A, t)" / "sk = s" (claves)

ETIQUETAS TEMPORALES (aparecen durante operaciones):
  - "Rq = Zq[X]/(X²⁵⁶+1), q=3329"
  - "Distribución CBD_η, η=2"
  - "t = A·s + e"
  - "u = Aᵀ·r + e₁"
  - "v = tᵀ·r + e₂ + encode(m)"
  - "m' = decode(v - sᵀ·u)"

FUENTE: Monoespaciada técnica (Fira Code, JetBrains Mono)
TAMAÑO: Escalado según distancia de cámara
```

### H. RESUMEN EJECUTIVO PARA PRODUCCIÓN

**Concepto central**: Representar CRYSTALS-Kyber como una coreografía espacial donde estructuras toroidales (polinomios en anillos cíclicos) interactúan mediante rayos de luz (operaciones algebraicas) para transformar información en tres fases: génesis de claves, encapsulamiento del secreto, y recuperación verificada.

**Fidelidad matemática**: Cada elemento visual corresponde 1:1 con entidades del algoritmo. Los toros reflejan la estructura de anillo cociente Rq, las 256 posiciones representan coeficientes polinomiales, y las operaciones (multiplicación, suma, hash) tienen representaciones animadas que siguen el flujo algorítmico exacto.

**Prioridades de producción**:
1. Legibilidad de estructuras (toros claramente diferenciados)
2. Claridad del flujo (dirección temporal inequívoca)
3. Distinción público/privado (separación espacial y cromática)
4. Fidelidad de operaciones (animaciones matemáticamente correctas)
5. Estética cohesiva (paleta unificada, materiales consistentes)

**Resolución recomendada**: 4K (3840×2160) para detalle en zoom
**Frame rate**: 60fps para animaciones fluidas
**Duración total estimada**: 60-70 segundos para ciclo completo

---

*Documento preparado para equipo de modelado 3D.*
*Cualquier desviación del esquema debe justificarse matemáticamente.*
