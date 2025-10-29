from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
import os
import json
import re
from datetime import datetime, timedelta
from dotenv import load_dotenv
import google.generativeai as genai
import requests
from bs4 import BeautifulSoup
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt

# Configuração inicial
load_dotenv()
api_key = os.getenv('GOOGLE_API_KEY')
mongodb_url = os.getenv('MONGODB_URL', 'mongodb://localhost:27017')

if not api_key or len(api_key) < 10:
    raise ValueError("API key inválida. Verifique o arquivo .env")

genai.configure(api_key=api_key)

# Configurações de segurança para evitar loops infinitos
generation_config = {
    "temperature": 0.1,
    "top_p": 0.8,
    "top_k": 40,
    "max_output_tokens": 4000,
    "stop_sequences": ["```", "---", "==="]
}

safety_settings = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    }
]

model = genai.GenerativeModel('gemini-2.0-flash')

# Configuração do MongoDB
client = AsyncIOMotorClient(mongodb_url)
db = client.humai_verify
vagas_collection = db.vagas
usuarios_collection = db.usuarios
instituicoes_collection = db.instituicoes

# Configuração de segurança
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

app = FastAPI(title="HumAI Verify Opportunity API", version="1.0.0")

# CORS middleware - deve ser adicionado ANTES de definir rotas
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:3002", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Headers para requisições web
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
}

# Cache simples
_cache = {}

# URLs confiáveis conhecidas
TRUSTED_DOMAINS = {
    # Sites de empregos confiáveis
    'linkedin.com', 'linkedin.co.mz',
    'indeed.com', 'indeed.co.mz',
    'glassdoor.com', 'glassdoor.co.mz',
    'reed.co.uk', 'reed.co.mz',
    'emprego.co.mz', 'emprego.co.za',
    'jobartis.co.mz', 'jobartis.co.za',
    'jobs.co.mz', 'jobs.co.za',
    'vagas.co.mz', 'vagas.co.za',
    
    # Sites de empresas conhecidas
    'unodc.org', 'un.org',
    'microsoft.com', 'google.com', 'apple.com',
    'amazon.com', 'facebook.com', 'meta.com',
    'netflix.com', 'spotify.com', 'uber.com',
    'airbnb.com', 'tesla.com', 'spacex.com',
    'ibm.com', 'oracle.com', 'salesforce.com',
    'adobe.com', 'intel.com', 'nvidia.com',
    'cisco.com', 'vmware.com', 'redhat.com',
    
    # Sites governamentais
    'gov.mz', 'gov.za', 'gov.br', 'gov.uk',
    'un.org', 'worldbank.org', 'imf.org',
    'who.int', 'unicef.org', 'undp.org',
    
    # Sites educacionais
    'harvard.edu', 'mit.edu', 'stanford.edu',
    'cambridge.ac.uk', 'oxford.ac.uk',
    'up.ac.za', 'uct.ac.za', 'wits.ac.za',
    'uem.mz', 'up.ac.mz', 'isctem.ac.mz',
    
    # Sites de notícias confiáveis
    'bbc.com', 'cnn.com', 'reuters.com',
    'dw.com', 'france24.com', 'aljazeera.com',
    'rt.com', 'sputniknews.com',
    'noticias.sapo.mz', 'opais.co.mz',
    'jornalnoticias.co.mz', 'verdade.co.mz',
    
    # Sites de ONGs confiáveis
    'amnesty.org', 'hrw.org', 'transparency.org',
    'oxfam.org', 'msf.org', 'doctorswithoutborders.org',
    'redcross.org', 'unicef.org', 'unhcr.org',
    'wfp.org', 'fao.org', 'ilo.org',
    
    # Sites de empresas moçambicanas conhecidas
    'mcel.co.mz', 'vodacom.co.mz', 'movitel.co.mz',
    'bci.co.mz', 'bancounico.co.mz', 'bancobci.co.mz',
    'bancobm.co.mz', 'bancobm.co.mz', 'bancobm.co.mz',
    'coca-cola.co.mz', 'pepsi.co.mz', 'nestle.co.mz',
    'unilever.co.mz', 'procter.co.mz', 'gamble.co.mz',
    'shell.co.mz', 'total.co.mz', 'exxonmobil.co.mz',
    'sasol.co.mz', 'sasol.co.za', 'sasol.com',
    'sasol.com', 'sasol.co.za', 'sasol.co.mz',
}

def is_trusted_url(url: str) -> bool:
    """
    Verifica se uma URL é de uma fonte confiável conhecida.
    """
    if not url:
        return False
    
    try:
        # Extrair domínio da URL
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        
        # Remover www. se presente
        if domain.startswith('www.'):
            domain = domain[4:]
        
        # Verificar se o domínio está na lista de confiáveis
        return domain in TRUSTED_DOMAINS
    
    except Exception:
        return False

