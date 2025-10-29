#!/usr/bin/env python3
"""
Script para testar a conexão com MongoDB
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def test_mongodb():
    """Testa a conexão com MongoDB"""
    mongodb_url = os.getenv('MONGODB_URL', 'mongodb://localhost:27017')
    
    try:
        client = AsyncIOMotorClient(mongodb_url)
        
        # Testar conexão
        await client.admin.command('ping')
        print("✅ Conexão com MongoDB estabelecida com sucesso!")
        
        # Testar banco de dados
        db = client.humai_verify
        collection = db.vagas
        
        # Inserir documento de teste
        test_doc = {
            "titulo": "Teste de Conexão",
            "empresa": "Sistema",
            "nivel_risco": "BAIXO",
            "pontuacao_risco": 10,
            "data_analise": "2024-01-01T00:00:00Z"
        }
        
        result = await collection.insert_one(test_doc)
        print(f"✅ Documento de teste inserido com ID: {result.inserted_id}")
        
        # Contar documentos
        count = await collection.count_documents({})
        print(f"✅ Total de documentos na coleção: {count}")
        
        # Limpar documento de teste
        await collection.delete_one({"_id": result.inserted_id})
        print("✅ Documento de teste removido")
        
        client.close()
        print("✅ Conexão fechada com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao conectar com MongoDB: {e}")
        print("💡 Certifique-se de que o MongoDB está rodando em localhost:27017")

if __name__ == "__main__":
    asyncio.run(test_mongodb())
