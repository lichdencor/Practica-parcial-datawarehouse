# Frontend — App de Parcial DBS2

Single Page Application en React + TypeScript + Vite. Sirve los 10 puntos del modelo de parcial en formato interactivo: múltiple choice, diagramas SVG de esquemas DWH y un SQL shell con validación de sintaxis.

En producción (Docker) es compilada por Vite y servida como archivos estáticos desde nginx.

---

## Stack

| Herramienta | Versión | Rol |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 5 | Dev server + bundler |
| Tailwind CSS | 3 | Estilos utility-first |
| nginx | alpine | Servidor de archivos estáticos (solo Docker) |

Sin librerías de estado global (no Redux, no Zustand). Todo el estado vive en `useState` local o en el hook `useAuth` de `App.tsx`.

---

## Estructura de archivos

```
frontend/
├── src/
│   ├── App.tsx                     ← Raíz de la app: auth hook + routing de secciones
│   ├── vite-env.d.ts               ← Tipos de import.meta.env
│   ├── index.css                   ← @tailwind directives + utilidades base
│   │
│   ├── data/
│   │   └── questions.ts            ← ÚNICA fuente de verdad del contenido del parcial
│   │
│   └── components/
│       ├── Header.tsx              ← Barra superior con usuario y logout
│       ├── Login.tsx               ← Pantalla de bienvenida / SSO
│       ├── MultipleChoiceSection.tsx ← Preguntas de opción múltiple (puntos 1–6)
│       ├── DwhDiagram.tsx          ← Diagrama SVG de esquema DWH (puntos 7 y 9)
│       └── SqlShell.tsx            ← Editor SQL + validador de sintaxis (puntos 8 y 10)
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── Dockerfile
├── nginx.conf
└── .dockerignore
```

---

## Autenticación (`App.tsx → useAuth`)

```typescript
const TOKEN_KEY = 'parcial_dbs2_token'     // sessionStorage key
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL
```

El hook `useAuth` maneja tres casos en el `useEffect` inicial:

1. **`?token=JWT` en la URL** — viene del gateway post-login. Lo guarda en `sessionStorage` y limpia la URL con `history.replaceState`.
2. **`?auth_error=...` en la URL** — Dex rechazó la autenticación. Muestra el error en la pantalla de Login.
3. **`?logout=true` en la URL** — limpia el token y muestra Login.

Luego llama a `GET /api/me` con `Authorization: Bearer <token>`. Si el token es válido, guarda el usuario en estado y renderiza el examen. Si falla, limpia el token y vuelve a Login.

**El token vive en `sessionStorage`**: se borra al cerrar la pestaña. No persiste entre sesiones del browser.

---

## Fuente de datos (`src/data/questions.ts`)

**Este es el único archivo a editar para cambiar el contenido del parcial.**

Define un array `examSections: ExamSection[]`. Cada sección tiene un `type` que determina qué componente la renderiza:

### Tipo `multiple-choice`

```typescript
{
  id: 1,
  title: 'Punto 1',
  subtitle: 'Diferencia entre OLAP y OLTP',
  type: 'multiple-choice',
  theory: `...texto con **negritas** soportadas...`,
  questions: [
    {
      id: 'q1a',
      text: '¿Pregunta?',
      choices: [
        { id: 'a', text: 'Opción A', correct: false },
        { id: 'b', text: 'Opción correcta', correct: true },
        // ...
      ],
      explanation: 'Por qué B es correcta...',
    },
    // ...
  ],
}
```

Solo una opción puede ser `correct: true`. La explicación se muestra después de responder.

### Tipo `dwh-diagram`

```typescript
{
  id: 7,
  type: 'dwh-diagram',
  diagram: {
    title: '...',
    description: '...',
    tables: [
      {
        name: 'FACT_VENTA_FACTURA',
        type: 'fact',                  // 'fact' | 'dimension' | 'dimension2'
        columns: [
          { name: 'id_venta',      role: 'pk' },      // 'pk' | 'fk' | 'measure' | undefined
          { name: 'id_producto',   role: 'fk' },
          { name: 'total_ventas',  role: 'measure' },
          { name: 'nro_factura' },                    // sin role = atributo normal
        ],
        x: 390,   // posición SVG en píxeles
        y: 250,
      },
      // ...
    ],
    connections: [
      { from: 'FACT_VENTA_FACTURA', to: 'Dim_Producto' },
      // ...
    ],
  },
}
```

Las coordenadas `x, y` son absolutas dentro del SVG. El componente calcula automáticamente el `viewBox` basándose en las posiciones de todas las tablas.

### Tipo `sql-shell`

