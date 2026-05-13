# Gateway — OIDC Callback Handler

Servidor Express minimal que actúa como intermediario entre el browser y el Identity Provider (Dex). Su única responsabilidad es completar el flujo Authorization Code de OIDC y emitir un JWT de sesión propio que el frontend pueda usar.

---

## Responsabilidades

1. **Iniciar el flujo OIDC** — construir la URL de autorización con `state` y `nonce` aleatorios.
2. **Recibir el callback** — verificar el `state` (CSRF), intercambiar el `code` por un `id_token` usando el endpoint interno de Dex.
3. **Emitir JWT de sesión** — firmar un token propio con `SESSION_SECRET` que el frontend usa como Bearer. También establece una cookie `auth_token` para Nginx.
4. **Verificar sesión** — validar el JWT en `GET /api/me` y devolver los claims del usuario.
5. **Proxy de Progreso** — redirigir peticiones a `/api/progress` hacia el microservicio correspondiente, inyectando el `sub` del usuario autenticado.
6. **Logout** — limpia la cookie `auth_token` y redirige al frontend con `?logout=true`.

---

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Health check. Devuelve `{"status":"ok"}`. |
| `GET` | `/login` | Genera `state`+`nonce`, guarda en memoria, redirige al IDP. |
| `GET` | `/callback` | Recibe `code`+`state` del IDP. Firma JWT, establece cookie, redirige al frontend. |
| `GET` | `/api/me` | Requiere `Authorization: Bearer <JWT>`. Devuelve `{sub, email, name}`. |
| `GET` | `/api/progress`| Requiere Bearer token. Obtiene el progreso del usuario de MongoDB. |
| `POST`| `/api/progress`| Requiere Bearer token. Guarda el progreso del usuario en MongoDB. |
| `GET` | `/logout` | Limpia cookie y redirige a `FRONTEND_URL?logout=true`. |

### Respuestas de `/api/me`

```json
// 200 OK
{ "sub": "a8684b08-...", "email": "estudiante@ub.edu.ar", "name": "estudiante" }

// 401 Unauthorized
{ "error": "No token provided" }
{ "error": "Invalid or expired token" }
```

---

## Flujo interno detallado

```
Browser              Gateway                    Dex (interno: dex:5556)
  │                     │                              │
  │── GET /login ───────▶│                              │
  │                     │ genera state=ABC, nonce=XYZ   │
  │                     │ guarda pendingStates.set(ABC) │
  │◀── 302 → dex/auth?  │                              │
  │         state=ABC   │                              │
  │                                                    │
  │── GET dex/auth?... ────────────────────────────────▶│
  │◀── 302 → /callback?code=CODE&state=ABC ────────────│
  │                                                    │
  │── GET /callback?code=CODE&state=ABC ──▶│           │
  │                     │ verifica state en Map        │
  │                     │── POST dex:5556/dex/token ──▶│
  │                     │◀── {id_token: "eyJ..."} ─────│
  │                     │ jwt.decode(id_token) → claims│
  │                     │ jwt.sign({sub,email,name})   │
  │◀── 302 → /?token=JWT│                              │
  │                                                    │
  │── GET /api/me ───────▶│                             │
  │  Authorization: Bearer JWT                         │
  │                     │ jwt.verify(JWT, SECRET)      │
  │◀── 200 {sub,...} ───│                              │
```

---

## Variables de entorno

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `PORT` | No | `3001` | Puerto de escucha |
| `SESSION_SECRET` | **Sí** | `dev-secret` | Clave para firmar/verificar el JWT de sesión |
| `OIDC_ISSUER` | No | `http://localhost:5556/dex` | URL pública del IDP. Se usa para construir la auth URL que ve el browser |
| `OIDC_INTERNAL_URL` | No | igual a ISSUER | URL interna Docker. Se usa para el token exchange server-to-server |
| `OIDC_CLIENT_ID` | No | `gateway-client` | Client ID registrado en el IDP |
| `OIDC_CLIENT_SECRET` | **Sí** | `gateway-secret` | Client secret. Nunca llega al browser |
| `OIDC_CALLBACK_URL` | No | `http://localhost:3001/callback` | Redirect URI registrada en el IDP |
| `FRONTEND_URL` | No | `http://localhost:5173` | Destino post-login y post-logout |
| `PROGRESS_SERVICE_URL` | No | `http://localhost:3002` | URL del microservicio de progreso |

> `OIDC_ISSUER` ≠ `OIDC_INTERNAL_URL` en el docker-compose porque Dex necesita ver su issuer como `localhost:5556` (lo que ve el browser), pero el gateway en Docker no puede resolver `localhost` como el host. La separación de las dos URLs resuelve el problema sin nginx adicional.

---

## Estado en memoria

```javascript
const pendingStates = new Map()
// { state_hex: { nonce: string, createdAt: timestamp } }
```

Los states pendientes se limpian automáticamente si tienen más de 10 minutos (ejecutado en cada llamada a `/login`). El proceso no tiene persistencia: reiniciar el gateway invalida todos los flows OIDC en curso.

---

## Dependencias

| Paquete | Versión | Uso |
|---|---|---|
| `express` | ^4.18 | Framework HTTP |
| `cors` | ^2.8 | Headers CORS para el frontend |
| `axios` | ^1.6 | POST al token endpoint de Dex |
| `jsonwebtoken` | ^9.0 | Firmar/verificar JWT de sesión + decodificar id_token de Dex |
| `crypto` | built-in | `randomBytes` para state y nonce |

No hay ORM, base de datos, ni sistema de sesiones con estado persistente.

---

## Desarrollo local (sin Docker)

```bash
cd gateway
npm install

# Variables de entorno mínimas
export SESSION_SECRET=dev-only-secret
export OIDC_ISSUER=http://localhost:5556/dex
export OIDC_INTERNAL_URL=http://localhost:5556/dex  # mismo porque corres local
export FRONTEND_URL=http://localhost:5173

node index.js
# Gateway running on port 3001
```

Requiere que Dex esté corriendo (puede ser solo el container `parcial-dex`):
```bash
docker compose up -d dex
```

---

## Seguridad — limitaciones conocidas (scope: app de repaso)

| Limitación | Impacto | Mitigación para producción |
|---|---|---|
| `jwt.decode()` sin verificar firma del id_token | Un id_token manipulado podría inyectar claims. Mitigado porque el intercambio es server-to-server vía red interna | Usar `jose` o `openid-client` para verificar firma con JWKS |
| `pendingStates` en memoria del proceso | Si el gateway escala a múltiples instancias, el state puede no encontrarse | Usar Redis o una store compartida |
| `SESSION_SECRET` hardcodeado en compose | Visible en el repo | Usar Docker secrets o variables de entorno inyectadas en CI |
| CORS abierto al `FRONTEND_URL` | Solo afecta si el frontend está en un origen controlado | Correcto para este caso |

---

## Estructura del archivo

```
gateway/
├── index.js        ← Servidor completo (≈ 140 líneas)
├── package.json
├── Dockerfile
└── .dockerignore
```

Todo el código vive en un solo archivo. Si la lógica crece, extraer por responsabilidad: `routes/auth.js`, `middleware/verifyToken.js`.
