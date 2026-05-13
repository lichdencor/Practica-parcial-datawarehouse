# DBS2 — Modelo de Parcial 2022

App de repaso para el parcial de Base de Datos II (Universidad de Belgrano).  
Cubre los 10 puntos del modelo de parcial 2022 con preguntas interactivas, diagramas DWH y un SQL shell con validación de sintaxis.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Docker Network: parcial-net                         │
│                                                                         │
│  ┌──────────────┐          Single ngrok Tunnel           ┌──────────┐   │
│  │   Browser    │◀──────────────────────────────────────▶│  ngrok   │   │
│  └──────┬───────┘            (port 5173)                 └──────────┘   │
│         │                                                               │
│  ┌──────▼───────┐                                                       │
│  │   Frontend   │─── /dex ──────────────────────────────▶┌──────────┐   │
│  │  (Nginx)     │                                        │   Dex    │   │
│  │   :5173      │─── /api, /login, /callback ───────────▶│ (OIDC)   │   │
│  └──────────────┘                                        └──────────┘   │
│         │                                                       │       │
│         │                                                ┌──────▼───────┐
│         │                                                │   Gateway    │
│         └────────────────────────────────────────────────│  (Express)   │
│                                                          └──────┬───────┘
│                                                                 │       │
│                                                          ┌──────▼───────┐
│                                                          │   Progress   │
│                                                          │   Service    │
│                                                          └──────┬───────┘
│                                                                 │       │
│                                                          ┌──────▼───────┐
│                                                          │   MongoDB    │
│                                                          └──────────────┘
└─────────────────────────────────────────────────────────────────────────┘
```

| Servicio | Imagen / Build | Puerto | Rol |
|---|---|---|---|
| `parcial-dex` | `dexidp/dex:v2.37.0` | 5556 | OIDC Identity Provider |
| `parcial-gateway` | `./gateway` (Node 20) | 3001 | OAuth2 callback + JWT con rol + API proxy |
| `parcial-progress` | `./progress-service` | 3002 | Progreso de usuarios + contenido editable |
| `parcial-mongodb` | `mongo:6.0` | — | Persistencia: progreso, roles, contenido |
| `parcial-frontend` | `./frontend` (Vite → nginx) | 5173 | SPA React servida por nginx |

---

## Flujo de autenticación

```
1. Usuario abre http://localhost:5173
2. Nginx verifica cookie 'auth_token'. Si falta → redirect 302 a /login
3. Gateway /login → genera state + nonce (CSRF), redirige a Dex
4. Dex muestra formulario de login
5. Usuario ingresa credenciales
6. Dex redirige a /callback?code=XXX&state=YYY
7. Gateway: verifica state, intercambia code→id_token
8. Gateway: determina rol (ADMIN_EMAILS o MongoDB), sincroniza usuario en MongoDB
9. Gateway: firma JWT con {sub, email, name, role}, establece cookie 'auth_token'
10. Frontend: guarda JWT en sessionStorage, carga progreso y contenido de MongoDB
```

---

## Sistema de roles

Los usuarios tienen rol `student` (default) o `admin`.

**Super-admins:** definidos en la variable de entorno `ADMIN_EMAILS` del gateway. Su rol se fuerza a `admin` en cada login y no puede ser modificado desde el panel.

**Admins promovidos:** cualquier admin puede promover a otro usuario desde el panel `/admin` → tab Usuarios. Los cambios persisten en MongoDB.

El rol queda grabado en el JWT al momento del login. Cambios de rol requieren re-login para reflejarse.

---

## Contenido editable

Los datos del parcial (preguntas, teoría, práctica, SQL training y glosario) están definidos en archivos TypeScript (`src/data/*.ts`) que sirven como **fallback estático**. Un admin puede editar el contenido desde el panel `/admin` usando herramientas avanzadas:

1.  **Tab Contenido:** Editor visual/JSON para todas las secciones de datos (incluyendo el nuevo Glosario).
2.  **Tab Esquemas DWH:** Un **Constructor de Esquemas DWH** visual que permite crear y modificar diagramas de tablas FACT/Dimension con auto-layout, y vincularlos a nuevos ejercicios de tipo "Esquema + Preguntas".

Los cambios se persisten en MongoDB con prioridad sobre los datos estáticos.

---

## Inicio rápido

### Prerequisitos

- Docker ≥ 24 con Compose V2
- Puertos 3001, 5173 y 5556 libres en localhost

### Levantar todo

```bash
docker compose up -d
docker compose ps   # todos deben mostrar "Up"
```

### Acceder

| URL | Qué es |
|---|---|
| `http://localhost:5173` | Aplicación frontend |
| `http://localhost:3001/health` | Health check del gateway |
| `http://localhost:5556/dex/.well-known/openid-configuration` | Discovery endpoint de Dex |

---

## Exposición pública (ngrok)

```bash
./expose.sh
```

Ver [EXPOSURE.md](./EXPOSURE.md) para más detalles.

---

## Detener

```bash
docker compose down        # conserva datos de MongoDB
docker compose down -v     # ⚠️ borra también el volumen mongo-data
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
├── AGENTS.md                    ← Directrices para agentes de IA
├── README.md                    ← Este archivo
├── docker-compose.yml
│
├── dex/
│   ├── README.md
│   └── config.yaml              ← Configuración del IDP (usuarios, client)
│
├── gateway/
│   ├── README.md                ← API, roles, variables de entorno
│   ├── index.js                 ← Servidor Express (~200 líneas)
│   └── package.json
│
├── progress-service/
│   ├── README.md                ← Esquemas MongoDB, endpoints
│   ├── index.js                 ← Express + Mongoose (~100 líneas)
│   └── package.json
│
└── frontend/
    ├── README.md                ← Contextos, datos, componentes
    ├── Dockerfile
    ├── nginx.conf
    ├── vite.config.ts
    └── src/
        ├── App.tsx              ← Auth + UserContext + ProgressContext + ContentContext
        ├── AppRouter.tsx        ← Rutas SPA + protección /admin
        ├── data/
        │   ├── questions.ts     ← Preguntas del parcial (fallback estático)
        │   ├── theory.ts        ← Conceptos teóricos jerárquicos (fallback estático)
        │   ├── practice_quick.ts← Práctica rápida (fallback estático)
        │   ├── sql_practice.ts  ← Módulo SQL Training por niveles (fallback estático)
        │   └── glossary.ts      ← Términos y definiciones DWH (fallback estático)
        ├── components/
        │   ├── Header.tsx
        │   ├── Navbar.tsx
        │   ├── Login.tsx
        │   ├── MultipleChoiceSection.tsx
        │   ├── DwhDiagram.tsx
        │   ├── DwhDiagramBuilder.tsx ← Constructor visual de esquemas para admins
        │   └── SqlShell.tsx
        └── pages/
            ├── Conceptos.tsx
            ├── Practica.tsx
            ├── Ejercicios.tsx   ← SQL Training Module (ruta progresiva por niveles)
            ├── Glosario.tsx     ← /glosario — búsqueda y filtros de términos
            ├── Cronometrado.tsx ← /cronometrado — Modo examen con timer
            ├── Integrador.tsx
            └── Admin.tsx        ← Panel de roles, editor de contenido y constructor de esquemas
```

---

## Variables de entorno

### Gateway (`docker-compose.yml`)

| Variable | Default | Descripción |
|---|---|---|
| `SESSION_SECRET` | — | Secreto para firmar el JWT de sesión |
| `OIDC_ISSUER` | `http://localhost:5556/dex` | URL pública del IDP |
| `OIDC_INTERNAL_URL` | `http://dex:5556/dex` | URL interna Docker para token exchange |
| `OIDC_CLIENT_ID` | `gateway-client` | Client ID registrado en Dex |
| `OIDC_CLIENT_SECRET` | `gateway-secret` | Client secret |
| `OIDC_CALLBACK_URL` | `http://localhost:3001/callback` | Redirect URI |
| `FRONTEND_URL` | `http://localhost:5173` | URL del frontend |
| `PROGRESS_SERVICE_URL` | `http://progress:3002` | URL del progress service |
| `ADMIN_EMAILS` | `""` | Super-admins separados por coma |

### Frontend (`docker-compose.yml` → build arg)

| Variable | Default | Descripción |
|---|---|---|
| `VITE_GATEWAY_URL` | `http://localhost:5173` | URL del gateway (baked en build) |

---

## Añadir usuarios

Editar `dex/config.yaml`. El hash es bcrypt cost-10:

```bash
node -e "const b = require('./gateway/node_modules/bcryptjs'); console.log(b.hashSync('nueva-clave', 10))"
```

```yaml
staticPasswords:
  - email: "nuevo@ub.edu.ar"
    hash: "$2b$10$..."
    username: "nuevo"
    userID: "uuid-unico-aqui"
```

Reiniciar Dex: `docker compose restart dex`

Para hacer admin a un usuario nuevo, agregar su email a `ADMIN_EMAILS` en `docker-compose.yml` (super-admin) o promoverlo desde el panel `/admin` después de su primer login.

---

## Decisiones de diseño

**¿Por qué JWT propio del gateway con rol incluido?**  
El id_token de Dex no incluye el rol de la app. El gateway firma su propio JWT con `SESSION_SECRET` incluyendo `role`, lo que permite que el frontend y los endpoints admin conozcan el rol sin consultar la DB en cada request.

**¿Por qué el rol en el JWT y no consultarlo en cada request?**  
Simplicidad. Para una app de estudio con pocos usuarios, el costo de un JWT expirado con rol desactualizado es mínimo. Mitigación: el JWT expira en 8h, forzando re-login diario.

**¿Por qué cookies + sessionStorage?**  
La cookie `auth_token` permite que Nginx valide la sesión sin cargar la SPA. El frontend usa el token desde `sessionStorage` como Bearer header. `sessionStorage` borra el token al cerrar la pestaña.

**¿Por qué el SQL shell no ejecuta contra una base real?**  
El objetivo es practicar escritura de queries para el parcial. Un validador de sintaxis es suficiente y evita la complejidad de provisionar una DB con seeds.

**¿Por qué el contenido editable en MongoDB y no en archivos?**  
Los archivos TS requieren rebuild y redeploy para cada cambio. MongoDB permite que el profesor actualice preguntas o explicaciones desde el panel `/admin` sin tocar código ni reiniciar containers.
