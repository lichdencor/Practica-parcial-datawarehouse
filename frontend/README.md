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
| React Router | 6 | Enrutamiento SPA |
| nginx | alpine | Servidor de archivos estáticos (solo Docker) |

Sin librerías de estado global (no Redux, no Zustand). El estado se maneja con `useState` local y los tres contextos de `App.tsx`.

---

## Estructura de archivos

```
frontend/src/
├── App.tsx                        ← Raíz: auth hook + tres contextos (User, Progress, Content)
├── AppRouter.tsx                  ← Rutas SPA, protege /admin con AdminRoute
├── vite-env.d.ts
├── index.css
│
├── data/
│   ├── questions.ts               ← Banco de preguntas del parcial (tipo ExamSection[])
│   ├── theory.ts                  ← Conceptos teóricos (tipo ConceptCategory[])
│   └── practice_quick.ts          ← Ejercicios de práctica rápida (tipo QuickPractice[])
│
├── components/
│   ├── Header.tsx                 ← Barra superior: usuario, badge ADM, progreso, logout
│   ├── Navbar.tsx                 ← Navegación: links + link Admin (solo admins)
│   ├── Login.tsx                  ← Pantalla de bienvenida / SSO
│   ├── MultipleChoiceSection.tsx  ← Preguntas de opción múltiple (puntos 1–6)
│   ├── DwhDiagram.tsx             ← Diagrama SVG de esquema DWH (puntos 7 y 9)
│   └── SqlShell.tsx               ← Editor SQL + validador de sintaxis (puntos 8 y 10)
│
└── pages/
    ├── Conceptos.tsx              ← /conceptos — cards de teoría por categoría y subgrupo
    ├── Practica.tsx               ← /practica  — identificación Fact vs Dimension
    ├── Ejercicios.tsx             ← /ejercicios — grid de acceso directo a cada punto
    ├── Integrador.tsx             ← /integrador — simulacro completo del parcial
    └── Admin.tsx                  ← /admin      — panel de roles y editor de contenido (solo admins)
```

---

## Contextos (`App.tsx`)

`App.tsx` exporta tres contextos que proveen estado global a todos los componentes hijos.

### `UserContext`

```typescript
export const UserContext = createContext<{
  user: User         // { sub, email, name, role }
  isAdmin: boolean   // user.role === 'admin'
  logout: () => void
}>()
```

Disponible en cualquier componente dentro del árbol autenticado. Usado por `Navbar` (mostrar link Admin), `Header` (badge ADM), `AppRouter` (proteger `/admin`), y `Admin.tsx`.

### `ProgressContext`

```typescript
export const ProgressContext = createContext<{
  progress: Record<string, any>
  saveProgress: (key: string, value: any) => void
  loading: boolean
}>()
```

El progreso se carga de MongoDB al iniciar sesión y se sincroniza con cada respuesta. Usado por `MultipleChoiceSection`, `Practica`, y `Header` (barra de progreso).

### `ContentContext`

```typescript
export const ContentContext = createContext<{
  questions:     typeof examSections       // ExamSection[]
  theory:        typeof theoryConcepts     // ConceptCategory[]
  quickPractice: typeof quickPracticeData  // QuickPractice[]
  saveContent:   (type, data) => Promise<void>
}>()
```

Al montar, `ContentProvider` fetchea los tres tipos de contenido desde `GET /api/content/:type`. Si MongoDB tiene datos para un tipo (editados via panel admin), los usa; si no, usa los datos estáticos del bundle (fallback transparente).

`saveContent` llama a `PUT /api/admin/content/:type` y actualiza el estado local inmediatamente.

---

## Autenticación (`useAuth`)

```typescript
const TOKEN_KEY = 'parcial_dbs2_token'     // sessionStorage key
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL
```

El hook `useAuth` maneja tres casos al montar:

1. **`?token=JWT` en la URL** — viene del gateway post-login. Guarda en `sessionStorage`, limpia la URL.
2. **`?auth_error=...`** — Dex rechazó la auth. Muestra el error en Login.
3. **`?logout=true`** — limpia token, muestra Login.

Luego llama a `GET /api/me` con `Authorization: Bearer <token>`. La respuesta incluye `role`, que se propaga al `UserContext`.

El token vive en `sessionStorage`: se borra al cerrar la pestaña.

---

## Archivos de datos

### `src/data/questions.ts` — Preguntas del parcial

Array `examSections: ExamSection[]`. Cada sección tiene un `type` que determina el componente:

