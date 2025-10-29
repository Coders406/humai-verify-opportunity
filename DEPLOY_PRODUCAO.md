# Deploy em Produção - HUMAI Verificar Oportunidade

## 🖥️ Servidor
- **IP**: 145.241.188.248
- **Usuário**: ubuntu
- **Chave SSH**: ssh-key-2025-10-29.key

## 📋 Pré-requisitos no Servidor

### 1. Conectar ao servidor
```bash
ssh -i ssh-key-2025-10-29.key ubuntu@145.241.188.248
```

### 2. Atualizar sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Instalar dependências
```bash
# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python 3.11+
sudo apt install python3.11 python3.11-venv python3.11-dev python3-pip -y

# Nginx
sudo apt install nginx -y

# MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# PM2 para gerenciar processos
sudo npm install -g pm2

# Git
sudo apt install git -y
```

## 🚀 Deploy do Backend

### 1. Preparar ambiente
```bash
# Criar diretório do projeto
sudo mkdir -p /var/humai-verify
sudo chown ubuntu:ubuntu /var/humai-verify
cd /var/humai-verify

# Clonar repositório (ou fazer upload dos arquivos)
git clone <seu-repositorio> .
# OU fazer upload via scp:
# scp -i ssh-key-2025-10-29.key -r . ubuntu@145.241.188.248:/var/humai-verify/
```

### 2. Configurar backend
```bash
cd /var/humai-verify/backend

# Criar ambiente virtual
python3.11 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp env.example .env
nano .env
```

### 3. Configurar .env do backend
```env
GOOGLE_API_KEY=sua_chave_google_gemini_aqui
MONGODB_URL=mongodb://localhost:27017
SECRET_KEY=sua_chave_secreta_super_segura_aqui
```

### 4. Testar backend
```bash
# Ativar ambiente virtual
source venv/bin/activate

# Testar
python main.py
# Deve rodar em http://localhost:8000
```

### 5. Configurar PM2 para backend
```bash
# Criar arquivo de configuração PM2
nano ecosystem.config.js
```

```javascript
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
```

```bash
# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 Deploy do Frontend

### 1. Build do frontend
```bash
cd /var/humai-verify/frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
nano .env.production
```

### 2. Configurar .env.production
```env
VITE_API_URL=http://145.241.188.248:8000
VITE_APP_TITLE=HUMAI - Verificar Oportunidade
VITE_APP_DENUNCIA_URL=https://humai.vercel.app/denuncia-publica
VITE_APP_MAIN_URL=https://humai.vercel.app
VITE_APP_VERSION=1.0.0
```

### 3. Build para produção
```bash
npm run build
```

### 4. Configurar Nginx
```bash
sudo nano /etc/nginx/sites-available/humai-verify
```

```nginx
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
```

### 5. Ativar site
```bash
sudo ln -s /etc/nginx/sites-available/humai-verify /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔧 Configurações Finais

### 1. Firewall
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Verificar serviços
```bash
# Verificar status
pm2 status
sudo systemctl status nginx
sudo systemctl status mongod

# Ver logs
pm2 logs humai-backend
sudo tail -f /var/log/nginx/error.log
```

### 3. Testar aplicação
```bash
# Testar backend
curl http://145.241.188.248:8000/test

# Testar frontend
curl http://145.241.188.248
```

## 🔄 Scripts de Deploy

### Deploy rápido
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Iniciando deploy..."

# Backend
cd /var/humai-verify/backend
source venv/bin/activate
pip install -r requirements.txt
pm2 restart humai-backend

# Frontend
cd /var/humai-verify/frontend
npm install
npm run build

# Nginx
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deploy concluído!"
```

### Backup
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/humai-verify"

mkdir -p $BACKUP_DIR

# Backup do código
tar -czf $BACKUP_DIR/code_$DATE.tar.gz /var/humai-verify

# Backup do MongoDB
mongodump --out $BACKUP_DIR/mongodb_$DATE

echo "Backup criado: $BACKUP_DIR"
```

## 📊 Monitoramento

### 1. Logs
```bash
# Backend
pm2 logs humai-backend

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Sistema
sudo journalctl -u nginx -f
```

### 2. Status dos serviços
```bash
pm2 status
sudo systemctl status nginx
sudo systemctl status mongod
```

### 3. Recursos
```bash
htop
df -h
free -h
```

## 🔐 Segurança

### 1. SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seu-dominio.com
```

### 2. Firewall adicional
```bash
sudo ufw deny 8000  # Bloquear acesso direto ao backend
```

## 🆘 Troubleshooting

### Backend não inicia
```bash
pm2 logs humai-backend
source venv/bin/activate
python main.py  # Testar diretamente
```

### Frontend não carrega
```bash
sudo nginx -t
sudo systemctl status nginx
ls -la /var/humai-verify/frontend/dist/
```

### MongoDB não conecta
```bash
sudo systemctl status mongod
sudo systemctl restart mongod
mongo --eval "db.adminCommand('ismaster')"
```

## 📱 URLs de Acesso

- **Frontend**: http://145.241.188.248
- **Backend API**: http://145.241.188.248:8000
- **Health Check**: http://145.241.188.248:8000/test

## 🔄 Atualizações

Para atualizar o sistema:
1. Fazer backup
2. Atualizar código
3. Executar `deploy.sh`
4. Verificar logs
5. Testar funcionalidades
