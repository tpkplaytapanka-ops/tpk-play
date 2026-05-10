#!/bin/bash
echo "=== TPK PLAY - Reparacion completa ==="

echo "[1/6] Actualizando codigo..."
cd /var/www/tpk-play
git pull origin main

echo "[2/6] Instalando dependencias..."
npm install 2>&1 | tail -3

echo "[3/6] Regenerando Prisma..."
npx prisma generate 2>&1 | tail -3

echo "[4/6] Sincronizando base de datos..."
npx prisma db push 2>&1 | tail -3

echo "[5/6] Construyendo aplicacion..."
npm run build 2>&1 | tail -10

echo "[6/6] Reiniciando..."
pm2 restart tpk-play

echo ""
echo "=== Listo! Verifica en: https://play.tapankatpk.com.co ==="
