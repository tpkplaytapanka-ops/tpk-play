#!/bin/bash
# TPK PLAY - MediaMTX Setup Script
# Run as root on the VPS

echo "=== TPK PLAY - Instalando MediaMTX ==="

# 1. Download MediaMTX
echo "[1/5] Descargando MediaMTX..."
cd /tmp
wget -q https://github.com/bluenviron/mediamtx/releases/download/v1.11.3/mediamtx_v1.11.3_linux_amd64.tar.gz

if [ ! -f mediamtx_v1.11.3_linux_amd64.tar.gz ]; then
  echo "Error: No se pudo descargar MediaMTX"
  exit 1
fi

# 2. Extract and install
echo "[2/5] Instalando..."
tar -xzf mediamtx_v1.11.3_linux_amd64.tar.gz
mv mediamtx /usr/local/bin/
chmod +x /usr/local/bin/mediamtx

# 3. Create config directory
echo "[3/5] Configurando..."
mkdir -p /etc/mediamtx

# Copy config from project
if [ -f /var/www/tpk-play/mediamtix.yml ]; then
  cp /var/www/tpk-play/mediamtix.yml /etc/mediamtx/mediamtix.yml
else
  echo "Creando configuracion..."
  cat > /etc/mediamtx/mediamtix.yml << 'MEDIAMTXEOF'
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
webrtcICEServers2:
  - urls: [stun:stun.l.google.com:19302]

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
MEDIAMTXEOF
fi

# 4. Create systemd service
echo "[4/5] Creando servicio..."
cat > /etc/systemd/system/mediamtx.service << 'SVCEOF'
[Unit]
Description=MediaMTX Streaming Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/mediamtx /etc/mediamtx/mediamtix.yml
Restart=always
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
SVCEOF

# 5. Enable and start
echo "[5/5] Iniciando servicio..."
systemctl daemon-reload
systemctl enable mediamtx
systemctl start mediamtx

echo ""
echo "=== MediaMTX instalado correctamente ==="
echo "WHIP endpoint: http://localhost:8889/main/whip"
echo "HLS output: http://localhost:8888/main/index.m3u8"
echo "API: http://localhost:9997"
echo ""
echo "Verifica con: systemctl status mediamtx"
