export interface OportunidadeFormData {
  // Campos de entrada
  tipoEntrada: 'LINK' | 'TEXTO';
  linkOportunidade?: string;
  textoPublicacao?: string;
  
  // Campos extraídos automaticamente
  titulo: string;
  empresa: string;
  descricao: string;
  requisitos: string;
  remuneracao?: string;
  localizacao: string;
  tipoOportunidade: 'EMPREGO' | 'ESTAGIO' | 'VOLUNTARIADO' | 'CURSO' | 'BOLSA_ESTUDO' | 'NEGOCIO' | 'OUTROS';
  beneficios?: string;
  contato: string;
  plataforma: string;
}

export interface RecomendacaoDetalhada {
  titulo: string;
  explicacao: string;
  paragrafoProblematico?: string;
}

export interface UrlTrustInfo {
  is_trusted: boolean;
  trust_level: 'HIGH' | 'LOW' | 'UNKNOWN';
  trust_reason: string;
  domain_type: 'JOB_PORTAL' | 'GOVERNMENT_ORGANIZATION' | 'TECH_COMPANY' | 'LOCAL_COMPANY' | 'NEWS_SITE' | 'NGO' | 'TRUSTED_DOMAIN' | 'UNKNOWN';
  domain?: string;
}

export interface AnaliseResultado {
  nivelRisco: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  pontuacao: number;
  alertas: string[];
  recomendacoes: string[];
  recomendacoesDetalhadas?: RecomendacaoDetalhada[];
  detalhes: {
    tituloSuspeito: number;
    empresaSuspeita: number;
    descricaoVaga: number;
    requisitosVagos: number;
    salarioIrreal: number;
    contatoSuspeito: number;
    plataformaSuspeita: number;
    emailSuspeito: number;
    urlSuspeita: number;
  };
  textosSuspeitos?: {
    tituloSuspeito?: string;
    empresaSuspeita?: string;
    descricaoVaga?: string;
    requisitosVagos?: string;
    salarioIrreal?: string;
    contatoSuspeito?: string;
    plataformaSuspeita?: string;
    emailSuspeito?: string;
    urlSuspeita?: string;
  };
  explicacoesDetalhes?: {
    tituloSuspeito?: string;
    empresaSuspeita?: string;
    descricaoVaga?: string;
    requisitosVagos?: string;
    salarioIrreal?: string;
    contatoSuspeito?: string;
    plataformaSuspeita?: string;
    emailSuspeito?: string;
    urlSuspeita?: string;
  };
}

export interface RespostaAnalise {
  analise: AnaliseResultado;
  dadosVaga: DadosVaga;
  textoOriginal: string;
  urlTrustInfo?: UrlTrustInfo;
}

export interface DadosVaga {
  titulo?: string;
  empresa?: string;
  descricao?: string;
  requisitos?: string;
  remuneracao?: string;
  localizacao?: string;
  tipoOportunidade?: string;
  beneficios?: string;
  contatos?: string;
  plataforma?: string;
}

export interface EstatisticasResponse {
  total_vagas: number;
  alto_risco: number;
}

export interface TopEmpresaRisco {
  empresa: string;
  total_vagas_alto_risco: number;
}

export interface TopEmpresasResponse {
  empresas: TopEmpresaRisco[];
}

export interface TopDominioRisco {
  dominio: string;
  total_vagas_alto_risco: number;
}

export interface TopDominiosResponse {
  dominios: TopDominioRisco[];
}