```typescript
{
  id: 8,
  type: 'sql-shell',
  theory: 'Descripción general de la sección...',
  sqlExercises: [
    {
      id: 'p8m1',
      metric: 'Métrica 1: Ventas totales por categoría y marca',
      description: 'Instrucción detallada de qué calcular...',
      dimensions: ['Dim_Categoria', 'Dim_Marca', 'Dim_Producto'],   // chips informativos
      hint: 'Pista para el estudiante...',
      referenceQuery: `SELECT c.nombre_cat, SUM(vf.total_ventas)...`,
    },
    // ...
  ],
}
```

---

## Componentes

### `MultipleChoiceSection.tsx`

Renderiza el bloque de teoría (con parsing de `**negrita**`) y luego una `QuestionCard` por pregunta.

`QuestionCard` maneja su propio estado local:
- `selected: string | null` — ID de la opción elegida
- `showExplanation: boolean` — muestra la explicación post-respuesta

Una vez respondida, la tarjeta es inmutable (no se puede cambiar la respuesta).

### `DwhDiagram.tsx`

Renderiza un SVG puro (sin librerías externas). Funciones clave:

```typescript
tableHeight(t: DwhTable) → number
// HEADER_HEIGHT (30) + columns.length * ROW_HEIGHT (22) + PAD (8)

tableCenter(t: DwhTable) → [number, number]
// centro del rectángulo, usado para los endpoints de las líneas
```

Las conexiones son líneas (`<line>`) con `strokeDasharray` y un marcador de flecha (`<marker>`). Los colores por `type`:
- `fact` → `#1a365d` (azul muy oscuro)
- `dimension` → `#2b6cb0` (azul medio)
- `dimension2` → `#5a7fa8` (azul claro, para dimensiones de segundo nivel en snowflake)

El `viewBox` se calcula dinámicamente con `Math.min/max` sobre todas las posiciones, más un padding de 20px.

### `SqlShell.tsx`

Cada `ExerciseShell` tiene su propio estado: `sql` (contenido del textarea), `result` (resultado de validación), `showRef` (visibilidad de la respuesta de referencia).

La función `checkSql(sql: string): SqlResult` aplica estas reglas en orden:

| Regla | Tipo |
|---|---|
| Query vacía | Error |
| No empieza con keyword SQL válida | Error |
| Paréntesis desbalanceados | Error |
| `SELECT` sin `FROM` | Error |
| Más `JOIN` que cláusulas `ON` | Error |
| `GROUP BY` sin función de agregación | Warning |
| `ORDER BY` sin `SELECT` | Error |
| No termina en `;` | Warning |

No hay ejecución real. La validación es puramente léxica/estructural con regex.

---

## Variables de entorno

| Variable | Cuándo se aplica | Descripción |
|---|---|---|
| `VITE_GATEWAY_URL` | Build time | URL del gateway. Baked en el bundle. Default: `http://localhost:3001` |

Se inyecta como Docker build arg en el `Dockerfile`:
```dockerfile
ARG VITE_GATEWAY_URL=http://localhost:3001
ENV VITE_GATEWAY_URL=$VITE_GATEWAY_URL
RUN npm run build
```

---

## Desarrollo local

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

El proxy de Vite reenvía `/login`, `/logout`, `/callback`, `/api` al gateway en `localhost:3001`:

```typescript
// vite.config.ts
proxy: {
  '/api':      'http://localhost:3001',
  '/login':    'http://localhost:3001',
  '/logout':   'http://localhost:3001',
  '/callback': 'http://localhost:3001',
}
```

Esto permite que el browser haga todas las peticiones a `:5173` y Vite las proxea, evitando CORS durante el desarrollo.

---

## Build de producción

```bash
npm run build   # tsc + vite build → dist/
```

Genera en `dist/`:
- `index.html` (~0.7 KB)
- `assets/index-*.css` (Tailwind purgado, ~17 KB)
- `assets/index-*.js` (React + app, ~185 KB, ~58 KB gzip)

El nginx sirve `dist/` con un fallback a `index.html` para el enrutamiento SPA:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## Colores del tema

Definidos en `tailwind.config.js` como `colors.ub.*`:

| Token | Hex | Uso |
|---|---|---|
| `ub-dark` | `#1a365d` | Headers, botones primarios, fact tables |
| `ub-mid` | `#2b6cb0` | Hover states, accents, dimension tables |
| `ub-light` | `#4299e1` | Highlights, bordes activos |
| `ub-pale` | `#ebf8ff` | Fondos suaves, texto secundario sobre oscuro |

---

## Cómo agregar una nueva sección al parcial

1. Abrir `src/data/questions.ts`
2. Agregar un objeto al array `examSections` con el `id` siguiente en secuencia
3. Elegir el `type` correcto y completar los campos correspondientes
4. No es necesario cambiar ningún componente — `App.tsx` renderiza las secciones dinámicamente según el `type`

```typescript
// Ejemplo: agregar punto 11 de opción múltiple
{
  id: 11,
  title: 'Punto 11',
  subtitle: 'Nuevo tema',
  type: 'multiple-choice',
  theory: `Texto explicativo...`,
  questions: [/* ... */],
},
```