**`multiple-choice`**
```typescript
{
  id: 1,
  title: 'Punto 1',
  subtitle: 'Diferencia entre OLAP y OLTP',
  type: 'multiple-choice',
  theory: `...texto con **negritas**...`,
  questions: [
    {
      id: 'q1a',
      text: '¿Pregunta?',
      choices: [
        { id: 'a', text: 'Opción A', correct: false },
        { id: 'b', text: 'Opción correcta', correct: true },
      ],
      explanation: 'Por qué B es correcta...',
    },
  ],
}
```

**`dwh-diagram`**
```typescript
{
  id: 7,
  type: 'dwh-diagram',
  diagram: {
    tables: [
      { name: 'FACT_VENTA', type: 'fact', columns: [...], x: 390, y: 250 },
    ],
    connections: [{ from: 'FACT_VENTA', to: 'Dim_Producto' }],
  },
}
```

**`sql-shell`**
```typescript
{
  id: 8,
  type: 'sql-shell',
  sqlExercises: [
    {
      id: 'p8m1',
      metric: 'Métrica 1: ...',
      description: '...',
      hint: '...',
      referenceQuery: `SELECT ...`,
    },
  ],
}
```

### `src/data/theory.ts` — Conceptos teóricos

Estructura jerárquica `ConceptCategory[]`. Cada categoría puede tener conceptos planos o subgrupos:

```typescript
// Categoría sin subgrupos (lista plana)
{ category: 'Fundamental', concepts: [{ id, title, content }] }

// Categoría con subgrupos
{
  category: 'Modeling',
  subgroups: [
    { name: 'Hechos y Dimensiones', concepts: [...] },
    { name: 'Dimensiones',          concepts: [...] },
    { name: 'Esquemas',             concepts: [...] },
  ]
}
```

El componente `Conceptos.tsx` renderiza la jerarquía tal como está definida en el JSON — para reorganizar, se mueven bloques, no se cambian tags en items individuales.

### `src/data/practice_quick.ts` — Práctica rápida

Array `QuickPractice[]`: cada item tiene `tableName`, `columns`, `correctType` ('fact' | 'dimension') y `explanation`.

---

## Panel de administración (`/admin`)

Solo accesible para usuarios con `role === 'admin'`. `AppRouter` redirige a `/integrador` si el usuario no es admin.

### Tab Usuarios
- Lista todos los usuarios registrados en MongoDB con su rol actual.
- Botón para promover/demotar entre `student` y `admin`.
- No puede demotar super-admins (definidos en `ADMIN_EMAILS` en el gateway).

### Tab Contenido
- Editor JSON (textarea monospace) para cada tipo de contenido: `questions`, `theory`, `quickPractice`.
- Al guardar, el JSON se valida en el browser y se persiste en MongoDB via `PUT /api/admin/content/:type`.
- El cambio aplica para todos los usuarios en el próximo load de la página.
- Para restaurar el contenido original, pegar el JSON del archivo `src/data/*.ts` correspondiente.

---

## Componentes

### `MultipleChoiceSection.tsx`

Renderiza el bloque de teoría (con parsing de `**negrita**`) y una `QuestionCard` por pregunta. Una vez respondida, la tarjeta es inmutable.

### `DwhDiagram.tsx`

Renderiza un SVG puro (sin librerías). Calcula el `viewBox` dinámicamente. Altura de tabla: `30 + columnas × 22 + 8` px.

### `SqlShell.tsx`

Validación léxica/estructural con regex. No hay ejecución real. Reglas:

| Regla | Tipo |
|---|---|
| Query vacía | Error |
| No empieza con keyword SQL válida | Error |
| Paréntesis desbalanceados | Error |
| `SELECT` sin `FROM` | Error |
| Más `JOIN` que cláusulas `ON` | Error |
| `GROUP BY` sin función de agregación | Warning |
| No termina en `;` | Warning |

---

## Variables de entorno

| Variable | Cuándo se aplica | Descripción |
|---|---|---|
| `VITE_GATEWAY_URL` | Build time | URL del gateway. Baked en el bundle. Default: `http://localhost:3001` |

---

## Desarrollo local

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

El proxy de Vite reenvía `/login`, `/logout`, `/callback`, `/api` al gateway en `localhost:3001`.

---

## Colores del tema

| Token | Hex | Uso |
|---|---|---|
| `ub-dark` | `#1a365d` | Headers, botones primarios, fact tables |
| `ub-mid` | `#2b6cb0` | Hover states, accents, dimension tables |
| `ub-light` | `#4299e1` | Highlights, bordes activos |
| `ub-pale` | `#ebf8ff` | Fondos suaves, texto secundario sobre oscuro |
