# HumAI Verify Opportunity - Backend

Backend API para análise de oportunidades de emprego usando LLM (Google Gemini).

## Configuração

1. **Instalar dependências:**
```bash
pip install -r requirements.txt
```

2. **Configurar API Key:**
   - Copie `env.example` para `.env`
   - Adicione sua chave da API do Google Gemini:
   ```
   GOOGLE_API_KEY=sua_chave_aqui
   ```

3. **Executar o servidor:**
```bash
# Opção 1: Usar script
./start.sh

# Opção 2: Executar diretamente
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### POST /analyze
Analisa uma oportunidade de emprego.

**Request Body:**
```json
{
  "tipoEntrada": "LINK" | "TEXTO",
  "linkOportunidade": "https://exemplo.com/vaga",
  "textoPublicacao": "Texto da vaga..."
}
```

**Response:**
```json
{
  "nivelRisco": "BAIXO" | "MEDIO" | "ALTO" | "CRITICO",
  "pontuacao": 0-100,
  "alertas": ["lista de alertas"],
  "recomendacoes": ["lista de recomendações"],
  "detalhes": {
    "tituloSuspeito": boolean,
    "empresaSuspeita": boolean,
    "descricaoVaga": boolean,
    "requisitosVagos": boolean,
    "salarioIrreal": boolean,
    "contatoSuspeito": boolean,
    "plataformaSuspeita": boolean
  }
}
```

## Funcionalidades

- **Análise por Link:** Extrai conteúdo automaticamente de URLs
- **Análise por Texto:** Analisa texto fornecido diretamente
- **Cache:** Evita requisições repetidas para a mesma URL
- **Fallback:** Sistema de backup em caso de erro

## Dependências

- FastAPI: Framework web
- Google Generative AI: Modelo LLM
- BeautifulSoup: Extração de conteúdo web
- Requests: Requisições HTTP
