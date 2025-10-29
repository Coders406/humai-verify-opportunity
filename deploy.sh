#!/bin/bash

# Deploy Script para HUMAI Verify Opportunity
# Uso: ./deploy.sh

set -e

echo "🚀 Iniciando deploy do HUMAI Verify Opportunity..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERRO: $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] AVISO: $1${NC}"
}

# Verificar se está no diretório correto
if [ ! -f "backend/main.py" ] || [ ! -f "frontend/package.json" ]; then
    error "Execute este script na raiz do projeto (onde estão as pastas backend e frontend)"
fi

log "📦 Preparando ambiente..."

# Backend
log "🔧 Configurando backend..."
cd backend

# Verificar se .env existe
if [ ! -f ".env" ]; then
    warn "Arquivo .env não encontrado. Copiando de env.example..."
    cp env.example .env
    warn "IMPORTANTE: Configure as variáveis no arquivo .env antes de continuar!"
    echo "Pressione Enter para continuar após configurar o .env..."
    read
fi

# Ativar ambiente virtual se existir
if [ -d "venv" ]; then
    log "Ativando ambiente virtual..."
    source venv/bin/activate
else
    log "Criando ambiente virtual..."
    python3 -m venv venv
    source venv/bin/activate
fi

# Instalar dependências
log "Instalando dependências do backend..."
pip install -r requirements.txt

# Testar backend
log "Testando backend..."
python -c "import main; print('Backend OK')" || error "Erro no backend"

cd ..

# Frontend
log "🌐 Configurando frontend..."
cd frontend

# Verificar se .env.production existe
if [ ! -f ".env.production" ]; then
    log "Criando .env.production..."
    cat > .env.production << EOF
VITE_API_URL=http://145.241.188.248:8000
VITE_APP_TITLE=HUMAI - Verificar Oportunidade
VITE_APP_DENUNCIA_URL=https://humai.vercel.app/denuncia-publica
VITE_APP_MAIN_URL=https://humai.vercel.app
VITE_APP_VERSION=1.0.0
EOF
fi

# Instalar dependências
log "Instalando dependências do frontend..."
npm install

# Build
log "Fazendo build do frontend..."
npm run build

if [ ! -d "dist" ]; then
    error "Build do frontend falhou!"
fi

cd ..

log "✅ Deploy local concluído!"
log "📋 Próximos passos:"
echo "1. Configure o arquivo backend/.env com suas chaves"
echo "2. Faça upload dos arquivos para o servidor:"
echo "   scp -i ssh-key-2025-10-29.key -r . ubuntu@145.241.188.248:/var/www/humai-verify/"
echo "3. Conecte ao servidor e execute os comandos do DEPLOY_PRODUCAO.md"
echo ""
echo "🌐 Para testar localmente:"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3001"
