#!/bin/bash

# Script para configurar o servidor de produção
# Execute no servidor: curl -sSL https://raw.githubusercontent.com/seu-repo/setup-server.sh | bash

set -e

echo "🖥️ Configurando servidor de produção..."

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERRO: $1${NC}"
    exit 1
}

# Atualizar sistema
log "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
log "🔧 Instalando dependências..."
sudo apt install -y curl wget git unzip software-properties-common

# Node.js 18
log "📦 Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python 3.11
log "🐍 Instalando Python 3.11..."
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Nginx
log "🌐 Instalando Nginx..."
sudo apt install -y nginx

# MongoDB
log "🍃 Instalando MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# PM2
log "⚙️ Instalando PM2..."
sudo npm install -g pm2

# Configurar PM2 para iniciar no boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Firewall
log "🔥 Configurando firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Criar diretórios
log "📁 Criando diretórios..."
sudo mkdir -p /var/humai-verify
sudo chown ubuntu:ubuntu /var/humai-verify
sudo mkdir -p /var/log/pm2
sudo chown ubuntu:ubuntu /var/log/pm2

# Configurar Nginx
log "🌐 Configurando Nginx..."
sudo tee /etc/nginx/sites-available/humai-verify > /dev/null << 'EOF'
server {
    listen 80;
    server_name 145.241.188.248;
    
    # Frontend
    location / {
        root /var/humai-verify/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache estático
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

# Ativar site
sudo ln -sf /etc/nginx/sites-available/humai-verify /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Criar script de deploy
log "📝 Criando script de deploy..."
tee /home/ubuntu/deploy-app.sh > /dev/null << 'EOF'
#!/bin/bash
cd /var/humai-verify

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
pm2 restart humai-backend || pm2 start ecosystem.config.js

# Frontend
cd ../frontend
npm install
npm run build

# Nginx
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deploy concluído!"
EOF

chmod +x /home/ubuntu/deploy-app.sh

# Criar ecosystem.config.js
log "⚙️ Criando configuração PM2..."
tee /var/humai-verify/ecosystem.config.js > /dev/null << 'EOF'
module.exports = {
  apps: [{
    name: 'humai-backend',
    script: 'main.py',
    cwd: '/var/humai-verify/backend',
    interpreter: '/var/humai-verify/backend/venv/bin/python',
    env: {
      NODE_ENV: 'production'
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/pm2/humai-backend-error.log',
    out_file: '/var/log/pm2/humai-backend-out.log',
    log_file: '/var/log/pm2/humai-backend.log'
  }]
};
EOF

log "✅ Servidor configurado com sucesso!"
log "📋 Próximos passos:"
echo "1. Faça upload do código:"
echo "   scp -i ssh-key-2025-10-29.key -r . ubuntu@145.241.188.248:/var/humai-verify/"
echo "2. Conecte ao servidor e configure o .env:"
echo "   ssh -i ssh-key-2025-10-29.key ubuntu@145.241.188.248"
echo "   cd /var/humai-verify/backend"
echo "   nano .env"
echo "3. Execute o deploy:"
echo "   ./deploy-app.sh"
echo ""
echo "🌐 URLs:"
echo "Frontend: http://145.241.188.248"
echo "Backend: http://145.241.188.248:8000"