def get_url_trust_info(url: str) -> Dict[str, Any]:
    """
    Retorna informações sobre a confiabilidade da URL.
    """
    if not url:
        return {
            'is_trusted': False,
            'trust_level': 'UNKNOWN',
            'trust_reason': 'URL não fornecida',
            'domain_type': 'UNKNOWN'
        }
    
    is_trusted = is_trusted_url(url)
    
    if is_trusted:
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url if url.startswith(('http://', 'https://')) else 'https://' + url)
            domain = parsed.netloc.lower()
            if domain.startswith('www.'):
                domain = domain[4:]
            
            # Determinar tipo de domínio
            if any(x in domain for x in ['linkedin', 'indeed', 'glassdoor', 'monster', 'reed', 'totaljobs', 'ziprecruiter', 'careerbuilder', 'simplyhired', 'emprego', 'jobartis', 'jobs', 'vagas', 'trabalho']):
                domain_type = 'JOB_PORTAL'
                trust_reason = 'Portal de empregos conhecido (mas mantenha cautela - mesmo portais confiáveis podem ter anúncios falsos)'
            elif any(x in domain for x in ['unodc', 'un.org', 'gov.', 'edu.', 'worldbank', 'imf', 'who.int', 'unicef', 'undp']):
                domain_type = 'GOVERNMENT_ORGANIZATION'
                trust_reason = 'Organização governamental ou internacional confiável'
            elif any(x in domain for x in ['microsoft', 'google', 'apple', 'amazon', 'facebook', 'meta', 'netflix', 'spotify', 'uber', 'airbnb', 'tesla', 'spacex', 'ibm', 'oracle', 'salesforce', 'adobe', 'intel', 'nvidia', 'cisco', 'vmware', 'redhat']):
                domain_type = 'TECH_COMPANY'
                trust_reason = 'Empresa de tecnologia conhecida'
            elif any(x in domain for x in ['mcel', 'vodacom', 'movitel', 'bci', 'bancounico', 'bancobci', 'bancobm', 'coca-cola', 'pepsi', 'nestle', 'unilever', 'procter', 'gamble', 'shell', 'total', 'exxonmobil', 'sasol']):
                domain_type = 'LOCAL_COMPANY'
                trust_reason = 'Empresa local conhecida'
            elif any(x in domain for x in ['bbc', 'cnn', 'reuters', 'ap.org', 'bloomberg', 'wsj', 'nytimes', 'washingtonpost', 'theguardian', 'independent', 'dw', 'france24', 'aljazeera', 'rt', 'sputniknews', 'noticias.sapo', 'opais', 'jornalnoticias', 'verdade']):
                domain_type = 'NEWS_SITE'
                trust_reason = 'Site de notícias confiável'
            elif any(x in domain for x in ['amnesty', 'hrw', 'transparency', 'oxfam', 'msf', 'doctorswithoutborders', 'redcross', 'unicef', 'unhcr', 'wfp', 'fao', 'ilo']):
                domain_type = 'NGO'
                trust_reason = 'ONG confiável'
            else:
                domain_type = 'TRUSTED_DOMAIN'
                trust_reason = 'Domínio confiável conhecido'
            
            return {
                'is_trusted': True,
                'trust_level': 'HIGH',
                'trust_reason': trust_reason,
                'domain_type': domain_type,
                'domain': domain
            }
        except Exception:
            return {
                'is_trusted': True,
                'trust_level': 'HIGH',
                'trust_reason': 'URL confiável identificada',
                'domain_type': 'TRUSTED_DOMAIN'
            }
    else:
        return {
            'is_trusted': False,
            'trust_level': 'LOW',
            'trust_reason': 'URL não reconhecida como confiável',
            'domain_type': 'UNKNOWN'
        }

# Modelos de Autenticação
class LoginRequest(BaseModel):
    email: str
    senha: str
    instituicaoId: str

class UserResponse(BaseModel):
    id: str
    nome: str
    email: str
    perfil: str
    instituicaoId: str
    instituicaoNome: Optional[str] = None
    ativo: bool

class LoginResponse(BaseModel):
    user: UserResponse
    token: str

# Funções de autenticação
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user_by_email(email: str):
    user = await usuarios_collection.find_one({"email": email})
    return user

async def authenticate_user(email: str, senha: str, codigo_instituicao: str):
    from bson import ObjectId
    user = await get_user_by_email(email)
    if not user:
        return False
    
    if not verify_password(senha, user.get("senha", "")):
        return False
    
    # Verificar código da instituição
    instituicao_id = user.get("instituicaoId")
    if isinstance(instituicao_id, str):
        instituicao_id = ObjectId(instituicao_id)
    
    instituicao = await instituicoes_collection.find_one({"_id": instituicao_id})
    if not instituicao:
        return False
    
    codigo_instituicao_upper = codigo_instituicao.upper()
    codigo_db = instituicao.get("codigoAcesso", "").upper()
    
    if codigo_instituicao_upper != codigo_db:
        return False
    
    if not user.get("ativo", False):
        return False
    
    return user

