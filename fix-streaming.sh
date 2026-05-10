#!/bin/bash
# TPK PLAY - Reparacion integral de streaming
# Mayo 10 2026 - Ejecutar como root

echo "========================================"
echo " TPK PLAY - Reparacion Integral"
echo "========================================"

# 1. Abrir puertos del firewall para streaming
echo ""
echo "[1/7] Abriendo puertos del firewall..."
ufw allow 8888/tcp > /dev/null 2>&1
ufw allow 8889/tcp > /dev/null 2>&1
ufw allow 8189/udp > /dev/null 2>&1
ufw allow 9997/tcp > /dev/null 2>&1
echo "Puertos abiertos: 8888 (HLS), 8889 (WHIP), 8189 (WebRTC UDP), 9997 (API)"

# 2. Actualizar codigo
echo ""
echo "[2/7] Actualizando codigo..."
cd /var/www/tpk-play
git pull origin main 2>&1 | tail -3

# 3. Reescribir configuracion de MediaMTX (formato correcto)
echo ""
echo "[3/7] Configurando MediaMTX..."
cat > /etc/mediamtx/mediamtix.yml << 'MTEOF'
logLevel: info
logDestinations: [stdout]

api: yes
apiAddress: :9997

rtsp: no
rtmp: no

hlsAddress: :8888
hlsAlwaysRemux: yes
hlsVariant: lowLatency
hlsSegmentCount: 7
hlsSegmentDuration: 1s
hlsPartDuration: 200ms

webrtcAddress: :8889
webrtcAllowOrigin: "*"
webrtcICEServers: stun:stun.l.google.com:19302

paths:
  main:
    source: publisher
    sourceOnDemand: no
    overridePublisher: yes
    runOnDemandCloseAfter: 30s
  tv1:
    source: publisher
    sourceOnDemand: no
    overridePublisher: yes
    runOnDemandCloseAfter: 30s
  tv2:
    source: publisher
    sourceOnDemand: no
    overridePublisher: yes
    runOnDemandCloseAfter: 30s
MTEOF
echo "MediaMTX configurado"

# 4. Reescribir configuracion de Nginx con SSL y proxy correcto
echo ""
echo "[4/7] Configurando Nginx..."
cat > /etc/nginx/sites-available/tpk-play << 'NGXEOF'
server {
    listen 80;
    server_name play.tapankatpk.com.co;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name play.tapankatpk.com.co;

    ssl_certificate /etc/letsencrypt/live/play.tapankatpk.com.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/play.tapankatpk.com.co/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /whip/ {
        proxy_pass http://127.0.0.1:8889/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location /hls/ {
        proxy_pass http://127.0.0.1:8888/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGXEOF
echo "Nginx configurado"

# 5. Instalar dependencias, build y copiar archivos
echo ""
echo "[5/7] Construyendo aplicacion..."
cd /var/www/tpk-play
npm install 2>&1 | tail -1
npx prisma generate 2>&1 | tail -1
npx prisma db push 2>&1 | tail -1
npm run build 2>&1 | tail -5

# 6. Reiniciar todos los servicios
echo ""
echo "[6/7] Reiniciando servicios..."
systemctl restart mediamtx
nginx -t 2>&1 && systemctl reload nginx
pm2 restart tpk-play

# 7. Verificar todo
echo ""
echo "[7/7] Verificando..."
sleep 3

echo ""
echo "--- Verificacion ---"
echo ""

# MediaMTX
if systemctl is-active --quiet mediamtx; then
    echo "[OK] MediaMTX: Activo"
else
    echo "[FALLA] MediaMTX: Inactivo"
    journalctl -u mediamtx --no-pager -n 3
fi

# Nginx
if systemctl is-active --quiet nginx; then
    echo "[OK] Nginx: Activo"
else
    echo "[FALLA] Nginx: Inactivo"
fi

# PM2
PM2_STATUS=$(pm2 jlist 2>/dev/null | grep -o '"status":"[^"]*"' | head -1)
if echo "$PM2_STATUS" | grep -q "online"; then
    echo "[OK] Next.js: Activo"
else
    echo "[FALLA] Next.js: Inactivo"
fi

# WHIP endpoint
WHIP_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS http://localhost:8889/main/whip)
if [ "$WHIP_TEST" = "204" ] || [ "$WHIP_TEST" = "200" ]; then
    echo "[OK] WHIP endpoint: Funcionando (HTTP $WHIP_TEST)"
else
    echo "[AVISO] WHIP endpoint: HTTP $WHIP_TEST (puede ser normal sin stream activo)"
fi

# HLS endpoint
HLS_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8888/main/index.m3u8)
echo "[INFO] HLS endpoint: HTTP $HLS_TEST (404 es normal sin stream activo)"

# API
API_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/broadcast)
if [ "$API_TEST" = "200" ]; then
    echo "[OK] API: Funcionando"
else
    echo "[FALLA] API: HTTP $API_TEST"
fi

echo ""
echo "========================================"
echo " Verificacion completa"
echo " Prueba en: https://play.tapankatpk.com.co/stream/broadcast"
echo "========================================"
