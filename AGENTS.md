# AGENTS.md — Directrices para agentes de IA

Guía de trabajo para cualquier agente que opere sobre este repositorio.  
Leer antes de tocar código. Actualizar si se toman decisiones que contradigan lo escrito aquí.

---

## 1. Qué es este proyecto

App de repaso del modelo de parcial 2022 de Base de Datos II (UB). Tres containers Docker: un OIDC Identity Provider (Dex), un gateway Express que maneja el callback OAuth2, y un frontend React que sirve 10 secciones interactivas del parcial.

No es una app de producción. Es una herramienta local de estudio. Las decisiones de diseño priorizan simplicidad y velocidad de iteración sobre seguridad o escalabilidad.

---

## 2. Reglas de trabajo

### 2.1 Leer antes de actuar

Antes de editar cualquier archivo:

```
README.md              ← arquitectura general y decisiones de diseño
gateway/README.md      ← API, flujo OIDC, variables de entorno
dex/README.md          ← configuración del IDP, cómo agregar usuarios
frontend/README.md     ← estructura del frontend, cómo extender el contenido
```

Si el README no menciona algo que estás a punto de cambiar, preguntá antes de implementar.

### 2.2 Una fuente de verdad por dominio

| Dominio | Archivo canónico |
|---|---|
| Contenido del parcial (preguntas, diagramas, queries) | `frontend/src/data/questions.ts` |
| Configuración del IDP (usuarios, clientes) | `dex/config.yaml` |
| Lógica del gateway (endpoints, auth flow) | `gateway/index.js` |
| Persistencia de progreso | `progress-service/index.js` |
| Variables de entorno | `docker-compose.yml` |
| Estilos y colores | `frontend/tailwind.config.js` + `src/index.css` |

Nunca duplicar configuración entre archivos. Si hay que cambiar una URL, hay un solo lugar donde hacerlo.

### 2.3 Scope mínimo

No refactorizar código que no tiene relación con la tarea pedida. No agregar abstracciones preventivas. Si la tarea es "agregar una pregunta al punto 3", solo tocar `questions.ts`. No reorganizar los imports ni renombrar variables.

### 2.4 Verificar antes de reportar como hecho

Para cambios en el gateway o dex:
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

## 3. Guía por tipo de tarea

### Agregar o editar preguntas de opción múltiple

**Archivo:** `frontend/src/data/questions.ts`

Solo una `Choice` puede tener `correct: true`. Verificar que la `explanation` sea informativa: debe explicar *por qué* la respuesta es correcta, no solo afirmarlo.

```typescript
// Plantilla
{
  id: 'q1d',                                    // formato: qNletra
  text: '¿Pregunta clara y sin ambigüedad?',
  choices: [
    { id: 'a', text: 'Opción incorrecta', correct: false },
    { id: 'b', text: 'Opción correcta',   correct: true  },
    { id: 'c', text: 'Distractor plausible', correct: false },
    { id: 'd', text: 'Otro distractor',   correct: false },
  ],
  explanation: 'B es correcta porque... [referencia al concepto del libro/apunte]',
}
```

### Modificar un diagrama DWH

**Archivo:** `frontend/src/data/questions.ts` — sección con `type: 'dwh-diagram'`

Las coordenadas `x, y` son absolutas en píxeles SVG. El componente calcula el `viewBox` automáticamente, así que las tablas pueden estar en coordenadas negativas sin problema.

Reglas de layout:
- Tabla FACT en el centro visual del diagrama
- Dimensiones de primer nivel a 180–250px de distancia del centro
- Dimensiones de segundo nivel (snowflake) más alejadas, conectadas a la dimensión padre, no a la FACT

Para no superponer tablas, calcular la altura antes de posicionar:
```
altura_tabla = 30 (header) + columnas.length × 22 + 8 (padding)
```

Verificar visualmente corriendo `npm run dev` y navegando al punto del diagrama.

### Editar el SQL shell

**Archivos:**
- Datos: `frontend/src/data/questions.ts` → `sqlExercises[]`
- Lógica de validación: `frontend/src/components/SqlShell.tsx` → función `checkSql`

Para agregar una nueva regla de validación, agregarla en `checkSql`. Seguir el patrón existente: errores bloquean (campo `errors`), advertencias no bloquean (campo `warnings`). No usar AST parsers externos — el validador es intencionalmente simple (regex + conteo).

Las `referenceQuery` deben ser PostgreSQL-compatible y seguir el estilo de indentación existente (keywords en UPPERCASE, aliases en lowercase).

### Agregar un usuario a Dex

Ver `dex/README.md → "Añadir usuarios"`. Pasos:
1. Generar hash bcrypt con `node -e "..."` (comando en el README)
2. Editar `dex/config.yaml` con el nuevo entry en `staticPasswords`
3. `docker compose restart dex`
4. Verificar que el login funciona en `http://localhost:5173`

No editar el `userID` de usuarios existentes — aunque el storage es en memoria, es un identificador estable.

### Cambiar variables de entorno del gateway

Las variables van en `docker-compose.yml` bajo `services.gateway.environment`.  
Después de cambiarlas: `docker compose up -d --build gateway`.

No hardcodear valores que deberían ser variables de entorno en `gateway/index.js`. Toda configuración externa va por env var.

### Agregar un endpoint al gateway

