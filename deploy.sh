#!/bin/bash
# TPK PLAY - VPS Deployment Script
# Usage: ./deploy.sh [branch]

set -e

BRANCH=${1:-main}
APP_DIR="/var/www/tpk-play"
LOG_DIR="/var/log/tpk-play"

echo "🚀 TPK PLAY - Iniciando despliegue..."
echo "Branch: $BRANCH"
echo "Directory: $APP_DIR"
echo ""

# Create log directory if it doesn't exist
mkdir -p $LOG_DIR

# Navigate to app directory
cd $APP_DIR

# Pull latest code
echo "📦 Actualizando código..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Install dependencies
echo "📥 Instalando dependencias..."
npm ci --production=false

# Generate Prisma client
echo "🔧 Generando Prisma client..."
npx prisma generate

# Build the application
echo "🔨 Construyendo aplicación..."
npm run build

# Restart the application
echo "🔄 Reiniciando aplicación..."
if command -v pm2 &> /dev/null; then
    pm2 restart tpk-play || pm2 start ecosystem.config.js
    pm2 save
else
    echo "⚠️ PM2 no encontrado. Instalando..."
    npm install -g pm2
    pm2 start ecosystem.config.js
    pm2 startup
    pm2 save
fi

echo ""
echo "✅ ¡Despliegue completado exitosamente!"
echo "📊 Estado de la aplicación:"
pm2 status tpk-play
echo ""
echo "📝 Últimos logs:"
pm2 logs tpk-play --lines 10 --nostream
