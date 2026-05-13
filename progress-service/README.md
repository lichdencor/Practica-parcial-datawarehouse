# Progress Service — Persistencia de Usuarios y Contenido

Microservicio Express + Mongoose que gestiona dos dominios de persistencia en MongoDB: el **progreso** de los usuarios en el parcial y el **contenido editable** de la app (preguntas, teoría, práctica).

Diseñado para ser consumido exclusivamente a través del Gateway. No está expuesto al exterior.

---

## Responsabilidades

1. **Progreso de usuario** — Guardar y recuperar el mapa de respuestas de cada usuario.
2. **Gestión de roles** — Almacenar y actualizar el rol (`student` | `admin`) de cada usuario.
3. **Contenido editable** — Guardar versiones editadas de los datos de contenido de la app (questions, theory, quickPractice) para que el admin pueda sobreescribir el contenido estático sin tocar código.

---

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Health check. |
| `GET` | `/progress/:userId` | Obtiene el documento de progreso del usuario. Si no existe, devuelve `{ userId, progress: {} }`. |
| `POST` | `/progress/:userId` | Crea o actualiza progreso, email, name y role. Upsert: role solo se setea en inserción si no se provee explícitamente. |
| `GET` | `/users` | Lista todos los usuarios con `userId`, `email`, `name`, `role`, `lastUpdated`. |
| `PUT` | `/users/:userId/role` | Actualiza el rol de un usuario. Acepta `{ role: "student" \| "admin" }`. |
| `DELETE` | `/progress/:userId` | Resetea el progreso de un usuario (vacía el campo `progress`). |
| `GET` | `/content/:type` | Devuelve el documento de contenido para el tipo dado. `null` si no existe (el cliente cae en datos estáticos). |
| `PUT` | `/content/:type` | Crea o actualiza el contenido para el tipo dado. Acepta `{ data: any, updatedBy: string }`. |

---

## Esquemas MongoDB

### Colección `progresses`

```javascript
{
  userId:      String,     // unique index — claim 'sub' del OIDC
  email:       String,
  name:        String,
  role:        String,     // 'student' | 'admin', default: 'student'
  progress:    Map,        // { "questionId": "choiceId", ... }
  lastUpdated: Date
}
```

**Lógica de upsert para `role`:**
- Si `role` viene en el body del POST → se setea con `$set` (sobreescribe).
- Si `role` NO viene en el body → se usa `$setOnInsert: { role: 'student' }`, que solo aplica en la inserción inicial. Los documentos existentes no ven su rol modificado.

Esto permite que el Gateway fuerce `admin` en el POST de registro para super-admins, sin tocar el rol de usuarios existentes en logins subsiguientes.

### Colección `contents`

```javascript
{
  type:        String,     // unique — 'questions' | 'theory' | 'quickPractice'
  data:        Mixed,      // JSON blob que refleja la estructura del archivo TS correspondiente
  lastUpdated: Date,
  updatedBy:   String      // email del admin que hizo el último cambio
}
```

Si no existe un documento para un `type`, el Gateway devuelve `null` y el frontend usa los datos estáticos del bundle.

---

## Variables de entorno

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `PORT` | No | `3002` | Puerto de escucha |
| `MONGODB_URI` | No | `mongodb://mongodb:27017/progress` | URI de conexión a MongoDB |

---

## Estructura

```
progress-service/
├── index.js      ← Express + Mongoose (archivo único, ~100 líneas)
├── package.json
└── Dockerfile
```
