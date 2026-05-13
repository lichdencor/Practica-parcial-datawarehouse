# Guía de Exposición con ngrok — DBS2 Parcial

Esta guía explica cómo exponer la aplicación localmente para que los alumnos puedan acceder desde fuera de tu red.

---

## Prerequisitos

1.  **ngrok instalado:** [Descargar aquí](https://ngrok.com/download).
2.  **Auth Token configurado:** Ejecutar `ngrok config add-authtoken <tu-token>`.
3.  **Docker & Docker Compose:** Funcionando correctamente.

---

## Exposición Automática (Recomendado)

He creado un script `expose.sh` que automatiza todo el proceso de túneles y reconfiguración de OIDC.

### Pasos:

1.  **Ejecutar el script:**
    ```bash
    ./expose.sh
    ```
2.  **Qué hace el script:**
    - Abre dos túneles: uno para el Frontend (:5173) y otro para Dex (:5556).
    - Obtiene las URLs dinámicas de ngrok.
    - Modifica `dex/config.yaml` con el nuevo `issuer` y `redirectURI`.
    - Reinicia los contenedores de Docker inyectando las URLs de ngrok como variables de entorno.
3.  **Compartir URL:** Al finalizar, el script te dará la URL pública (ej: `https://abc-123.ngrok-free.app`). **Esa es la URL que deben usar los alumnos.**

> **Nota:** No cierres la terminal mientras los alumnos estén rindiendo, ya que el túnel de ngrok se cerrará.

---

## Exposición Manual (Si el script falla)

Si prefieres hacerlo a mano, sigue este orden:

1.  **Lanzar túneles:**
    ```bash
    ngrok http 5173
    ngrok http 5556
    ```
2.  **Actualizar Dex (`dex/config.yaml`):**
    - `issuer`: Pon la URL que ngrok te dio para el puerto 5556, terminada en `/dex`.
    - `staticClients[0].redirectURIs`: Pon la URL de ngrok para el puerto 5173, terminada en `/callback`.
3.  **Actualizar Gateway (`docker-compose.yml` o env vars):**
    - `OIDC_ISSUER`: URL de ngrok puerto 5556 + `/dex`.
    - `FRONTEND_URL`: URL de ngrok puerto 5173.
    - `OIDC_CALLBACK_URL`: URL de ngrok puerto 5173 + `/callback`.
4.  **Reiniciar todo:**
    ```bash
    docker compose up -d --build
    ```

---

## Consideraciones de Seguridad

- **Cookie auth_token:** Nginx sigue validando la cookie. Si alguien intenta entrar sin pasar por el login de Dex, será redirigido.
- **Túneles temporales:** Cada vez que reinicies ngrok (sin cuenta paga), las URLs cambiarán. Deberás volver a ejecutar el script.
- **CORS:** El gateway está configurado para aceptar el `FRONTEND_URL` dinámico que inyecta el script.
