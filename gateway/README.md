# Gateway — OIDC Callback Handler

Servidor Express minimal que actúa como intermediario entre el browser y el Identity Provider (Dex). Maneja el flujo Authorization Code de OIDC, emite un JWT de sesión propio con el rol del usuario, y expone endpoints de progreso y administración.

---

## Responsabilidades

1. **Iniciar el flujo OIDC** — construir la URL de autorización con `state` y `nonce` aleatorios.
2. **Recibir el callback** — verificar el `state` (CSRF), intercambiar el `code` por un `id_token` vía red interna Docker.
3. **Determinar el rol** — si el email del usuario está en `ADMIN_EMAILS`, el rol es `admin`; si no, se usa el rol almacenado en MongoDB (o `student` para nuevos usuarios).
4. **Emitir JWT de sesión** — firma un token con `SESSION_SECRET` que incluye `sub`, `email`, `name` y `role`. También establece la cookie `auth_token` para Nginx.
5. **Verificar sesión** — middleware `verifyToken` valida el JWT en todos los endpoints `/api/*`.
6. **Control de acceso por rol** — middleware `requireAdmin` bloquea endpoints `/api/admin/*` a usuarios sin rol `admin`.
7. **Proxy de Progreso** — redirige peticiones a `/api/progress` hacia el microservicio de progreso.
8. **Proxy de Contenido** — expone el contenido editable almacenado en MongoDB.
9. **Logout** — limpia la cookie `auth_token` y redirige al frontend.

---

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/health` | No | Health check. Devuelve `{"status":"ok"}`. |
| `GET` | `/login` | No | Genera `state`+`nonce`, redirige al IDP. |
| `GET` | `/callback` | No | Recibe `code`+`state` del IDP. Sincroniza usuario en MongoDB, firma JWT, redirige al frontend. |
| `GET` | `/api/me` | Bearer | Devuelve `{sub, email, name, role}` del token. |
| `GET` | `/api/progress` | Bearer | Obtiene el progreso del usuario de MongoDB. |
| `POST` | `/api/progress` | Bearer | Guarda el progreso del usuario en MongoDB. |
| `GET` | `/api/content/:type` | Bearer | Lee contenido editable de MongoDB (cae en datos estáticos si no existe). |
| `PUT` | `/api/admin/content/:type` | Bearer + Admin | Sobrescribe contenido editable en MongoDB. |
| `GET` | `/api/admin/users` | Bearer + Admin | Lista todos los usuarios registrados con sus roles. |
| `PUT` | `/api/admin/users/:userId/role` | Bearer + Admin | Cambia el rol de un usuario (`student` \| `admin`). No puede demotar super-admins. |
| `GET` | `/logout` | No | Limpia cookie y redirige a `FRONTEND_URL?logout=true`. |

### Respuestas de `/api/me`

```json
// 200 OK
{ "sub": "a8684b08-...", "email": "estudiante@ub.edu.ar", "name": "estudiante", "role": "student" }

// 401 Unauthorized
{ "error": "No token provided" }
{ "error": "Invalid or expired token" }

// 403 Forbidden (solo endpoints /api/admin/*)
{ "error": "Admin access required" }
```

---

## Middlewares

```javascript
verifyToken(req, res, next)
// Lee Authorization: Bearer <JWT>, verifica firma, puebla req.user con el payload.

requireAdmin(req, res, next)
// Verifica que req.user.role === 'admin'. Depende de verifyToken.
```

Ambos middlewares se encadenan en los endpoints que los requieren:
```javascript
app.put('/api/admin/content/:type', verifyToken, requireAdmin, handler)
```

---

## Sistema de roles

Los roles posibles son `student` (default) y `admin`.

**Super-admins:** definidos en la variable de entorno `ADMIN_EMAILS` (comma-separated). En cada login, si el email del usuario está en esta lista, su rol se fuerza a `admin` en MongoDB. No pueden ser degradados desde el panel de administración.

**Admins promovidos:** cualquier usuario puede ser promovido a `admin` desde el panel admin. Su rol persiste en MongoDB entre sesiones. Si se degrada, vuelve a `student` hasta una nueva promoción manual.

El rol queda grabado en el JWT de sesión al momento del login. Cambios de rol aplicados desde el panel no se reflejan hasta el próximo login del usuario afectado.

---

## Flujo interno del callback

```
Browser              Gateway                    Dex (interno: dex:5556)        Progress Service
  │                     │                              │                              │
  │── GET /callback ────▶│                              │                              │
  │    ?code=CODE        │ verifica state en Map        │                              │
  │    &state=ABC        │── POST /dex/token ──────────▶│                              │
  │                      │◀── {id_token} ───────────────│                              │
  │                      │ jwt.decode(id_token) → claims│                              │
  │                      │ ¿email in ADMIN_EMAILS?      │                              │
  │                      │── POST /progress/:sub ───────────────────────────────────▶│
  │                      │◀── {role: "admin"|"student"} ───────────────────────────────│
  │                      │ jwt.sign({sub,email,name,role})                            │
  │◀── 302 /?token=JWT ──│                              │                              │
