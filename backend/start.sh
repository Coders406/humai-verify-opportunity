#!/bin/bash

# Instalar dependências se necessário
if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual..."
    python3 -m venv venv
fi

echo "Ativando ambiente virtual..."
source venv/bin/activate

echo "Instalando dependências..."
pip install -r requirements.txt

echo "Iniciando servidor..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
