import os
import re
import json
from typing import Optional, Dict
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import requests
from IPython.display import Markdown, display
import google.generativeai as genai

# Configuração inicial
load_dotenv(override=True)
api_key = os.getenv('GOOGLE_API_KEY')

if not api_key or len(api_key) < 10:
    raise ValueError("API key inválida. Verifique o arquivo .env")

genai.configure()
Model = genai.GenerativeModel('gemini-2.5-flash')

# Headers otimizados
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
}

# Cache simples para evitar requisições repetidas
_cache = {}


class Website:
    """Classe otimizada para extração de conteúdo web"""
    
    def __init__(self, url: str):
        self.url = url
        
        # Usar cache se disponível
        if url in _cache:
            cached = _cache[url]
            self.title = cached['title']
            self.text = cached['text']
            self.links = cached['links']
            return
        
        # Fazer requisição apenas uma vez
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extrair título
        self.title = soup.title.string if soup.title else "No title found"
        
        # Extrair texto limpo
        if soup.body:
            # Remover elementos irrelevantes de uma vez
            for tag in soup.body(["script", "style", "img", "input", "noscript", "iframe"]):
                tag.decompose()
            self.text = soup.body.get_text(separator="\n", strip=True)
        else:
            self.text = ""
        
        # Extrair links únicos e completos
        self.links = list(set(
            link.get('href') for link in soup.find_all('a', href=True)
            if link.get('href') and link.get('href').startswith('http')
        ))
        
        # Guardar no cache
        _cache[url] = {
            'title': self.title,
            'text': self.text,
            'links': self.links
        }
    
    def get_contents(self) -> str:
        return f"Webpage Title:\n{self.title}\nWebpage Contents:\n{self.text}\n\n"


# Prompts consolidados
LINK_SYSTEM_PROMPT = """Você receberá uma lista de links de um site de vagas de emprego.

TAREFA: Identificar apenas links que levam a anúncios de vagas de emprego reais.

INCLUIR:
- Links para vagas individuais
- Listas de vagas

EXCLUIR:
- Páginas institucionais (sobre, contato, etc.)
- Login, registro, termos de uso
- Páginas técnicas ou de erro

RESPOSTA: JSON puro, sem texto adicional.

Formato:
{
    "links": [
        {"type": "vaga_detalhada", "url": "https://..."},
        {"type": "lista_vagas", "url": "https://..."}
    ]
}
"""

EXTRACTION_SYSTEM_PROMPT = """Você é um extrator de dados de vagas de emprego.

OBJETIVO: Extrair TODOS os campos disponíveis de cada vaga encontrada.

CAMPOS OBRIGATÓRIOS (use null se não disponível):
- id_da_vaga, titulo, empresa_ou_recrutador, localizacao, tipo_de_contrato
- salario, data_publicacao, descricao_completa, requisitos, responsabilidades
- beneficios, como_candidatar_se, link_original, contatos_encontrados
- tags, linguagem_usada, fonte

SAÍDA: JSON puro, estruturado, sem texto extra.
Se múltiplas vagas, retorne array de objetos.
"""


def extract_json(text: str) -> Optional[Dict]:
    """Extrai JSON de forma robusta do texto da resposta"""
    try:
        # Tentar extrair JSON diretamente
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


def get_links(url: str) -> Optional[Dict]:
    """Identifica links relevantes de vagas no site"""
    website = Website(url)
    
    user_prompt = (
        f"Site: {website.url}\n\n"
        f"Links encontrados:\n" + "\n".join(website.links[:100])  # Limitar para não exceder tokens
    )
    
    chat = Model.start_chat()
    response = chat.send_message(LINK_SYSTEM_PROMPT + "\n\n" + user_prompt)
    
    return extract_json(response.text)


def get_full_content(url: str, max_links: int = 5) -> str:
    """Obtém conteúdo da landing page e dos primeiros links relevantes"""
    result = f"=== Landing Page: {url} ===\n"
    result += Website(url).get_contents()
    
    links_data = get_links(url)
    
    if links_data and links_data.get("links"):
        # Limitar número de links para processar
        for link_info in links_data["links"][:max_links]:
            result += f"\n\n=== {link_info['type']}: {link_info['url']} ===\n"
            try:
                result += Website(link_info["url"]).get_contents()
            except Exception as e:
                result += f"Erro ao acessar link: {e}\n"
    
    return result


def extract_job_data(site_name: str, url: str, max_chars: int = 25000) -> str:
    """Extrai dados estruturados de vagas de emprego"""
    
    # Obter conteúdo completo
    content = get_full_content(url)
    
    # Truncar se muito grande (preservar primeiros e últimos caracteres)
    if len(content) > max_chars:
        half = max_chars // 2
        content = content[:half] + "\n\n[...CONTEÚDO TRUNCADO...]\n\n" + content[-half:]
    
    user_prompt = f"Site: {site_name}\n\n{content}"
    
    # Gerar extração
    chat = Model.start_chat()
    response = chat.send_message(EXTRACTION_SYSTEM_PROMPT + "\n\n" + user_prompt)
    
    return response.text


def save_to_file(content: str, filename: str = "informacoes.txt"):
    """Salva conteúdo em arquivo"""
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✓ Arquivo salvo: {filename}")


def process_job_site(site_name: str, url: str, save: bool = True) -> str:
    """Função principal para processar um site de vagas"""
    print(f"Processando: {site_name} ({url})")
    
    result = extract_job_data(site_name, url)
    
    # Exibir resultado
    display(Markdown(result))
    
    # Salvar se solicitado
    if save:
        filename = f"vagas_{site_name.lower().replace(' ', '_')}.json"
        save_to_file(result, filename)
    
    return result


# Exemplo de uso
if __name__ == "__main__":
    result = process_job_site(
        site_name="Emprego.co.mz",
        url="https://www.emprego.co.mz/vaga/paralegal",
        save=True
    )