#!/bin/bash

# Script de Exposición Unificado (Single Tunnel) v2
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

NGROK_BIN="/usr/local/bin/ngrok"

echo -e "${BLUE}--- DBS2 Parcial: Iniciando Túnel Unificado ---${NC}"

# 1. Iniciar túnel único
$NGROK_BIN http 5173 --log=stdout > ngrok_log.txt 2>&1 &
NGROK_PID=$!

sleep 10

# 2. Obtener la URL única
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -n 1 | cut -d'"' -f4)

if [ -z "$PUBLIC_URL" ]; then
    echo -e "${RED}Error: No se pudo obtener la URL de ngrok.${NC}"
    tail -n 10 ngrok_log.txt
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}Aplicación expuesta en: ${PUBLIC_URL}${NC}"

# 3. Actualizar dex/config.yaml de forma robusta
echo "Actualizando dex/config.yaml..."
# Reemplazar issuer
sed -i "s@issuer: .*@issuer: ${PUBLIC_URL}/dex@" dex/config.yaml

# Reemplazar redirectURIs de forma quirúrgica
# Buscamos la línea después de 'redirectURIs:' y la reemplazamos por la nueva URL
sed -i "/redirectURIs:/{n;s@- \".*\"@- \"${PUBLIC_URL}/callback\"@}" dex/config.yaml

# 4. Levantar Docker con las variables de entorno
echo "Reiniciando contenedores..."
OIDC_ISSUER="${PUBLIC_URL}/dex" \
FRONTEND_URL="${PUBLIC_URL}" \
OIDC_CALLBACK_URL="${PUBLIC_URL}/callback" \
VITE_GATEWAY_URL="${PUBLIC_URL}" \
docker compose up -d --build

# Forzar reinicio de Dex para asegurar que leyó la config
docker compose restart dex

echo -e "${BLUE}--- Listo! ---${NC}"
echo -e "Comparte esta URL con los alumnos: ${GREEN}${PUBLIC_URL}${NC}"

wait $NGROK_PID
kill $NGROK_PID 2>/dev/null
rm ngrok_log.txt
