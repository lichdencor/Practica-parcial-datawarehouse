#!/bin/bash

# Script para exponer la app de DBS2 usando ngrok
# Requiere tener ngrok instalado y autenticado.

# Colores para la terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}--- DBS2 Parcial: Iniciando Túneles ngrok ---${NC}"

# 1. Iniciar ngrok en segundo plano si no está corriendo
# Usamos un archivo de config temporal para lanzar dos túneles
cat <<EOF > ngrok_temp.yml
tunnels:
  frontend:
    proto: http
    addr: 5173
  dex:
    proto: http
    addr: 5556
EOF

echo "Iniciando túneles..."
ngrok start --config ngrok_temp.yml frontend dex > /dev/null &
NGROK_PID=$!

# Esperar a que los túneles levanten
sleep 5

# 2. Obtener las URLs públicas
FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels | node -e "const t = JSON.parse(fs.readFileSync(0)).tunnels; console.log(t.find(x => x.name === 'frontend').public_url)")
DEX_URL=$(curl -s http://localhost:4040/api/tunnels | node -e "const t = JSON.parse(fs.readFileSync(0)).tunnels; console.log(t.find(x => x.name === 'dex').public_url)")

if [ -z "$FRONTEND_URL" ] || [ -z "$DEX_URL" ]; then
    echo -e "${RED}Error: No se pudieron obtener las URLs de ngrok. ¿Está ngrok instalado y funcionando?${NC}"
    kill $NGROK_PID
    rm ngrok_temp.yml
    exit 1
fi

echo -e "${GREEN}Frontend expuesto en: ${FRONTEND_URL}${NC}"
echo -e "${GREEN}Dex expuesto en:      ${DEX_URL}${NC}"

# 3. Actualizar configuraciones
echo "Actualizando configuraciones locales..."

# Actualizar dex/config.yaml (usando una versión temporal para no perder la original)
sed -i "s|issuer: .*|issuer: ${DEX_URL}/dex|" dex/config.yaml
# Actualizar el redirectURI en dex/config.yaml (asumimos que es la primera ocurrencia de redirectURIs)
sed -i "s|- \"http://localhost:3001/callback\"|- \"${FRONTEND_URL}/callback\"|" dex/config.yaml

# 4. Levantar Docker con las nuevas URLs como env vars
echo "Reiniciando contenedores con URLs públicas..."
OIDC_ISSUER="${DEX_URL}/dex" \
FRONTEND_URL="${FRONTEND_URL}" \
OIDC_CALLBACK_URL="${FRONTEND_URL}/callback" \
docker compose up -d --build

echo -e "${BLUE}--- Listo! ---${NC}"
echo -e "Acceso alumnos: ${GREEN}${FRONTEND_URL}${NC}"
echo "Presiona Ctrl+C para cerrar los túneles y detener el script (los contenedores seguirán corriendo)."

# Mantener el script vivo para que el proceso de ngrok no muera
wait $NGROK_PID

# Cleanup al salir
kill $NGROK_PID
rm ngrok_temp.yml