1. Agregar la ruta en `gateway/index.js` siguiendo el patrón existente
2. Documentar el nuevo endpoint en `gateway/README.md` → tabla de endpoints
3. Si el endpoint es llamado desde el frontend, agregar el proxy en `frontend/vite.config.ts`

### Cambios en el Dockerfile o docker-compose

Siempre hacer `docker compose build` completo y verificar que los tres containers levantan:
```bash
docker compose build
docker compose up -d
docker compose ps   # los tres deben mostrar "Up"
curl http://localhost:3001/health
```

---

## 4. Lo que no hacer

**No agregar una base de datos real para el SQL shell.**  
El diseño intencional es que el shell valide sintaxis sin ejecutar. Agregar PostgreSQL requeriría seeds, permisos, y complica el setup sin agregar valor educativo para el parcial.

**No mover el token de `sessionStorage` a `localStorage`.**  
`sessionStorage` borra el token al cerrar la pestaña, que es el comportamiento correcto para una app de examen local. `localStorage` persistiría el token indefinidamente.

**No usar `jwt.verify` con el id_token de Dex en el gateway actual.**  
El gateway usa `jwt.decode` (sin verificar firma) intencionalmente. Verificar la firma requiere acceder al JWKS endpoint con una URL que puede no resolver correctamente desde dentro del container. Si se cambia esto, leer primero `dex/README.md → "Notas sobre issuer y red Docker"`.

**No agregar librerías de estado global (Redux, Zustand, Jotai).**  
El estado de la app es suficientemente simple para `useState` local en cada componente. Si una sección necesita comunicarse con otra, usar props o context de React.

**No modificar `tailwind.config.js` content array.**  
El array `content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}']` controla qué clases Tailwind se incluyen en el bundle. Modificarlo mal puede hacer que clases usadas en el código queden fuera del CSS de producción.

**No hacer `docker compose down -v`.**  
El flag `-v` borra los volúmenes. Aunque Dex usa memoria, otros contenedores futuros podrían tener datos importantes. Usar simplemente `docker compose down`.

---

## 5. Herramientas disponibles en el entorno

```bash
node --version    # v25.9.0
npm --version     # 11.12.1
docker --version  # 29.4.3
pdftotext         # para extraer texto del PDF del parcial
```

`pandoc` no puede leer PDFs como input (solo output). Usar `pdftotext` para extraer el contenido del PDF fuente.

---

## 6. Verificaciones de salud del sistema

```bash
# Los tres containers deben estar Up
docker compose ps

# Gateway responde
curl http://localhost:3001/health
# → {"status":"ok"}

# Dex tiene el discovery document
curl http://localhost:5556/dex/.well-known/openid-configuration | python3 -c "import json,sys; print(json.load(sys.stdin)['issuer'])"
# → http://localhost:5556/dex

# Frontend sirve la app
curl -s http://localhost:5173 | grep -o '<title>.*</title>'
# → <title>DBS2 — Modelo de Parcial 2022</title>

# El flujo de login genera el redirect correcto
curl -sI http://localhost:3001/login | grep Location
# → Location: http://localhost:5556/dex/auth?response_type=code&...
```

---

## 7. Convenciones de código

### TypeScript (frontend)

- Interfaces en `PascalCase`, props con tipos explícitos (no `any`)
- Componentes: funciones nombradas exportadas como `default` al final del archivo
- Datos: tipos e interfaces primero, luego la constante `examSections`
- No usar `!` (non-null assertion) si se puede evitar con un early return o guardado

### JavaScript (gateway)

- `const` por defecto, `let` solo si la variable se reasigna
- Funciones async con `try/catch` explícito — nunca dejar una promesa sin manejar
- Variables de entorno: todas extraídas al inicio del archivo como constantes nombradas

### CSS / Tailwind

- Clases de layout primero, luego tipografía, luego colores, luego interacción
- Usar los tokens `ub-*` del tema para consistencia, no valores hex directos
- Responsive: mobile-first con `sm:`, `md:` como modificadores

### YAML (Dex)

- Comentarios en inglés o español, consistente con el resto del archivo
- Strings con caracteres especiales entre comillas dobles
- No usar `yes/no` para booleanos, usar `true/false`

---

## 8. Preguntas frecuentes para agentes

**¿Cómo sé qué port usa cada servicio?**  
Ver `docker-compose.yml` → `ports` de cada servicio. Formato: `HOST:CONTAINER`.

**¿Dónde está el contenido del parcial?**  
Todo en `frontend/src/data/questions.ts`. Es el único archivo de datos.

**¿Por qué hay dos URLs para Dex (`OIDC_ISSUER` y `OIDC_INTERNAL_URL`)?**  
Ver `README.md → "Por qué dos URLs para Dex"` y `dex/README.md → "Notas sobre issuer y red Docker"`.

**¿Puedo correr el frontend sin Docker?**  
Sí. `cd frontend && npm run dev`. Requiere que el gateway corra en `:3001` (puede ser el container `parcial-gateway` con el puerto expuesto).

**¿Cómo agrego un punto 11 al parcial?**  
Agregar una entrada al array `examSections` en `frontend/src/data/questions.ts`. El `App.tsx` y `SectionCard` lo renderizan automáticamente sin cambios adicionales.

**¿Por qué `sessionStorage` y no una cookie?**  
Ver `README.md → "Decisiones de diseño"`.
eño"`.
�o"`.
