"""
Script para inserir usuário e instituição da PGR no banco de dados
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from passlib.context import CryptContext
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
mongodb_url = os.getenv('MONGODB_URL', 'mongodb://localhost:27017')

async def insert_user():
    client = AsyncIOMotorClient(mongodb_url)
    db = client.humai_verify
    usuarios_collection = db.usuarios
    instituicoes_collection = db.instituicoes
    
    # Dados da instituição PGR
    instituicao_id = ObjectId("69015fad166f78dd164e3bcd")
    
    instituicao_data = {
        "_id": instituicao_id,
        "nome": "Procuradoria Geral da República",
        "codigoAcesso": "PGR001",
        "dataCriacao": datetime.utcnow(),
        "ativo": True
    }
    
    # Verificar se a instituição já existe
    existing_instituicao = await instituicoes_collection.find_one({"_id": instituicao_id})
    if not existing_instituicao:
        await instituicoes_collection.insert_one(instituicao_data)
        print(f"✅ Instituição PGR criada com ID: {instituicao_id}")
    else:
        print(f"ℹ️  Instituição PGR já existe com ID: {instituicao_id}")
        # Atualizar dados se necessário
        await instituicoes_collection.update_one(
            {"_id": instituicao_id},
            {"$set": {
                "nome": instituicao_data["nome"],
                "codigoAcesso": instituicao_data["codigoAcesso"],
                "ativo": instituicao_data["ativo"]
            }}
        )
        print(f"✅ Instituição PGR atualizada")
    
    # Hash da senha
    senha_hash = pwd_context.hash("123456")
    
    # Dados do usuário
    user_id = ObjectId("69015fad166f78dd164e3be5")
    
    user_data = {
        "_id": user_id,
        "nome": "Rita Oliveira",
        "email": "rita@pgr.gov.mz",
        "senha": senha_hash,
        "instituicaoId": instituicao_id,
        "perfil": "AUTORIDADE",
        "ativo": True,
        "dataCriacao": datetime.utcnow(),
        "ultimoLogin": None
    }
    
    # Verificar se o usuário já existe
    existing_user = await usuarios_collection.find_one({"_id": user_id})
    if not existing_user:
        await usuarios_collection.insert_one(user_data)
        print(f"✅ Usuário Rita Oliveira criado com ID: {user_id}")
        print(f"   Email: rita@pgr.gov.mz")
        print(f"   Senha: 123456")
        print(f"   Código Instituição: PGR001")
    else:
        print(f"ℹ️  Usuário Rita Oliveira já existe com ID: {user_id}")
        # Atualizar senha e dados se necessário
        await usuarios_collection.update_one(
            {"_id": user_id},
            {"$set": {
                "senha": senha_hash,
                "ativo": user_data["ativo"],
                "perfil": user_data["perfil"]
            }}
        )
        print(f"✅ Usuário atualizado")
        print(f"   Email: rita@pgr.gov.mz")
        print(f"   Senha: 123456")
        print(f"   Código Instituição: PGR001")
    
    client.close()
    print("\n✅ Processo concluído!")

if __name__ == "__main__":
    asyncio.run(insert_user())

