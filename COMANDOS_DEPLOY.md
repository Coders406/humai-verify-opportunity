# 🚀 Comandos para Deploy em Produção

## 📋 Resumo Rápido

**Servidor**: 145.241.188.248  
**Usuário**: ubuntu  
**Chave SSH**: ssh-key-2025-10-29.key

## 🔧 Passo a Passo

### 1. Preparar código local
```bash
# Na sua máquina local
cd /home/black/Documents/00\ -\ UNODCHackaton_TSH/humai-verify-opportunity

# Executar script de preparação
./deploy.sh
```

### 2. Configurar servidor (primeira vez)
```bash
# Conectar ao servidor
ssh -i ssh-key-2025-10-29.key ubuntu@145.241.188.248

# Executar setup do servidor
curl -sSL https://raw.githubusercontent.com/seu-repo/setup-server.sh | bash
# OU executar manualmente os comandos do DEPLOY_PRODUCAO.md
```

### 3. Fazer upload do código
```bash
# Na sua máquina local
scp -i ssh-key-2025-10-29.key -r . ubuntu@145.241.188.248:/var/humai-verify/
```

### 4. Configurar variáveis de ambiente
```bash
# Conectar ao servidor
ssh -i ssh-key-2025-10-29.key ubuntu@145.241.188.248

# Configurar backend
cd /var/humai-verify/backend
cp env.example .env
nano .env
```

**Conteúdo do .env:**
```env
GOOGLE_API_KEY=sua_chave_google_gemini_aqui
MONGODB_URL=mongodb://localhost:27017
SECRET_KEY=sua_chave_secreta_super_segura_aqui
```

### 5. Configurar frontend
```bash
# No servidor
cd /var/humai-verify/frontend
cp env.production.example .env.production
nano .env.production
```

### 6. Executar deploy
```bash
# No servidor
cd /var/humai-verify
./deploy-app.sh
```

## 🔍 Verificar se está funcionando

### Testar backend
```bash
curl http://145.241.188.248:8000/test
```

### Testar frontend
```bash
curl http://145.241.188.248
```

### Ver logs
```bash
pm2 logs humai-backend
sudo tail -f /var/log/nginx/error.log
```

## 🆘 Troubleshooting

### Backend não inicia
```bash
cd /var/humai-verify/backend
source venv/bin/activate
python main.py
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
```

## 📱 URLs Finais

- **Frontend**: http://145.241.188.248
- **Backend API**: http://145.241.188.248:8000
- **Health Check**: http://145.241.188.248:8000/test

## 🔄 Atualizações futuras

```bash
# 1. Fazer upload do código atualizado
scp -i ssh-key-2025-10-29.key -r . ubuntu@145.241.188.248:/var/humai-verify/

# 2. Executar deploy
ssh -i ssh-key-2025-10-29.key ubuntu@145.241.188.248
cd /var/humai-verify
./deploy-app.sh
```

## 📊 Monitoramento

```bash
# Status dos serviços
pm2 status
sudo systemctl status nginx
sudo systemctl status mongod

# Logs em tempo real
pm2 logs humai-backend --lines 50
sudo tail -f /var/log/nginx/access.log
```
