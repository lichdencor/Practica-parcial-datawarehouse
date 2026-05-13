# AGENTS.md — Directrices para agentes de IA

Guía de trabajo para cualquier agente que opere sobre este repositorio.  
Leer antes de tocar código. Actualizar si se toman decisiones que contradigan lo escrito aquí.

---

## 1. Qué es este proyecto

App de repaso del modelo de parcial 2022 de Base de Datos II (UB). Cinco containers Docker: un OIDC Identity Provider (Dex), un gateway Express que maneja el callback OAuth2 y emite JWTs con rol, un progress service que persiste progreso y contenido en MongoDB, una base MongoDB, y un frontend React que sirve 10 secciones interactivas del parcial.

No es una app de producción. Es una herramienta local de estudio. Las decisiones de diseño priorizan simplicidad y velocidad de iteración.

---

## 2. Reglas de trabajo

### 2.1 Leer antes de actuar

Antes de editar cualquier archivo:

```
README.md                  ← arquitectura general y decisiones de diseño
gateway/README.md          ← API, flujo OIDC, roles, variables de entorno
dex/README.md              ← configuración del IDP, cómo agregar usuarios
progress-service/README.md ← esquemas MongoDB, endpoints internos
frontend/README.md         ← estructura del frontend, contextos, cómo extender contenido
```

Si el README no menciona algo que estás a punto de cambiar, preguntá antes de implementar.

### 2.2 Una fuente de verdad por dominio

| Dominio | Archivo canónico |
|---|---|
| Preguntas del Parcial | `frontend/src/data/questions.ts` |
| Teoría y Conceptos | `frontend/src/data/theory.ts` |
| Práctica Rápida | `frontend/src/data/practice_quick.ts` |
| Configuración del IDP | `dex/config.yaml` |
| Lógica del gateway | `gateway/index.js` |
| Lógica del progress service | `progress-service/index.js` |
| Infraestructura ngrok | `expose.sh` |

Los archivos `src/data/*.ts` son el fallback estático. El contenido real en runtime puede venir de MongoDB si un admin lo editó via el panel `/admin`.

### 2.3 Scope mínimo

No refactorizar código que no tiene relación con la tarea pedida. Si la tarea es "agregar una pregunta al punto 3", solo tocar `questions.ts`. No reorganizar imports ni renombrar variables.

### 2.4 Verificar antes de reportar como hecho

Para cambios en el gateway, progress service o dex:
```bash
docker compose up -d --build <servicio>
curl http://localhost:3001/health
```

Para cambios en el frontend:
```bash
cd frontend && npm run build
# Debe terminar con "✓ built in X.XXs" sin errores TypeScript
```

Si el build falla, no reportar la tarea como completada.

---

## 3. Infraestructura Unificada (Single Tunnel)

El proyecto utiliza un túnel único de ngrok apuntando al puerto **5173**. Nginx (frontend) gestiona todas las rutas:
- `/dex/*` → Proxea al contenedor `dex`
- `/api/*`, `/login`, `/callback` → Proxea al contenedor `gateway`
- Otros → Sirve la SPA React

**Regla de Oro:** No intentar abrir múltiples túneles. Si cambia la URL pública, el script `expose.sh` se encarga de reconfigurar Dex y el Gateway automáticamente.

---

## 4. Guía por tipo de tarea

### Agregar o editar preguntas de opción múltiple

**Archivo:** `frontend/src/data/questions.ts`

Solo una `Choice` puede tener `correct: true`. La `explanation` debe explicar *por qué* la respuesta es correcta, no solo afirmarlo.

```typescript
{
  id: 'q1d',
  text: '¿Pregunta clara y sin ambigüedad?',
  choices: [
    { id: 'a', text: 'Opción incorrecta', correct: false },
    { id: 'b', text: 'Opción correcta',   correct: true  },
    { id: 'c', text: 'Distractor plausible', correct: false },
  ],
  explanation: 'B es correcta porque...',
}
```

### Agregar o editar conceptos teóricos

**Archivo:** `frontend/src/data/theory.ts`

La estructura es `ConceptCategory[]` — jerárquica, no una lista plana.

```typescript
// Para agregar un concepto a un subgrupo existente:
// → localizar el subgroup correcto y agregar al array concepts[]

// Para agregar una nueva categoría sin subgrupos:
{ category: 'Nueva', concepts: [{ id, title, content }] }

// Para agregar una categoría con subgrupos:
{
  category: 'Nueva',
  subgroups: [
    { name: 'SubA', concepts: [...] },
    { name: 'SubB', concepts: [...] },
  ]
}
```

El `content` soporta `**negritas**` — el componente `ConceptCard` parsea `**texto**` a `<strong>`.

### Modificar un diagrama DWH

**Archivo:** `frontend/src/data/questions.ts` — sección con `type: 'dwh-diagram'`

Las coordenadas `x, y` son absolutas en píxeles SVG. El componente calcula el `viewBox` automáticamente.

Reglas de layout:
- Tabla FACT en el centro visual
- Dimensiones de primer nivel a 180–250px del centro
- Dimensiones de segundo nivel más alejadas, conectadas a la dimensión padre

Altura de tabla: `30 (header) + columnas × 22 + 8 (padding)` px.

### Editar el SQL shell

**Archivos:**
- Datos: `frontend/src/data/questions.ts` → `sqlExercises[]`
- Lógica de validación: `frontend/src/components/SqlShell.tsx` → función `checkSql`

Errores bloquean (`errors`), advertencias no bloquean (`warnings`). No usar AST parsers externos.

### Agregar un usuario a Dex

Ver `dex/README.md → "Añadir usuarios"`. Pasos:
1. Generar hash bcrypt
2. Editar `dex/config.yaml`
3. `docker compose restart dex`