class AnalysisRequest(BaseModel):
    tipoEntrada: str
    linkOportunidade: Optional[str] = None
    textoPublicacao: Optional[str] = None

class RecomendacaoItem(BaseModel):
    titulo: str
    explicacao: str
    paragrafoProblematico: Optional[str] = None

class VagaCompleta(BaseModel):
    # Dados originais
    url_vaga: Optional[str] = None
    texto_original: Optional[str] = None
    tipo_entrada: str
    
    # Dados extraídos da vaga
    titulo: Optional[str] = None
    empresa: Optional[str] = None
    descricao: Optional[str] = None
    requisitos: Optional[str] = None
    remuneracao: Optional[str] = None
    localizacao: Optional[str] = None
    tipo_oportunidade: Optional[str] = None
    beneficios: Optional[str] = None
    contatos: Optional[str] = None
    plataforma: Optional[str] = None
    url_trust_info: Optional[Dict[str, Any]] = None
    
    # Análise de risco
    nivel_risco: str
    pontuacao_risco: int
    alertas: list[str]
    recomendacoes: list[str]
    recomendacoes_detalhadas: Optional[list[RecomendacaoItem]] = None
    detalhes_risco: Dict[str, int]
    
    # Metadados
    data_analise: datetime
    data_criacao: datetime = datetime.now()

class AnalysisResult(BaseModel):
    nivelRisco: str
    pontuacao: int
    alertas: list[str]
    recomendacoes: list[str]  # Mantido para compatibilidade
    recomendacoesDetalhadas: Optional[list[RecomendacaoItem]] = None
    detalhes: Dict[str, int]
    textosSuspeitos: Optional[Dict[str, Optional[str]]] = None
    explicacoesDetalhes: Optional[Dict[str, Optional[str]]] = None

