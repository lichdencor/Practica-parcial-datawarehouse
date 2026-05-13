# DBS2 — Modelo de Parcial 2022

App de repaso para el parcial de Base de Datos II (Universidad de Belgrano).  
Cubre los 10 puntos del modelo de parcial 2022 con preguntas interactivas, diagramas DWH y un SQL shell con validación de sintaxis.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Docker Network: parcial-net                         │
│                                                                         │
│  ┌──────────────┐   1. /login → redirect    ┌──────────────┐            │
│  │   Browser    │──────────────────────────▶│     Dex      │            │
│  └──────┬───────┘                           │  (OIDC IDP)  │            │
│         │ :5173                             └──────┬───────┘            │
│  ┌──────▼───────┐   4. ?token=JWT + Cookie         │                    │
│  │   Frontend   │◀─────────────────────────────────┘                    │
│  │  React/nginx │          3. Issue JWT                                 │
│  │   :80→5173   │◀─────────────────────────────────┐                    │
│  └──────┬───────┘                                  │                    │
│         │                                   ┌──────▼───────┐            │
│         │ 5. API Requests (Bearer)          │   Gateway    │            │
│         └──────────────────────────────────▶│  Express.js  │            │
│                                             │    :3001     │            │
│                                             └──────┬───────┘            │
│                                                    │                    │
│                                             ┌──────▼───────┐            │
│                                             │   Progress   │            │
│                                             │   Service    │            │
│                                             └──────┬───────┘            │
│                                                    │                    │
│                                             ┌──────▼───────┐            │
│                                             │   MongoDB    │            │
│                                             └──────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
```

| Servicio | Imagen / Build | Puerto | Rol |
|---|---|---|---|
| `parcial-dex` | `dexidp/dex:v2.37.0` | 5556 | OIDC Identity Provider |
| `parcial-gateway` | `./gateway` (Node 20) | 3001 | OAuth2 callback handler + JWT issuer + API Proxy |
| `parcial-progress`| `./progress-service` | 3002 | Gestor de progreso de usuarios |
| `parcial-mongodb` | `mongo:6.0` | — | Base de datos persistente para progreso |
| `parcial-frontend`| `./frontend` (Vite → nginx) | 5173 | SPA React servida por nginx con redirección de auth |

---

## Flujo de autenticación y redirección

```
1. Usuario abre http://localhost:5173
2. Nginx verifica cookie 'auth_token'. Si falta → redirect 302 a /login
3. Gateway /login → genera state + nonce (CSRF), redirige a localhost:5556/dex/auth?...
4. Dex muestra formulario de login
5. Usuario ingresa credenciales (estudiante@ub.edu.ar / password)
6. Dex redirige a localhost:3001/callback?code=XXX&state=YYY
7. Gateway: verifica state, intercambia code→id_token
8. Gateway: firma JWT propio, establece cookie 'auth_token', redirige a frontend
9. Frontend guarda JWT en sessionStorage
10. Frontend llama GET /api/progress para recuperar estado previo de MongoDB
11. Usuario completa parcial; frontend envía actualizaciones a /api/progress
```

**Nginx Redirect:**  
Nginx protege la aplicación SPA. Si la cookie `auth_token` no está presente, el usuario es enviado al flujo de login antes de poder ver cualquier contenido del parcial.

**Por qué dos URLs para Dex:**  
El issuer público (`localhost:5556`) es la URL que ve el browser.  
El intercambio de código sucede dentro de Docker, donde el gateway llama al hostname interno `dex:5556`. Esto evita exponer el client_secret al browser y resuelve el problema de networking sin un proxy adicional.

---

## Inicio rápido

### Prerequisitos

- Docker ≥ 24 con Compose V2
- Puertos 3001, 5173 y 5556 libres en localhost

### Levantar todo

```bash
# Desde la raíz del proyecto
docker compose up -d

# Verificar que los tres containers estén Up
docker compose ps
```

### Acceder

| URL | Qué es |
|---|---|
| `http://localhost:5173` | Aplicación frontend |
| `http://localhost:3001/health` | Health check del gateway |
| `http://localhost:5556/dex/.well-known/openid-configuration` | Discovery endpoint de Dex |

---

## Exposición pública (ngrok)

Para permitir que alumnos remotos accedan a la app sin configurar nada en sus máquinas:

1. Asegúrate de tener `ngrok` instalado.
2. Ejecuta `./expose.sh`.
3. Comparte la URL generada.

Ver [EXPOSURE.md](./EXPOSURE.md) para más detalles.

---

## Detener

```bash
docker compose down
```

### Rebuild tras cambios

```bash
# Un solo servicio
docker compose build gateway && docker compose up -d gateway

# Todo
docker compose build && docker compose up -d
```

---

## Contenido del parcial

