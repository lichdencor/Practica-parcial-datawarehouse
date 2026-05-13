# Progress Service — User Progress Manager

Microservicio encargado de persistir el progreso de los usuarios (respuestas a preguntas, estados de ejercicios SQL) en una base de datos MongoDB.

---

## Responsabilidades

1. **Persistencia de estado** — Guardar y recuperar objetos de progreso asociados a un `userId` (claim `sub` del OIDC).
2. **Abstracción de base de datos** — Manejar la conexión y el esquema de MongoDB.

---

## Endpoints (Internos)

Este servicio está diseñado para ser consumido a través del Gateway.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Health check. |
| `GET` | `/progress/:userId` | Obtiene el progreso del usuario. Si no existe, devuelve un objeto vacío. |
| `POST` | `/progress/:userId` | Crea o actualiza el progreso. Recibe `{ email, name, progress }`. |

---

## Esquema de datos (MongoDB)

```javascript
{
  userId: String,      // unique index
  email: String,
  name: String,
  progress: Map,       // { "questionId": "choiceId", "exerciseId": "sqlQuery" }
  lastUpdated: Date
}
```

---

## Variables de entorno

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `PORT` | No | `3002` | Puerto de escucha |
| `MONGODB_URI` | No | `mongodb://mongodb:27017/progress` | URI de conexión a MongoDB |

---

## Estructura

- `index.js`: Aplicación Express + Mongoose (archivo único).
- `Dockerfile`: Imagen basada en `node:20-slim`.