### Agregar un admin

Dos formas:
1. **Super-admin permanente:** agregar el email a `ADMIN_EMAILS` en `docker-compose.yml`, reiniciar gateway.
2. **Admin promovido:** loguearse como admin, ir a `/admin` → tab Usuarios → "Hacer admin".

Los super-admins no pueden ser degradados desde el panel.

### Agregar un endpoint al gateway

1. Agregar la ruta en `gateway/index.js` siguiendo el patrón existente
2. Documentar en `gateway/README.md` → tabla de endpoints
3. Si requiere autenticación: encadenar `verifyToken`; si es solo para admins: encadenar también `requireAdmin`

### Editar contenido editable (via admin panel)

Los datos en `src/data/*.ts` son el fallback estático. Los cambios hechos desde el panel `/admin` se persisten en MongoDB y tienen prioridad sobre los datos estáticos.

Para restaurar el contenido original de un tipo, copiar el JSON del archivo TS correspondiente y pegarlo en el editor del panel admin.

### Cambios en el Dockerfile o docker-compose

Siempre verificar que los containers levantan:
```bash
docker compose build
docker compose up -d
docker compose ps   # todos deben mostrar "Up"
curl http://localhost:3001/health
```

---

## 5. Lo que no hacer

**No agregar una base de datos real para el SQL shell.**  
El shell valida sintaxis sin ejecutar. Agregar PostgreSQL complica el setup sin agregar valor educativo.

**No mover el token de `sessionStorage` a `localStorage`.**  
`sessionStorage` borra el token al cerrar la pestaña — comportamiento correcto para una app de examen.

**No usar `jwt.verify` con el id_token de Dex en el gateway actual.**  
El gateway usa `jwt.decode` (sin verificar firma) intencionalmente. Ver `dex/README.md → "Notas sobre issuer y red Docker"`.

**No agregar librerías de estado global (Redux, Zustand, Jotai).**  
El estado se maneja con los tres contextos de `App.tsx`: `UserContext`, `ProgressContext`, `ContentContext`.

**No modificar `tailwind.config.js` content array.**  
Controla qué clases Tailwind se incluyen en el bundle.

**No hacer `docker compose down -v`.**  
El flag `-v` borra los volúmenes, incluyendo los datos de MongoDB.

**No saltear la verificación de rol en endpoints admin.**  
Todo endpoint bajo `/api/admin/*` debe encadenar `verifyToken` + `requireAdmin`.

---

## 6. Herramientas disponibles en el entorno

```bash
node --version    # v25.9.0
npm --version     # 11.12.1
docker --version  # 29.4.3
pdftotext         # para extraer texto del PDF del parcial
```

---

## 7. Verificaciones de salud del sistema

```bash
# Todos los containers deben estar Up
docker compose ps

# Gateway responde
curl http://localhost:3001/health
# → {"status":"ok"}

# Progress service
curl http://localhost:3002/health   # interno, requiere estar dentro de la red o exponer el puerto
# → {"status":"ok"}

# Dex discovery
curl http://localhost:5556/dex/.well-known/openid-configuration | python3 -c "import json,sys; print(json.load(sys.stdin)['issuer'])"
# → http://localhost:5556/dex

# Frontend
curl -s http://localhost:5173 | grep -o '<title>.*</title>'
# → <title>DBS2 — Modelo Parcial 2022</title>
```

---

## 8. Convenciones de código

### TypeScript (frontend)

- Interfaces en `PascalCase`, props con tipos explícitos (no `any`)
- Contextos exportados desde `App.tsx`: `UserContext`, `ProgressContext`, `ContentContext`
- Componentes: funciones nombradas exportadas como `default` al final del archivo
- Datos: tipos e interfaces primero, luego las constantes exportadas

### JavaScript (gateway)

- `const` por defecto, `let` solo si la variable se reasigna
- Funciones async con `try/catch` explícito
- Variables de entorno: todas extraídas al inicio del archivo como constantes nombradas
- Middleware en cadena: `app.route(path, verifyToken, requireAdmin, handler)`

### CSS / Tailwind

- Clases de layout primero, luego tipografía, luego colores, luego interacción
- Usar los tokens `ub-*` del tema para consistencia
- Responsive: mobile-first con `sm:`, `md:` como modificadores

### YAML (Dex)

- No usar `yes/no` para booleanos, usar `true/false`
- Strings con caracteres especiales entre comillas dobles

---

## 9. Preguntas frecuentes para agentes

**¿Dónde está el contenido del parcial?**  
En `frontend/src/data/questions.ts`. Si un admin editó algo via el panel, la versión live está en MongoDB (colección `contents`).

**¿Cuál es la diferencia entre super-admin y admin promovido?**  
Super-admin: email en `ADMIN_EMAILS` (env var del gateway). Su rol se fuerza a `admin` en cada login. No desmotable via panel. Admin promovido: rol seteado en MongoDB por otro admin. Se resetea a `student` si es degradado.

**¿Por qué hay dos URLs para Dex?**  
Ver `README.md → "Por qué dos URLs para Dex"`.

**¿Cómo sé qué port usa cada servicio?**  
Ver `docker-compose.yml` → `ports` de cada servicio.

**¿Puedo correr el frontend sin Docker?**  
Sí. `cd frontend && npm run dev`. Requiere gateway en `:3001` y progress service en `:3002`.

**¿Cómo agrego un punto 11 al parcial?**  
Agregar entrada al array `examSections` en `questions.ts`. El router y los componentes lo renderizan automáticamente.

**¿Los cambios del panel admin se pierden al reiniciar?**  
No. Se persisten en el volumen `mongo-data` de Docker. Solo se pierden con `docker compose down -v`.
