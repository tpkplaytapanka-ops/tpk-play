#!/bin/bash
# TPK PLAY - Reset completo desde cero
# Mayo 2026 - Ejecutar como root en el VPS

echo "========================================"
echo " TPK PLAY - Reset desde cero"
echo "========================================"

# 1. Borrar y recrear la base de datos
echo ""
echo "[1/6] Reseteando base de datos..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS tpkplay;" 2>&1
sudo -u postgres psql -c "CREATE DATABASE tpkplay OWNER tpkplay;" 2>&1
echo "Base de datos recreada"

# 2. Actualizar codigo
echo ""
echo "[2/6] Actualizando codigo..."
cd /var/www/tpk-play
git pull origin main 2>&1 | tail -3

# 3. Instalar dependencias y construir
echo ""
echo "[3/6] Construyendo aplicacion..."
npm install 2>&1 | tail -1
npx prisma generate 2>&1 | tail -1
npx prisma db push 2>&1 | tail -1
npm run build 2>&1 | tail -5

# Verificar que el build copio todo
if [ -f ".next/standalone/server.js" ]; then
    echo "server.js: OK"
else
    echo "ERROR: server.js no encontrado en .next/standalone/"
    exit 1
fi

if [ -d ".next/standalone/.next/static" ]; then
    echo "static files: OK"
else
    echo "ERROR: static files no copiados"
    cp -r .next/static .next/standalone/.next/
fi

if [ -f ".next/standalone/.env" ]; then
    echo ".env: OK"
else
    echo "Copiando .env..."
    cp .env .next/standalone/.env
fi

# 4. Configurar PM2 correctamente
echo ""
echo "[4/6] Configurando PM2..."
pm2 delete tpk-play 2>/dev/null
pm2 start ecosystem.config.js 2>&1 | tail -5
pm2 save 2>&1 | tail -1

# 5. Configurar MediaMTX
echo ""
echo "[5/6] Configurando MediaMTX..."
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
MTEOF
systemctl restart mediamtx 2>&1

# Abrir puertos del firewall
ufw allow 8888/tcp 2>/dev/null
ufw allow 8889/tcp 2>/dev/null
ufw allow 8189/udp 2>/dev/null
ufw allow 9997/tcp 2>/dev/null
echo "Puertos abiertos"

# 6. Configurar Nginx con SSL
echo ""
echo "[6/6] Configurando Nginx..."
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
nginx -t 2>&1 && systemctl reload nginx 2>&1

# Verificacion final
echo ""
echo "========================================"
echo " VERIFICACION"
echo "========================================"
sleep 3

OK=0
FAIL=0

# MediaMTX
if systemctl is-active --quiet mediamtx; then
    echo "[OK] MediaMTX"
    OK=$((OK+1))
else
    echo "[FALLA] MediaMTX"
    FAIL=$((FAIL+1))
fi

# Nginx
if systemctl is-active --quiet nginx; then
    echo "[OK] Nginx"
    OK=$((OK+1))
else
    echo "[FALLA] Nginx"
    FAIL=$((FAIL+1))
fi

# Next.js
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$HTTP_CODE" = "200" ]; then
    echo "[OK] Next.js (HTTP $HTTP_CODE)"
    OK=$((OK+1))
else
    echo "[FALLA] Next.js (HTTP $HTTP_CODE)"
    FAIL=$((FAIL+1))
fi

# API
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/broadcast)
if [ "$API_CODE" = "200" ]; then
    echo "[OK] API (HTTP $API_CODE)"
    OK=$((OK+1))
else
    echo "[FALLA] API (HTTP $API_CODE)"
    FAIL=$((FAIL+1))
fi

echo ""
echo "Resultados: $OK OK, $FAIL FALLAS"
echo ""
echo "========================================"
echo " Prueba: https://play.tapankatpk.com.co"
echo "========================================"