```

---

## Variables de entorno

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `PORT` | No | `3001` | Puerto de escucha |
| `SESSION_SECRET` | **Sí** | `dev-secret` | Clave para firmar/verificar el JWT de sesión |
| `OIDC_ISSUER` | No | `http://localhost:5556/dex` | URL pública del IDP (la que ve el browser) |
| `OIDC_INTERNAL_URL` | No | igual a ISSUER | URL interna Docker para el token exchange |
| `OIDC_CLIENT_ID` | No | `gateway-client` | Client ID registrado en el IDP |
| `OIDC_CLIENT_SECRET` | **Sí** | `gateway-secret` | Client secret |
| `OIDC_CALLBACK_URL` | No | `http://localhost:3001/callback` | Redirect URI registrada en el IDP |
| `FRONTEND_URL` | No | `http://localhost:5173` | Destino post-login y post-logout |
| `PROGRESS_SERVICE_URL` | No | `http://localhost:3002` | URL del microservicio de progreso |
| `ADMIN_EMAILS` | No | `""` | Lista de super-admins separada por comas. Ej: `"user@ub.edu.ar,otro@ub.edu.ar"` |

---

## Estado en memoria

```javascript
const pendingStates = new Map()
// { state_hex: { nonce: string, createdAt: timestamp } }
```

Los states pendientes se limpian automáticamente si tienen más de 10 minutos. El proceso no tiene persistencia: reiniciar el gateway invalida todos los flows OIDC en curso.

---

## Dependencias

| Paquete | Versión | Uso |
|---|---|---|
| `express` | ^4.18 | Framework HTTP |
| `cors` | ^2.8 | Headers CORS para el frontend |
| `axios` | ^1.6 | POST al token endpoint de Dex + llamadas al progress service |
| `jsonwebtoken` | ^9.0 | Firmar/verificar JWT de sesión + decodificar id_token de Dex |
| `crypto` | built-in | `randomBytes` para state y nonce |

---

## Desarrollo local (sin Docker)

```bash
cd gateway
npm install

export SESSION_SECRET=dev-only-secret
export OIDC_ISSUER=http://localhost:5556/dex
export OIDC_INTERNAL_URL=http://localhost:5556/dex
export FRONTEND_URL=http://localhost:5173
export PROGRESS_SERVICE_URL=http://localhost:3002
export ADMIN_EMAILS="lucas.chavez@comunidad.ub.edu.ar"

node index.js
# Gateway running on port 3001
```

---

## Seguridad — limitaciones conocidas (scope: app de repaso)

| Limitación | Impacto | Mitigación para producción |
|---|---|---|
| `jwt.decode()` sin verificar firma del id_token | Un id_token manipulado podría inyectar claims. Mitigado porque el intercambio es server-to-server vía red interna | Usar `jose` o `openid-client` para verificar firma con JWKS |
| `pendingStates` en memoria | Si el gateway escala, el state puede no encontrarse | Usar Redis o una store compartida |
| `SESSION_SECRET` hardcodeado en compose | Visible en el repo | Usar Docker secrets o variables inyectadas en CI |
| Cambios de rol activos solo en el próximo login | Un admin promovido necesita re-loguearse | Emitir tokens de vida corta o agregar endpoint de refresh |

---

## Estructura del archivo

```
gateway/
├── index.js        ← Servidor completo (~200 líneas)
├── package.json
├── Dockerfile
└── .dockerignore
```

Todo el código vive en un solo archivo. Si la lógica crece, extraer por responsabilidad: `routes/auth.js`, `routes/admin.js`, `middleware/verifyToken.js`.
