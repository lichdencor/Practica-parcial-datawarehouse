# Dex — Identity Provider (OIDC)

[Dex](https://dexidp.io/) es el Identity Provider que provee autenticación OpenID Connect para la app. En este proyecto corre con almacenamiento en memoria y un único usuario estático, suficiente para un entorno de desarrollo local.

---

## Rol en la arquitectura

Dex es el único componente que conoce las credenciales de los usuarios. El browser se redirige a Dex para el login; Dex valida las credenciales y emite un `id_token` que el gateway intercambia internamente.

```
Browser ──── GET /dex/auth?... ────▶ Dex
Browser ◀─── formulario de login ── Dex
Browser ──── POST credenciales ────▶ Dex
Browser ◀─── 302 /callback?code ─── Dex
Gateway ──── POST /dex/token ──────▶ Dex   (red interna Docker)
Gateway ◀─── {id_token, access_token} ──── Dex
```

---

## Configuración (`config.yaml`)

```yaml
issuer: http://localhost:5556/dex
```

La URL pública que Dex pone en el claim `iss` de los tokens y en el discovery document. Debe coincidir con la URL que el browser usa para llegar a Dex.

```yaml
storage:
  type: memory
```

Sin base de datos. Todo el estado (sesiones, tokens) vive en RAM. **Se pierde al reiniciar el container.**

```yaml
web:
  http: 0.0.0.0:5556
```

Dex escucha en todas las interfaces del container en el puerto 5556.

```yaml
oauth2:
  skipApprovalScreen: true
  responseTypes:
    - code
```

No muestra la pantalla de "¿Autorizar a esta aplicación?". Solo soporta Authorization Code flow.

```yaml
staticClients:
  - id: gateway-client
    secret: gateway-secret
    name: "DBS2 Parcial Gateway"
    redirectURIs:
      - "http://localhost:3001/callback"
```

El único cliente OIDC registrado es el gateway. El `redirectURI` debe coincidir exactamente con `OIDC_CALLBACK_URL` del gateway.

```yaml
enablePasswordDB: true

staticPasswords:
  - email: "estudiante@ub.edu.ar"
    hash: "$2b$10$xwRC3iSX0db24ZqqSqtBGOzQOeNdOBgW870uZaWnIsiU1x9VBybBu"
    username: "estudiante"
    userID: "a8684b08-db88-4b73-90a9-3cd1661f5466"
```

Habilita la base de datos de contraseñas local. El hash corresponde a la contraseña `password` con bcrypt cost 10.

---

## Endpoints expuestos

| Endpoint | Uso |
|---|---|
| `GET /dex/.well-known/openid-configuration` | Discovery document (issuer, endpoints, scopes soportados) |
| `GET /dex/auth` | Inicia el flujo de autorización. El browser es redirigido aquí. |
| `POST /dex/token` | Intercambia un `code` por tokens. Llamado por el gateway, no el browser. |
| `GET /dex/keys` | JWKS público para verificar la firma de los tokens. |
| `GET /dex/userinfo` | Devuelve claims del usuario autenticado (requiere access_token). |

---

## Añadir o cambiar usuarios

### Generar un hash bcrypt

```bash
# Opción A: usando node_modules ya instalados en el proyecto
node -e "
  const b = require('./gateway/node_modules/bcryptjs');
  console.log(b.hashSync('mi-nueva-contraseña', 10));
"

# Opción B: Python con bcrypt instalado
python3 -c "import bcrypt; print(bcrypt.hashpw(b'mi-nueva-contraseña', bcrypt.gensalt(10)).decode())"

# Opción C: Docker con htpasswd
docker run --rm httpd:alpine htpasswd -nbBC 10 "" mi-nueva-contraseña | sed 's/://'
```

### Agregar usuario en `config.yaml`

```yaml
staticPasswords:
  - email: "otro@ub.edu.ar"
    hash: "$2b$10$..."   # hash generado arriba
    username: "otro"
    userID: "uuid-diferente-por-usuario"   # debe ser único
```

Los `userID` pueden generarse con:

```bash
python3 -c "import uuid; print(uuid.uuid4())"
```

### Aplicar cambios

```bash
docker compose restart dex
```

---

## Scopes disponibles

El gateway solicita `openid profile email`. Los claims que Dex incluye en el `id_token`:

| Claim | Valor de ejemplo |
|---|---|
| `sub` | `"a8684b08-db88-4b73-90a9-3cd1661f5466"` |
| `email` | `"estudiante@ub.edu.ar"` |
| `email_verified` | `true` |
| `name` | `"estudiante"` |
| `preferred_username` | `"estudiante"` |
| `iss` | `"http://localhost:5556/dex"` |
| `exp` | timestamp de expiración |

---

## Extensiones posibles

| Escenario | Cambio en `config.yaml` |
|---|---|
| Login con Google | Agregar un `connector` de tipo `oidc` apuntando a Google |
| Login con GitHub | Agregar un `connector` de tipo `github` |
| Persistencia entre reinicios | Cambiar `storage.type: memory` a `storage.type: sqlite3` con un volumen |
| Múltiples aplicaciones | Agregar más entradas en `staticClients` |
| Usuarios desde LDAP | Agregar `connector` de tipo `ldap` |

Ver: [dexidp.io/docs/connectors](https://dexidp.io/docs/connectors/)

---

## Notas sobre `issuer` y red Docker

El `issuer` está seteado como `http://localhost:5556/dex` (la URL pública).  
Dex pone esta URL en el discovery document y en el claim `iss` de los tokens.

El gateway (que corre dentro de Docker) llama al token endpoint usando `http://dex:5556/dex/token` (hostname interno), pero los tokens tienen `iss: http://localhost:5556/dex`. El gateway usa `jwt.decode()` sin verificar la firma para extraer los claims, evitando el problema de validar el issuer contra una URL inalcanzable desde dentro del container.

Si en el futuro se quiere validar la firma del id_token, hay dos opciones:

1. Hacer que el gateway también use `OIDC_INTERNAL_URL` para obtener el JWKS (descubrimiento manual).
2. Cambiar el issuer a un hostname DNS que sea resoluble tanto desde el browser como desde el container (ej: usando un hostname en `/etc/hosts` del host).