class Website:
    """Classe para extração de conteúdo web"""
    
    def __init__(self, url: str):
        self.url = url
        
        # Usar cache se disponível
        if url in _cache:
            cached = _cache[url]
            self.title = cached['title']
            self.text = cached['text']
            return
        
        try:
            response = requests.get(url, headers=HEADERS, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extrair título
            self.title = soup.title.string if soup.title else "No title found"
            
            # Extrair texto limpo
            if soup.body:
                for tag in soup.body(["script", "style", "img", "input", "noscript", "iframe"]):
                    tag.decompose()
                self.text = soup.body.get_text(separator="\n", strip=True)
            else:
                self.text = ""
            
            # Guardar no cache
            _cache[url] = {
                'title': self.title,
                'text': self.text
            }
        except Exception as e:
            self.title = "Erro ao carregar"
            self.text = f"Erro ao acessar URL: {str(e)}"

def extract_json(text: str) -> Optional[Dict]:
    """Extrai JSON de forma robusta do texto da resposta"""
    try:
        text = text.strip()
        
        # Remover markdown se presente
        if text.startswith('```'):
            text = re.sub(r'^```(?:json)?\n?', '', text)
            text = re.sub(r'\n?```$', '', text)
        
        # Encontrar primeiro { até último }
        start = text.index('{')
        end = text.rindex('}') + 1
        json_str = text[start:end]
        
        return json.loads(json_str)
    except (ValueError, json.JSONDecodeError) as e:
        print(f"Erro ao extrair JSON: {e}")
        return None

def get_recomendacoes_genericas() -> list[RecomendacaoItem]:
    """Retorna recomendações genéricas de segurança para oportunidades de baixo/médio risco"""
    return [
        RecomendacaoItem(
            titulo="Pesquise a empresa antes de prosseguir",
            explicacao="Mesmo que a oportunidade pareça legítima, é sempre recomendável pesquisar informações sobre a empresa em sites oficiais, redes sociais e plataformas de avaliação profissional antes de se candidatar.",
            paragrafoProblematico=None
        ),
        RecomendacaoItem(
            titulo="Verifique a identidade do contato",
            explicacao="Confirme que o contato fornecido realmente pertence à empresa anunciada. Prefira comunicação através de canais oficiais da empresa quando possível.",
            paragrafoProblematico=None
        ),
        RecomendacaoItem(
            titulo="Nunca forneça informações sensíveis prematuramente",
            explicacao="Empresas legítimas não solicitam informações bancárias, senhas ou documentos pessoais antes de uma entrevista formal ou processo de seleção estabelecido.",
            paragrafoProblematico=None
        ),
        RecomendacaoItem(
            titulo="Mantenha-se informado sobre golpes",
            explicacao="Fique atento a sinais comuns de golpes como promessas de ganhos fáceis, pressão para decisão rápida ou solicitação de pagamento antecipado.",
            paragrafoProblematico=None
        )
    ]

def analisar_oportunidade_llm(conteudo: str) -> tuple[AnalysisResult, dict]:
    """Analisa oportunidade usando LLM"""
    
    system_prompt = """Você é um especialista em análise de riscos de tráfico humano e golpes em oportunidades de emprego.

Analise o conteúdo fornecido e:
1. Extraia TODOS os dados da vaga de emprego
2. Identifique sinais de alerta baseados nos critérios de análise

CRITÉRIOS DE ANÁLISE:
1. Título suspeito (palavras como "fácil", "ganhe muito", "trabalho em casa")
2. Empresa genérica ou inexistente
3. Descrição vaga ou com promessas irrealistas
4. Requisitos muito baixos para salário alto
5. Contato apenas por WhatsApp sem email oficial
6. Plataforma não profissional (redes sociais pessoais)
7. Remuneração muito alta para a função
8. Falta de informações sobre a empresa
9. Pressão para decisão rápida
10. Solicitação de dinheiro antecipado
11. URL suspeita (domínios não confiáveis, encurtadores, sites genéricos)

Para cada recomendação, forneça:
- Um título curto e direto (máximo 80 caracteres)
- O parágrafo ou frase específica do conteúdo que é problemática (se aplicável)
- Uma explicação detalhada do motivo da recomendação, baseada nos sinais específicos encontrados no conteúdo analisado

IMPORTANTE: Sempre forneça recomendações detalhadas. Se não houver sinais de alerta específicos, forneça recomendações preventivas de segurança geral para proteger o usuário.

Retorne APENAS um JSON com a seguinte estrutura:
{
    "dadosVaga": {
        "titulo": "Título da vaga extraído",
        "empresa": "Nome da empresa/organização",
        "descricao": "Descrição completa da vaga",
        "requisitos": "Requisitos para a vaga",
        "remuneracao": "Valor da remuneração/salário",
        "localizacao": "Localização da vaga",
        "tipoOportunidade": "EMPREGO|ESTAGIO|VOLUNTARIADO|CURSO|BOLSA_ESTUDO|NEGOCIO|OUTROS",
        "beneficios": "Benefícios oferecidos",
        "contatos": "Informações de contato",
        "plataforma": "Plataforma onde foi encontrada"
    },
    "analiseRisco": {
        "nivelRisco": "BAIXO|MEDIO|ALTO|CRITICO",
        "pontuacao": 0-100,
        "alertas": ["lista de alertas encontrados com descrição específica"],
        "recomendacoes": ["lista de recomendações curtas"],
        "recomendacoesDetalhadas": [
            {
                "titulo": "Título curto da recomendação",
                "paragrafoProblematico": "Parágrafo ou frase específica do conteúdo que é problemática (se aplicável)",
                "explicacao": "Explicação detalhada do motivo desta recomendação, citando os sinais específicos encontrados no conteúdo analisado. Seja específico e claro."
            }
        ],
        "detalhes": {
            "tituloSuspeito": 0-100,
            "empresaSuspeita": 0-100,
            "descricaoVaga": 0-100,
            "requisitosVagos": 0-100,
            "salarioIrreal": 0-100,
            "contatoSuspeito": 0-100,
            "plataformaSuspeita": 0-100,
            "urlSuspeita": 0-100
        },
        "textosSuspeitos": {
            "tituloSuspeito": "Texto específico do título que é suspeito (se houver)",
            "empresaSuspeita": "Texto específico sobre a empresa que é suspeito (se houver)",
            "descricaoVaga": "Texto específico da descrição que é suspeito (se houver)",
            "requisitosVagos": "Texto específico dos requisitos que é suspeito (se houver)",
            "salarioIrreal": "Texto específico sobre salário que é suspeito (se houver)",
            "contatoSuspeito": "Texto específico do contato que é suspeito (se houver)",
            "plataformaSuspeita": "Texto específico da plataforma que é suspeito (se houver)",
            "urlSuspeita": "URL específica que é suspeita (se houver)"
        },
        "explicacoesDetalhes": {
            "tituloSuspeito": "Explicação do motivo pelo qual o título é suspeito quando percentual >= 31% (baseado nas informações extraídas da vaga)",
            "empresaSuspeita": "Explicação do motivo pelo qual a empresa é suspeita quando percentual >= 31% (baseado nas informações extraídas da vaga)",
            "descricaoVaga": "Explicação do motivo pelo qual a descrição é suspeita quando percentual >= 31% (baseado nas informações extraídas da vaga)",
            "requisitosVagos": "Explicação do motivo pelo qual os requisitos são vagos quando percentual >= 31% (baseado nas informações extraídas da vaga)",
            "salarioIrreal": "Explicação do motivo pelo qual o salário é irreal quando percentual >= 31% (baseado nas informações extraídas da vaga)",
            "contatoSuspeito": "Explicação do motivo pelo qual o contato é suspeito quando percentual >= 31% (baseado nas informações extraídas da vaga)",
            "plataformaSuspeita": "Explicação do motivo pelo qual a plataforma é suspeita quando percentual >= 31% (baseado nas informações extraídas da vaga)",
            "urlSuspeita": "Explicação do motivo pelo qual a URL é suspeita quando percentual >= 31% (baseado nas informações extraídas da vaga)"
        }
    }
}"""

    try:
        # Limitar o tamanho do conteúdo para evitar problemas
        conteudo_limitado = conteudo[:8000] if len(conteudo) > 8000 else conteudo
        
        prompt_completo = system_prompt + "\n\nConteúdo para análise:\n" + conteudo_limitado
        
        # Gerar conteúdo com o modelo
        response = model.generate_content(prompt_completo)
        
        if not response or not response.text:
            raise Exception("Resposta vazia do modelo")
        
        print(f"Resposta do modelo recebida (tamanho: {len(response.text)})")
        print(f"Primeiros 200 caracteres: {response.text[:200]}")
            
        result = extract_json(response.text)
        
        if not result:
            raise Exception("Não foi possível extrair JSON da resposta do modelo")
        
        if result and 'analiseRisco' in result:
            analise = result['analiseRisco']
            dados_vaga = result.get('dadosVaga', {})
            
            nivel_risco = analise.get('nivelRisco', 'MEDIO')
            
            # Processar recomendações detalhadas
            recomendacoes_detalhadas = [
                RecomendacaoItem(
                    titulo=rec.get('titulo', ''),
                    explicacao=rec.get('explicacao', ''),
                    paragrafoProblematico=rec.get('paragrafoProblematico')
                ) for rec in analise.get('recomendacoesDetalhadas', [])
            ]
            
            # Se não houver recomendações específicas e o nível de risco for BAIXO ou MÉDIO,
            # adicionar recomendações genéricas de segurança
            if not recomendacoes_detalhadas and nivel_risco in ['BAIXO', 'MEDIO']:
                recomendacoes_detalhadas = get_recomendacoes_genericas()
                # Também atualizar recomendações simples
                recomendacoes_simples = analise.get('recomendacoes', [])
                if not recomendacoes_simples:
                    recomendacoes_simples = [rec.titulo for rec in recomendacoes_detalhadas]
            else:
                recomendacoes_simples = analise.get('recomendacoes', [])
            
            return AnalysisResult(
                nivelRisco=nivel_risco,
                pontuacao=analise.get('pontuacao', 50),
                alertas=analise.get('alertas', []),
                recomendacoes=recomendacoes_simples,
                recomendacoesDetalhadas=recomendacoes_detalhadas,
                detalhes=analise.get('detalhes', {
                    "tituloSuspeito": 0,
                    "empresaSuspeita": 0,
                    "descricaoVaga": 0,
                    "requisitosVagos": 0,
                    "salarioIrreal": 0,
                    "contatoSuspeito": 0,
                    "plataformaSuspeita": 0,
                    "urlSuspeita": 0
                }),
                textosSuspeitos={k: v for k, v in analise.get('textosSuspeitos', {}).items() if v is not None},
                explicacoesDetalhes={k: v for k, v in analise.get('explicacoesDetalhes', {}).items() 
                                     if v is not None and analise.get('detalhes', {}).get(k, 0) >= 31}
            ), dados_vaga
        else:
            # Fallback se não conseguir extrair JSON - incluir recomendações genéricas
            recomendacoes_fallback = get_recomendacoes_genericas()
            return AnalysisResult(
                nivelRisco="MEDIO",
                pontuacao=50,
                alertas=["Erro na análise automática"],
                recomendacoes=[rec.titulo for rec in recomendacoes_fallback] + ["Verifique manualmente a oportunidade"],
                recomendacoesDetalhadas=recomendacoes_fallback + [
                    RecomendacaoItem(
                        titulo="Verifique manualmente a oportunidade",
                        explicacao="Não foi possível realizar a análise automática completa. Por favor, revise cuidadosamente a oportunidade antes de tomar qualquer decisão.",
                        paragrafoProblematico=None
                    )
                ],
                detalhes={
                    "tituloSuspeito": 0,
                    "empresaSuspeita": 0,
                    "descricaoVaga": 0,
                    "requisitosVagos": 0,
                    "salarioIrreal": 0,
                    "contatoSuspeito": 0,
                    "plataformaSuspeita": 0,
                    "urlSuspeita": 0
                },
                textosSuspeitos={},
                explicacoesDetalhes={}
            ), {}
    except Exception as e:
        print(f"Erro na análise LLM: {e}")
        print(f"Tipo do erro: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        
        # Incluir recomendações genéricas mesmo em caso de erro
        recomendacoes_erro = get_recomendacoes_genericas()
        return AnalysisResult(
            nivelRisco="MEDIO",
            pontuacao=50,
            alertas=[f"Erro na análise: {str(e)}"],
            recomendacoes=[rec.titulo for rec in recomendacoes_erro] + ["Verifique manualmente a oportunidade"],
            recomendacoesDetalhadas=recomendacoes_erro + [
                RecomendacaoItem(
                    titulo="Verifique manualmente a oportunidade",
                    explicacao=f"Ocorreu um erro durante a análise automática ({str(e)}). Por favor, revise cuidadosamente a oportunidade antes de tomar qualquer decisão e considere consultar autoridades competentes se identificar sinais suspeitos.",
                    paragrafoProblematico=None
                )
            ],
            detalhes={
                "tituloSuspeito": 0,
                "empresaSuspeita": 0,
                "descricaoVaga": 0,
                "requisitosVagos": 0,
                "salarioIrreal": 0,
                "contatoSuspeito": 0,
                "plataformaSuspeita": 0,
                "urlSuspeita": 0
            },
            textosSuspeitos={},
            explicacoesDetalhes={}
        ), {}

async def salvar_vaga_no_banco(vaga_data: dict) -> str:
    """Salva a vaga no MongoDB e retorna o ID"""
    try:
        vaga_doc = VagaCompleta(**vaga_data)
        result = await vagas_collection.insert_one(vaga_doc.dict())
        return str(result.inserted_id)
    except Exception as e:
        print(f"Erro ao salvar no banco: {e}")
        return None

@app.get("/")
async def root():
    return {"message": "HumAI Verify Opportunity API"}

@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Endpoint de autenticação"""
    try:
        user = await authenticate_user(
            request.email, 
            request.senha, 
            request.instituicaoId
        )
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Credenciais inválidas. Verifique seu email, senha e código da instituição."
            )
        
        # Buscar informações da instituição
        from bson import ObjectId
        instituicao_id = user.get("instituicaoId")
        if isinstance(instituicao_id, str):
            instituicao_id = ObjectId(instituicao_id)
        
        instituicao = await instituicoes_collection.find_one({"_id": instituicao_id})
        instituicao_nome = instituicao.get("nome", "Instituição") if instituicao else "Instituição"
        
        # Atualizar último login
        user_id_obj = user["_id"]
        if isinstance(user_id_obj, str):
            user_id_obj = ObjectId(user_id_obj)
        
        await usuarios_collection.update_one(
            {"_id": user_id_obj},
            {"$set": {"ultimoLogin": datetime.utcnow()}}
        )
        
        # Criar token
        user_id_str = str(user["_id"]) if not isinstance(user["_id"], str) else user["_id"]
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_id_str, "email": user["email"]},
            expires_delta=access_token_expires
        )
        
        return LoginResponse(
            user=UserResponse(
                id=user_id_str,
                nome=user["nome"],
                email=user["email"],
                perfil=user.get("perfil", "USUARIO"),
                instituicaoId=str(instituicao_id),
                instituicaoNome=instituicao_nome,
                ativo=user.get("ativo", True)
            ),
            token=access_token
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro no login: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/test")
async def test():
    return {"status": "ok", "message": "API funcionando"}

@app.post("/analyze")
async def analyze_opportunity(request: AnalysisRequest):
    """Analisa uma oportunidade de emprego"""
    
    try:
        conteudo = ""
        
        if request.tipoEntrada == "LINK" and request.linkOportunidade:
            # Extrair conteúdo do link
            try:
                website = Website(request.linkOportunidade)
                conteudo = f"Título: {website.title}\n\nConteúdo: {website.text}"
            except Exception as e:
                print(f"Erro ao extrair conteúdo do link: {e}")
                conteudo = f"Link fornecido: {request.linkOportunidade}\nErro ao extrair conteúdo completo."
        elif request.tipoEntrada == "TEXTO" and request.textoPublicacao:
            # Usar texto fornecido
            conteudo = request.textoPublicacao
        else:
            raise HTTPException(status_code=400, detail="Tipo de entrada ou conteúdo inválido")
        
        if not conteudo or len(conteudo.strip()) < 10:
            raise HTTPException(status_code=400, detail="Conteúdo muito curto ou vazio")
        
        # Analisar com LLM
        print(f"Iniciando análise LLM para tipo: {request.tipoEntrada}")
        print(f"Tamanho do conteúdo: {len(conteudo)}")
        resultado, dados_vaga = analisar_oportunidade_llm(conteudo)
        print(f"Análise LLM concluída. Nível de risco: {resultado.nivelRisco}")
        
        # Verificar confiabilidade da URL se for link
        url_trust_info = None
        if request.tipoEntrada == "LINK" and request.linkOportunidade:
            url_trust_info = get_url_trust_info(request.linkOportunidade)
            
            # Se a URL for confiável, ajustar a análise
            if url_trust_info.get('is_trusted', False):
                domain_type = url_trust_info.get('domain_type', 'UNKNOWN')
                
                # Reduzir pontuação de URL suspeita apenas para organizações governamentais e empresas conhecidas
                if domain_type in ['GOVERNMENT_ORGANIZATION', 'TECH_COMPANY', 'LOCAL_COMPANY', 'NEWS_SITE', 'NGO']:
                    if 'urlSuspeita' in resultado.detalhes:
                        resultado.detalhes['urlSuspeita'] = 0
                
                # Adicionar recomendação apropriada baseada no tipo de domínio
                if not resultado.recomendacoesDetalhadas:
                    resultado.recomendacoesDetalhadas = []
                
                if domain_type == 'JOB_PORTAL':
                    # Para portais de empregos, adicionar recomendação de cautela
                    resultado.recomendacoesDetalhadas.insert(0, RecomendacaoItem(
                        titulo="Portal de empregos conhecido - mas mantenha cautela",
                        explicacao=f"A oportunidade foi encontrada em {url_trust_info.get('trust_reason', 'um portal de empregos conhecido')}. Mesmo portais confiáveis podem ter anúncios falsos ou golpes. Sempre verifique a legitimidade da empresa e do anúncio antes de prosseguir.",
                        paragrafoProblematico=None
                    ))
                else:
                    # Para outras fontes confiáveis, adicionar recomendação positiva
                    resultado.recomendacoesDetalhadas.insert(0, RecomendacaoItem(
                        titulo="URL de fonte confiável identificada",
                        explicacao=f"A oportunidade foi encontrada em {url_trust_info.get('trust_reason', 'uma fonte confiável')}. Isso é um indicador positivo de legitimidade, mas ainda assim mantenha as precauções de segurança.",
                        paragrafoProblematico=None
                    ))
        
        # Preparar dados para salvar no banco
        vaga_data = {
            "url_vaga": request.linkOportunidade if request.tipoEntrada == "LINK" else None,
            "texto_original": request.textoPublicacao if request.tipoEntrada == "TEXTO" else None,
            "tipo_entrada": request.tipoEntrada,
            "titulo": dados_vaga.get("titulo"),
            "empresa": dados_vaga.get("empresa"),
            "descricao": dados_vaga.get("descricao"),
            "requisitos": dados_vaga.get("requisitos"),
            "remuneracao": dados_vaga.get("remuneracao"),
            "localizacao": dados_vaga.get("localizacao"),
            "tipo_oportunidade": dados_vaga.get("tipoOportunidade"),
            "beneficios": dados_vaga.get("beneficios"),
            "contatos": dados_vaga.get("contatos"),
            "plataforma": dados_vaga.get("plataforma"),
            "url_trust_info": url_trust_info,
            "nivel_risco": resultado.nivelRisco,
            "pontuacao_risco": resultado.pontuacao,
            "alertas": resultado.alertas,
            "recomendacoes": resultado.recomendacoes,
            "recomendacoes_detalhadas": [rec.model_dump() for rec in resultado.recomendacoesDetalhadas] if resultado.recomendacoesDetalhadas else [],
            "detalhes_risco": resultado.detalhes,
            "data_analise": datetime.now()
        }
        
        # Salvar no MongoDB
        vaga_id = await salvar_vaga_no_banco(vaga_data)
        if vaga_id:
            print(f"Vaga salva no banco com ID: {vaga_id}")
        
        # Criar resposta com dados da vaga
        response_data = {
            "analise": resultado.model_dump(),
            "dadosVaga": dados_vaga,
            "textoOriginal": conteudo,
            "urlTrustInfo": url_trust_info
        }
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro no endpoint /analyze: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/vagas")
async def listar_vagas(limit: int = 10, skip: int = 0, nivel_risco: Optional[str] = None):
    """Lista vagas analisadas"""
    try:
        # Construir filtro
        filtro = {}
        if nivel_risco and nivel_risco != "TODOS":
            filtro["nivel_risco"] = nivel_risco
        
        # Se há filtro, retornar todas as vagas filtradas sem paginação
        if filtro:
            cursor = vagas_collection.find(filtro).sort("data_analise", -1)
            vagas = []
            async for vaga in cursor:
                vaga["_id"] = str(vaga["_id"])
                vagas.append(vaga)
            
            total = len(vagas)
            
            return {
                "vagas": vagas,
                "total": total,
                "limit": total,
                "skip": 0
            }
        else:
            # Sem filtro, usar paginação normal
            cursor = vagas_collection.find().skip(skip).limit(limit).sort("data_analise", -1)
            vagas = []
            async for vaga in cursor:
                vaga["_id"] = str(vaga["_id"])
                vagas.append(vaga)
            
            total = await vagas_collection.count_documents({})
            
            return {
                "vagas": vagas,
                "total": total,
                "limit": limit,
                "skip": skip
            }
    except Exception as e:
        print(f"Erro ao listar vagas: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/vagas/stats")
async def obter_estatisticas():
    """Obtém estatísticas gerais das vagas"""
    try:
        # Contar total de vagas
        total_vagas = await vagas_collection.count_documents({})
        
        # Contar alto risco (ALTO + CRITICO)
        alto_risco = await vagas_collection.count_documents({
            "nivel_risco": {"$in": ["ALTO", "CRITICO"]}
        })
        
        return {
            "total_vagas": total_vagas,
            "alto_risco": alto_risco
        }
    except Exception as e:
        print(f"Erro ao obter estatísticas: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/vagas/top-empresas-risco")
async def obter_top_empresas_risco():
    """Obtém as 4 empresas com mais vagas de alto risco"""
    try:
        # Pipeline de agregação para contar vagas de alto risco por empresa
        pipeline = [
            {
                "$match": {
                    "nivel_risco": {"$in": ["ALTO", "CRITICO"]},
                    "empresa": {
                        "$exists": True, 
                        "$ne": None, 
                        "$ne": "",
                        "$nin": ["Empresa anónima", "Agência de recrutamento (não especificada)", "Agência de Recrutamento (Nome não especificado)", "Não especificada", "N/A", "n/a", "Não informado"]
                    }
                }
            },
            {
                "$group": {
                    "_id": "$empresa",
                    "total_vagas_alto_risco": {"$sum": 1},
                    "empresa": {"$first": "$empresa"}
                }
            },
            {
                "$sort": {"total_vagas_alto_risco": -1}
            },
            {
                "$limit": 4
            },
            {
                "$project": {
                    "_id": 0,
                    "empresa": 1,
                    "total_vagas_alto_risco": 1
                }
            }
        ]
        
        empresas = []
        async for empresa in vagas_collection.aggregate(pipeline):
            empresas.append(empresa)
        
        return {"empresas": empresas}
    except Exception as e:
        print(f"Erro ao obter top empresas de risco: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/vagas/top-dominios-risco")
async def obter_top_dominios_risco():
    """Obtém os 4 domínios com mais vagas de alto risco"""
    try:
        # Pipeline de agregação para contar vagas de alto risco por domínio
        pipeline = [
            {
                "$match": {
                    "nivel_risco": {"$in": ["ALTO", "CRITICO"]}
                }
            },
            {
                "$addFields": {
                    "dominio": {
                        "$cond": {
                            "if": {
                                "$and": [
                                    {"$ne": ["$url_vaga", None]},
                                    {"$ne": ["$url_vaga", ""]},
                                    {"$ne": [{"$type": "$url_vaga"}, "missing"]}
                                ]
                            },
                            "then": {
                                "$arrayElemAt": [
                                    {"$split": [{"$arrayElemAt": [{"$split": ["$url_vaga", "://"]}, 1]}, "/"]},
                                    0
                                ]
                            },
                            "else": {
                                "$cond": {
                                    "if": {"$ne": ["$tipo_entrada", None]},
                                    "then": "Análise por texto",
                                    "else": "Fonte não especificada"
                                }
                            }
                        }
                    }
                }
            },
            {
                "$match": {
                    "dominio": {
                        "$exists": True, 
                        "$ne": None, 
                        "$ne": "",
                        "$nin": ["localhost", "127.0.0.1", None]
                    }
                }
            },
            {
                "$group": {
                    "_id": "$dominio",
                    "total_vagas_alto_risco": {"$sum": 1},
                    "dominio": {"$first": "$dominio"}
                }
            },
            {
                "$sort": {"total_vagas_alto_risco": -1}
            },
            {
                "$limit": 4
            },
            {
                "$project": {
                    "_id": 0,
                    "dominio": 1,
                    "total_vagas_alto_risco": 1
                }
            }
        ]
        
        dominios = []
        async for dominio in vagas_collection.aggregate(pipeline):
            dominios.append(dominio)
        
        return {"dominios": dominios}
    except Exception as e:
        print(f"Erro ao obter top domínios de risco: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/vagas/{vaga_id}")
async def obter_vaga(vaga_id: str):
    """Obtém uma vaga específica por ID"""
    try:
        from bson import ObjectId
        vaga = await vagas_collection.find_one({"_id": ObjectId(vaga_id)})
        if not vaga:
            raise HTTPException(status_code=404, detail="Vaga não encontrada")
        
        vaga["_id"] = str(vaga["_id"])
        return vaga
    except Exception as e:
        print(f"Erro ao obter vaga: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