| Punto | Tipo | Tema |
|---|---|---|
| 1 | Opción múltiple | Diferencia OLAP vs OLTP |
| 2 | Opción múltiple | FACT vs Dimension y tratamiento histórico |
| 3 | Opción múltiple | Técnicas de diseño de FACTs |
| 4 | Opción múltiple | Técnicas de dimensiones |
| 5 | Opción múltiple | Modelado en Data Warehousing |
| 6 | Opción múltiple | Formas de diseño de dimensiones |
| 7 | Diagrama DWH | Star/Snowflake schema — Sistema de Ventas |
| 8 | SQL Shell | 3 métricas analíticas sobre el modelo del punto 7 |
| 9 | Diagrama DWH | Star schema — Sistema de Facturación y Bodegas |
| 10 | SQL Shell | 3 métricas analíticas sobre el modelo del punto 9 |

---

## Estructura del proyecto

```
modelo-parcial/
├── AGENTS.md                   ← Directrices para agentes de IA
├── README.md                   ← Este archivo
├── docker-compose.yml
│
├── dex/
│   ├── README.md
│   └── config.yaml             ← Configuración del IDP
│
├── gateway/
│   ├── README.md
│   ├── Dockerfile
│   ├── index.js                ← Servidor Express (único archivo)
│   └── package.json
│
└── frontend/
    ├── README.md
    ├── Dockerfile
    ├── nginx.conf
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx             ← Raíz: auth hook + router de secciones
        ├── data/
        │   └── questions.ts    ← TODO el contenido del parcial
        └── components/
            ├── Header.tsx
            ├── Login.tsx
            ├── MultipleChoiceSection.tsx
            ├── DwhDiagram.tsx
            └── SqlShell.tsx
```

---

## Variables de entorno

### Gateway (`docker-compose.yml` → service `gateway`)

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `3001` | Puerto del servidor |
| `SESSION_SECRET` | — | Secreto para firmar el JWT de sesión. **Cambiar en producción.** |
| `OIDC_ISSUER` | `http://localhost:5556/dex` | URL pública del IDP (la que ve el browser) |
| `OIDC_INTERNAL_URL` | `http://dex:5556/dex` | URL interna Docker para el token exchange |
| `OIDC_CLIENT_ID` | `gateway-client` | Client ID registrado en Dex |
| `OIDC_CLIENT_SECRET` | `gateway-secret` | Client secret registrado en Dex |
| `OIDC_CALLBACK_URL` | `http://localhost:3001/callback` | Redirect URI registrada en Dex |
| `FRONTEND_URL` | `http://localhost:5173` | URL del frontend (destino del redirect post-login) |
| `PROGRESS_SERVICE_URL`| `http://progress:3002` | URL del servicio de progreso |

### Frontend (`docker-compose.yml` → build arg)

| Variable | Default | Descripción |
|---|---|---|
| `VITE_GATEWAY_URL` | `http://localhost:3001` | URL del gateway (baked en el bundle en build time) |

---

## Añadir usuarios

Editar `dex/config.yaml`. El hash es bcrypt cost-10:

```bash
# Generar hash para una nueva contraseña
node -e "const b = require('./gateway/node_modules/bcryptjs'); console.log(b.hashSync('nueva-clave', 10))"
```

Luego agregar en `dex/config.yaml`:

```yaml
staticPasswords:
  - email: "nuevo@ub.edu.ar"
    hash: "$2b$10$..."
    username: "nuevo"
    userID: "uuid-unico-aqui"
```

Reiniciar Dex: `docker compose restart dex`

> Dex usa almacenamiento en memoria (`storage: type: memory`). Todos los datos se pierden al reiniciar.

---

## Decisiones de diseño

**¿Por qué JWT propio del gateway en lugar de usar el id_token de Dex directamente?**  
El id_token de Dex contiene el issuer `http://localhost:5556/dex`. Validarlo en el gateway requeriría acceso al JWKS endpoint. En cambio, el gateway emite su propio JWT firmado con `SESSION_SECRET`, lo que simplifica la validación en `/api/me` y desacopla el frontend de Dex.

**¿Por qué cookies + sessionStorage?**  
Se utiliza la cookie `auth_token` exclusivamente para que Nginx pueda realizar la redirección al login de forma eficiente sin cargar la SPA. El frontend sigue usando el token en `sessionStorage` y enviándolo como `Bearer` en los headers para simplificar la compatibilidad con el gateway y evitar problemas de CSRF en las mutaciones de progreso.

**¿Por qué el SQL shell no ejecuta contra una base real?**  
El objetivo es practicar la escritura de queries para el parcial, no ejecutarlas. Un validador de sintaxis basado en reglas es suficiente y evita la complejidad de provisionar una base de datos, seeds y permisos.
