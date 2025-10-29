import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, AlertTriangle, CheckCircle, XCircle, Loader2, Shield, AlertCircle, Briefcase, MapPin, DollarSign, FileText, Link as LinkIcon, Copy, Wand2, LogIn, LogOut, User } from 'lucide-react';
import { OportunidadeFormData, AnaliseResultado, RespostaAnalise, DadosVaga } from '@/types';
// import { config } from '@/config';
import { useAuth } from '../hooks/useAuth';

const oportunidadeSchema = z.object({
  // Campos de entrada
  tipoEntrada: z.enum(['LINK', 'TEXTO']),
  linkOportunidade: z.string().optional(),
  textoPublicacao: z.string().optional(),
}).refine(
  (data) => {
    if (data.tipoEntrada === 'LINK' && (!data.linkOportunidade || data.linkOportunidade.trim() === '')) {
      return false;
    }
    if (data.tipoEntrada === 'TEXTO' && (!data.textoPublicacao || data.textoPublicacao.trim() === '')) {
      return false;
    }
    return true;
  },
  {
    message: 'Link ou texto da oportunidade é obrigatório',
    path: ['tipoEntrada'],
  }
);

export default function VerificarOportunidadePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultado, setResultado] = useState<AnaliseResultado | null>(null);
  const [dadosVaga, setDadosVaga] = useState<DadosVaga | null>(null);
  const [textoOriginal, setTextoOriginal] = useState<string>('');
  // const [isExtracting, setIsExtracting] = useState(false);
  // const [tipoEntrada, setTipoEntrada] = useState<'LINK' | 'TEXTO'>('LINK');
  const [mostrarTextoCompleto, setMostrarTextoCompleto] = useState(false);
  const [urlTrustInfo, setUrlTrustInfo] = useState<any>(null);

  const removeHtmlTags = (text: string): string => {
    if (!text) return '';
    // Criar um elemento temporário para extrair texto
    const tmp = document.createElement('div');
    tmp.innerHTML = text;
    return tmp.textContent || tmp.innerText || '';
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OportunidadeFormData>({
    resolver: zodResolver(oportunidadeSchema),
    defaultValues: {
      tipoEntrada: 'LINK',
    },
  });

  const watchedTipoEntrada = watch('tipoEntrada');
  // const watchedTextoPublicacao = watch('textoPublicacao');

  // Função para extrair dados automaticamente (comentada temporariamente)
  /*
  const extrairDadosAutomaticamente = async (link?: string, texto?: string) => {
    // Função comentada para evitar erros de build
  };
  */

  const analisarOportunidade = async (data: OportunidadeFormData): Promise<RespostaAnalise> => {
    try {
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:8000'}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipoEntrada: data.tipoEntrada,
          linkOportunidade: data.linkOportunidade,
          textoPublicacao: data.textoPublicacao,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta do servidor:', response.status, errorText);
        throw new Error(`Erro na análise: ${response.status} - ${errorText}`);
      }

      const resposta = await response.json();
      return resposta;
    } catch (error) {
      console.error('Erro ao analisar oportunidade:', error);
      
      // Fallback para análise local em caso de erro
      return {
        analise: {
          nivelRisco: 'MEDIO',
          pontuacao: 50,
          alertas: [`Erro na análise automática: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique manualmente.`],
          recomendacoes: ['Verifique a oportunidade com cuidado', 'Certifique-se de que o backend está rodando corretamente'],
          detalhes: {
            tituloSuspeito: 0,
            empresaSuspeita: 0,
            descricaoVaga: 0,
            requisitosVagos: 0,
            salarioIrreal: 0,
            contatoSuspeito: 0,
            plataformaSuspeita: 0,
            urlSuspeita: 0,
          },
        },
        dadosVaga: {},
        textoOriginal: data.textoPublicacao || data.linkOportunidade || ''
      };
    }
  };

  const onSubmit = async (data: OportunidadeFormData) => {
    try {
      setIsAnalyzing(true);
      
      // Simular tempo de análise
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const resposta = await analisarOportunidade(data);
      setResultado(resposta.analise);
      setDadosVaga(resposta.dadosVaga);
      setTextoOriginal(resposta.textoOriginal);
      setUrlTrustInfo(resposta.urlTrustInfo);
    } catch (error) {
      console.error('Erro ao analisar oportunidade:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiscoColor = (nivel: string) => {
    switch (nivel) {
      case 'CRITICO': return 'text-red-600 bg-red-50 border-red-200';
      case 'ALTO': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MEDIO': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'BAIXO': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiscoIcon = (nivel: string) => {
    switch (nivel) {
      case 'CRITICO': return <XCircle className="h-6 w-6" />;
      case 'ALTO': return <AlertTriangle className="h-6 w-6" />;
      case 'MEDIO': return <AlertCircle className="h-6 w-6" />;
      case 'BAIXO': return <CheckCircle className="h-6 w-6" />;
      default: return <AlertCircle className="h-6 w-6" />;
    }
  };

  if (resultado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-unodc-blue-50 to-unodc-navy-50 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>

        <div className="relative z-10 py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Botão de Login/Logout no topo */}
            <div className="flex justify-end mb-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user?.nome}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="inline-flex items-center px-3 xs:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs xs:text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <LogOut className="h-3 w-3 xs:h-4 xs:w-4 mr-2 flex-shrink-0" />
                    <span>Sair</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center px-3 xs:px-4 py-2 bg-gradient-to-r from-unodc-blue-600 to-unodc-navy-600 hover:from-unodc-blue-700 hover:to-unodc-navy-700 text-white rounded-lg text-xs xs:text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <LogIn className="h-3 w-3 xs:h-4 xs:w-4 mr-2 flex-shrink-0" />
                  <span>Login</span>
                </button>
              )}
            </div>

            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <button
                onClick={() => setResultado(null)}
                className="inline-flex items-center text-unodc-navy-600 hover:text-unodc-navy-800 transition-colors duration-200 group mb-4 sm:mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="text-sm font-medium">Voltar à análise</span>
              </button>
              
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-unodc-blue-600 to-unodc-navy-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Search className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
              </div>
              
              <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-unodc-navy-900 mb-3 sm:mb-4 leading-tight">
                Análise de Risco Concluída
              </h1>
              <p className="text-sm xs:text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2 xs:px-4 leading-relaxed">
                Aqui está o resultado da análise da oportunidade que você verificou.
              </p>
            </div>

            {/* Resultado */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header do Resultado */}
              <div className={`px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-6 sm:py-8 text-center border-b ${getRiscoColor(resultado.nivelRisco)}`}>
                <div className="flex justify-center mb-2 xs:mb-3 sm:mb-4">
                  <div className={`w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center ${getRiscoColor(resultado.nivelRisco)}`}>
                    {getRiscoIcon(resultado.nivelRisco)}
                  </div>
                </div>
                
              <h2 className="text-lg xs:text-xl sm:text-2xl font-bold mb-2 leading-tight">
                  Risco {resultado.nivelRisco}
                </h2>
              <p className="text-sm xs:text-base sm:text-lg">
                  Pontuação: {resultado.pontuacao}/100
                </p>
              </div>

            {/* Informações da Vaga */}
            {dadosVaga && (
              <div className="px-3 xs:px-4 sm:px-6 lg:px-8 py-3 xs:py-4 sm:py-6 bg-gray-50 border-b">
                <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-2 xs:gap-3 sm:gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900 mb-2 flex items-center">
                      <Briefcase className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-gray-600 mr-2 flex-shrink-0" />
                      <span className="break-words">{dadosVaga.titulo || 'Título não disponível'}</span>
                    </h3>
                    {dadosVaga.empresa && (
                      <p className="text-xs xs:text-sm text-gray-600 mb-1">
                        <strong>Empresa:</strong> {dadosVaga.empresa}
                      </p>
                    )}
                    {dadosVaga.localizacao && (
                      <p className="text-xs xs:text-sm text-gray-600 mb-1">
                        <MapPin className="h-3 w-3 xs:h-4 xs:w-4 inline mr-1" />
                        {dadosVaga.localizacao}
                      </p>
                    )}
                    {dadosVaga.remuneracao && (
                      <p className="text-xs xs:text-sm text-gray-600">
                        <DollarSign className="h-3 w-3 xs:h-4 xs:w-4 inline mr-1" />
                        {dadosVaga.remuneracao}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setMostrarTextoCompleto(!mostrarTextoCompleto)}
                    className="px-2 xs:px-3 sm:px-4 py-2 bg-unodc-blue-600 hover:bg-unodc-blue-700 text-white text-xs xs:text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center xs:justify-start"
                  >
                    <FileText className="h-3 w-3 xs:h-4 xs:w-4 mr-1 xs:mr-2" />
                    {mostrarTextoCompleto ? 'Ocultar' : 'Ver'} Texto
                  </button>
                </div>
                
                {/* Texto Completo */}
                {mostrarTextoCompleto && (
                  <div className="mt-3 xs:mt-4 p-2 xs:p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
                    <h4 className="text-xs xs:text-sm font-semibold text-gray-700 mb-2">Texto Original Analisado:</h4>
                      <div className="max-h-40 xs:max-h-48 sm:max-h-60 overflow-y-auto">
                        <pre className="text-xs xs:text-sm text-gray-600 whitespace-pre-wrap font-sans break-words leading-relaxed">
                         {removeHtmlTags(textoOriginal)}
                        </pre>
                      </div>
                  </div>
                )}
              </div>
            )}

              {/* Conteúdo */}
              <div className="px-3 xs:px-4 sm:px-6 lg:px-8 py-3 xs:py-4 sm:py-6 lg:py-8 space-y-3 xs:space-y-4 sm:space-y-6">
                {/* Alertas */}
                {resultado.alertas.length > 0 && (
                  <div>
                    <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900 mb-2 xs:mb-3 sm:mb-4 flex items-center">
                      <AlertTriangle className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-red-500 mr-2" />
                      Alertas Encontrados
                    </h3>
                    <div className="space-y-2 xs:space-y-3">
                      {resultado.alertas.map((alerta, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-2 xs:p-3 sm:p-4">
                          <p className="text-xs xs:text-sm text-red-700 leading-relaxed">{alerta}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Informações de URL Confiável */}
                {urlTrustInfo && urlTrustInfo.is_trusted && (
                  <div className={`rounded-lg p-3 xs:p-4 sm:p-5 ${
                    urlTrustInfo.domain_type === 'JOB_PORTAL' 
                      ? 'bg-yellow-50 border border-yellow-200' 
                      : 'bg-green-50 border border-green-200'
                  }`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 xs:w-10 xs:h-10 rounded-full flex items-center justify-center ${
                          urlTrustInfo.domain_type === 'JOB_PORTAL' 
                            ? 'bg-yellow-100' 
                            : 'bg-green-100'
                        }`}>
                          {urlTrustInfo.domain_type === 'JOB_PORTAL' ? (
                            <svg className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 xs:w-5 xs:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="ml-3 xs:ml-4">
                        <h3 className={`text-sm xs:text-base font-semibold mb-1 ${
                          urlTrustInfo.domain_type === 'JOB_PORTAL' 
                            ? 'text-yellow-800' 
                            : 'text-green-800'
                        }`}>
                          {urlTrustInfo.domain_type === 'JOB_PORTAL' 
                            ? 'Portal de Empregos Conhecido' 
                            : 'URL de Fonte Confiável'
                          }
                        </h3>
                        <p className={`text-xs xs:text-sm mb-2 ${
                          urlTrustInfo.domain_type === 'JOB_PORTAL' 
                            ? 'text-yellow-700' 
                            : 'text-green-700'
                        }`}>
                          {urlTrustInfo.trust_reason}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            urlTrustInfo.domain_type === 'JOB_PORTAL' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {urlTrustInfo.domain_type === 'JOB_PORTAL' && 'Portal de Empregos'}
                            {urlTrustInfo.domain_type === 'GOVERNMENT_ORGANIZATION' && 'Organização Governamental'}
                            {urlTrustInfo.domain_type === 'TECH_COMPANY' && 'Empresa de Tecnologia'}
                            {urlTrustInfo.domain_type === 'LOCAL_COMPANY' && 'Empresa Local'}
                            {urlTrustInfo.domain_type === 'NEWS_SITE' && 'Site de Notícias'}
                            {urlTrustInfo.domain_type === 'NGO' && 'ONG'}
                            {urlTrustInfo.domain_type === 'TRUSTED_DOMAIN' && 'Domínio Confiável'}
                          </span>
                          {urlTrustInfo.domain && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              urlTrustInfo.domain_type === 'JOB_PORTAL' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {urlTrustInfo.domain}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recomendações */}
                <div>
                  <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900 mb-2 xs:mb-3 sm:mb-4 flex items-center">
                    <Shield className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-unodc-blue-600 mr-2" />
                    Recomendações
                  </h3>
                  <div className="space-y-2 xs:space-y-3">
                    {resultado.recomendacoesDetalhadas && resultado.recomendacoesDetalhadas.length > 0 ? (
                      // Usar recomendações detalhadas quando disponíveis
                      resultado.recomendacoesDetalhadas.map((recomendacao, index) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-2 xs:p-3 sm:p-4 shadow-sm">
                          <h4 className="text-xs xs:text-sm font-semibold text-blue-900 mb-2 flex items-start">
                            <Shield className="h-3 w-3 xs:h-4 xs:w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="break-words">{recomendacao.titulo}</span>
                          </h4>
                          
                          {/* Parágrafo problemático */}
                          {recomendacao.paragrafoProblematico && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-2 xs:p-3 mb-2 xs:mb-3 ml-2 xs:ml-4 sm:ml-6">
                              <p className="text-xs font-medium text-red-800 mb-1 flex items-center">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Texto problemático encontrado:
                              </p>
                              <p className="text-xs xs:text-sm text-red-700 italic break-words leading-relaxed">
                                "{recomendacao.paragrafoProblematico}"
                              </p>
                            </div>
                          )}
                          
                          {/* Explicação da recomendação */}
                          <p className="text-xs xs:text-sm text-blue-700 leading-relaxed ml-2 xs:ml-4 sm:ml-6">
                            {recomendacao.explicacao}
                          </p>
                        </div>
                      ))
                    ) : (
                      // Fallback para recomendações simples
                      resultado.recomendacoes.map((recomendacao, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-2 xs:p-3 sm:p-4">
                        <p className="text-xs xs:text-sm text-blue-700 leading-relaxed">{recomendacao}</p>
                      </div>
                    ))
                    )}
                  </div>
                </div>

                {/* Detalhes da Análise */}
                <div>
                  <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <FileText className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-gray-600 mr-2" />
                    Detalhes da Análise
                  </h3>
                  <p className="text-xs xs:text-sm text-gray-600 mb-2 xs:mb-3 sm:mb-4 leading-relaxed">
                    Percentual de suspeita para cada fator de risco:
                    <br />
                    <span className="text-green-600">0-30% = Baixo Risco</span> • 
                    <span className="text-yellow-600">31-60% = Médio Risco</span> • 
                    <span className="text-orange-600">61-85% = Alto Risco</span> • 
                    <span className="text-red-600">86-100% = Crítico</span>
                  </p>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 xs:gap-3 sm:gap-4">
                    {Object.entries(resultado.detalhes).map(([key, value]) => {
                      const percent = Math.max(0, Math.min(100, value)); // Garantir que está entre 0-100
                      
                      // Labels mais descritivos
                      const labels: Record<string, string> = {
                        tituloSuspeito: 'Título Suspeito',
                        empresaSuspeita: 'Empresa Suspeita',
                        descricaoVaga: 'Descrição Vaga',
                        requisitosVagos: 'Requisitos Vagos',
                        salarioIrreal: 'Salário Irreal',
                        contatoSuspeito: 'Contato Suspeito',
                        plataformaSuspeita: 'Plataforma Suspeita',
                        urlSuspeita: 'URL Suspeita'
                      };
                      
                      const label = labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      
                      // Determinar nível de risco e cores baseado na percentagem
                      let riskColor, barColor, badgeColor, badgeText;
                      
                      if (percent === 0) {
                        riskColor = 'text-green-600';
                        barColor = 'bg-green-500';
                        badgeColor = 'bg-green-100 text-green-700';
                        badgeText = 'Baixo Risco';
                      } else if (percent <= 30) {
                        riskColor = 'text-green-600';
                        barColor = 'bg-green-500';
                        badgeColor = 'bg-green-100 text-green-700';
                        badgeText = 'Baixo Risco';
                      } else if (percent <= 60) {
                        riskColor = 'text-yellow-600';
                        barColor = 'bg-yellow-500';
                        badgeColor = 'bg-yellow-100 text-yellow-700';
                        badgeText = 'Médio Risco';
                      } else if (percent <= 85) {
                        riskColor = 'text-orange-600';
                        barColor = 'bg-orange-500';
                        badgeColor = 'bg-orange-100 text-orange-700';
                        badgeText = 'Alto Risco';
                      } else {
                        riskColor = 'text-red-600';
                        barColor = 'bg-red-500';
                        badgeColor = 'bg-red-100 text-red-700';
                        badgeText = 'Crítico';
                      }
                      
                      // Verificar se há texto suspeito para este item
                      const textoSuspeito = resultado.textosSuspeitos?.[key as keyof typeof resultado.textosSuspeitos];
                      
                      // Verificar se há explicação para este item (quando percent >= 31%)
                      const explicacao = resultado.explicacoesDetalhes?.[key as keyof typeof resultado.explicacoesDetalhes];
                      
                      return (
                        <div key={key} className="p-2 xs:p-3 sm:p-4 rounded-lg border bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs xs:text-sm font-medium text-gray-800 break-words flex-1 mr-2">{label}</p>
                            <div className="flex items-center gap-1 xs:gap-2 flex-shrink-0">
                              <span className={`text-xs px-2 py-1 rounded-full ${badgeColor}`}>
                                {badgeText}
                              </span>
                              <span className={`text-xs xs:text-sm font-semibold ${riskColor}`}>{percent}%</span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-2 transition-all duration-300 ${barColor}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {percent === 0 ? 'Sem suspeita' : 
                             percent <= 30 ? 'Baixa suspeita' :
                             percent <= 60 ? 'Média suspeita' : 
                             percent <= 85 ? 'Alta suspeita' : 'Muito suspeita'}
                          </p>
                          
                          {/* Card com texto suspeito se disponível */}
                          {textoSuspeito && percent > 0 && (
                            <div className="mt-2 xs:mt-3 p-2 xs:p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  <svg className="h-3 w-3 xs:h-4 xs:w-4 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="ml-2 flex-1">
                                  <p className="text-xs font-medium text-red-800 mb-1">
                                    Texto suspeito encontrado:
                                  </p>
                                  <p className="text-xs xs:text-sm text-red-700 italic break-words leading-relaxed">
                                    "{textoSuspeito}"
                        </p>
                      </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Explicação do motivo quando percent >= 31% */}
                          {explicacao && percent >= 31 && (
                            <div className="mt-2 xs:mt-3 p-2 xs:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  <svg className="h-3 w-3 xs:h-4 xs:w-4 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="ml-2 flex-1">
                                  <p className="text-xs font-medium text-blue-800 mb-1">
                                    Motivo da suspeita:
                                  </p>
                                  <p className="text-xs xs:text-sm text-blue-700 break-words leading-relaxed">
                                    {explicacao}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ações */}
                <div className="pt-3 xs:pt-4 sm:pt-6 border-t border-gray-200">
                  <div className="flex justify-center">
                    <button
                      onClick={() => setResultado(null)}
                      className="w-full max-w-md bg-unodc-blue-600 hover:bg-unodc-blue-700 text-white font-medium py-2 xs:py-3 px-3 xs:px-4 rounded-lg transition-all duration-200 text-sm xs:text-base"
                    >
                      Verificar Outra Oportunidade
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-unodc-blue-50 to-unodc-navy-50 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>

      <div className="relative z-10 py-4 xs:py-6 sm:py-8 lg:py-12 px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Botão de Login no topo */}
          <div className="flex justify-end mb-6">
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-unodc-blue-600 to-unodc-navy-600 hover:from-unodc-blue-700 hover:to-unodc-navy-700 text-white rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <LogIn className="h-4 w-4 mr-2" />
                <span>Fazer Login</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.nome}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>

          {/* Header */}
          <div className="text-center mb-4 xs:mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 xs:mb-4 sm:mb-6">
              <div className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-unodc-blue-600 to-unodc-navy-600 rounded-xl xs:rounded-2xl flex items-center justify-center shadow-lg">
                <Search className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-unodc-navy-900 mb-2 xs:mb-3 sm:mb-4 leading-tight px-2">
              Verificar Oportunidade
            </h1>
            <p className="text-xs xs:text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto mb-3 xs:mb-4 sm:mb-6 px-2 sm:px-4 leading-relaxed">
              Analise uma oportunidade de emprego, estágio, curso ou negócio para identificar possíveis riscos de tráfico humano ou golpes.
            </p>
            
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl xs:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <form onSubmit={handleSubmit(onSubmit)} className="p-3 xs:p-4 sm:p-6 lg:p-8 space-y-3 xs:space-y-4 sm:space-y-6">
              {/* Seleção do Tipo de Entrada */}
              <div className="bg-gradient-to-r from-unodc-blue-50 to-unodc-navy-50 rounded-lg xs:rounded-xl p-3 xs:p-4 sm:p-6">
                <div className="flex items-center mb-3 xs:mb-4">
                  <Wand2 className="h-4 w-4 xs:h-5 xs:w-5 text-unodc-blue-600 mr-2 flex-shrink-0" />
                  <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900">Como você quer verificar a oportunidade?</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 xs:gap-3 sm:gap-4 mb-3 xs:mb-4 sm:mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      // setTipoEntrada('LINK');
                      setValue('tipoEntrada', 'LINK');
                    }}
                    className={`p-2 xs:p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                      watchedTipoEntrada === 'LINK'
                        ? 'border-unodc-blue-500 bg-unodc-blue-50'
                        : 'border-gray-200 bg-white hover:border-unodc-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <LinkIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${watchedTipoEntrada === 'LINK' ? 'text-unodc-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <h4 className={`text-sm sm:text-base font-semibold ${watchedTipoEntrada === 'LINK' ? 'text-unodc-blue-900' : 'text-gray-700'}`}>
                      Por Link
                    </h4>
                    <p className={`text-xs sm:text-sm ${watchedTipoEntrada === 'LINK' ? 'text-unodc-blue-700' : 'text-gray-500'}`}>
                      Cole o link da oportunidade e o sistema extrairá automaticamente os dados
                    </p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      // setTipoEntrada('TEXTO');
                      setValue('tipoEntrada', 'TEXTO');
                    }}
                    className={`p-2 xs:p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                      watchedTipoEntrada === 'TEXTO'
                        ? 'border-unodc-blue-500 bg-unodc-blue-50'
                        : 'border-gray-200 bg-white hover:border-unodc-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Copy className={`h-5 w-5 sm:h-6 sm:w-6 ${watchedTipoEntrada === 'TEXTO' ? 'text-unodc-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <h4 className={`text-sm sm:text-base font-semibold ${watchedTipoEntrada === 'TEXTO' ? 'text-unodc-blue-900' : 'text-gray-700'}`}>
                      Por Texto
                    </h4>
                    <p className={`text-xs sm:text-sm ${watchedTipoEntrada === 'TEXTO' ? 'text-unodc-blue-700' : 'text-gray-500'}`}>
                      Cole o texto da publicação e o sistema analisará automaticamente
                    </p>
                  </button>
                </div>

                {/* Campo de Entrada */}
                {watchedTipoEntrada === 'LINK' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Link da Oportunidade *
                      </label>
                        <input
                          {...register('linkOportunidade')}
                          type="url"
                        className="w-full px-3 xs:px-4 py-2 xs:py-3 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-unodc-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="https://www.emprego.co.mz/vagas/auxiliar-administrativo-maputo"
                      />
                      {errors.linkOportunidade && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.linkOportunidade.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {watchedTipoEntrada === 'TEXTO' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Texto da Publicação *
                      </label>
                      <div className="space-y-3">
                        <div className="relative">
                        <textarea
                          {...register('textoPublicacao')}
                          rows={6}
                            className="w-full px-3 xs:px-4 py-2 xs:py-3 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-unodc-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                            placeholder="Cole aqui o texto completo da publicação da oportunidade...

Exemplo:
VAGA: AUXILIAR ADMINISTRATIVO
EMPRESA: Maputo Business Solutions
SALÁRIO: 15.000 MZN
LOCAL: Maputo, Moçambique
CONTATO: WhatsApp +258 84 123 4567
DESCRIÇÃO: Procuramos pessoa dinâmica para trabalhar no nosso escritório. Trabalho de segunda a sexta, 8h às 17h. Envie seu CV por WhatsApp..."
                          />
                          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                            {watch('textoPublicacao')?.length || 0} caracteres
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                        <button
                          type="button"
                            onClick={() => setValue('textoPublicacao', '')}
                            disabled={!watch('textoPublicacao')}
                            className="px-3 xs:px-4 py-2 xs:py-3 text-sm xs:text-base bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Limpar
                          </button>
                            </div>
                      </div>
                      {errors.textoPublicacao && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.textoPublicacao.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 xs:p-3 sm:p-4 mt-3 sm:mt-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Wand2 className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-blue-400" />
                    </div>
                    <div className="ml-2 xs:ml-3">
                      <h4 className="text-xs xs:text-sm font-medium text-blue-800 leading-tight">
                        {watchedTipoEntrada === 'LINK' ? 'Extração e Análise Automática' : 'Análise de Texto'}
                      </h4>
                      <p className="text-xs xs:text-sm text-blue-700 mt-1 leading-relaxed">
                        {watchedTipoEntrada === 'LINK' 
                          ? 'O sistema irá extrair automaticamente informações da oportunidade e analisar todos os elementos para detectar sinais de golpe ou tráfico humano.'
                          : 'Cole o texto completo da publicação (post, anúncio, email, etc.) e o sistema analisará automaticamente todos os elementos para detectar sinais de golpe ou tráfico humano.'
                        }
                      </p>
                      <div className="mt-2 text-xs text-blue-600 leading-relaxed">
                        <strong>Dica:</strong> {watchedTipoEntrada === 'TEXTO' 
                          ? 'Quanto mais completo for o texto, mais precisa será a análise. Inclua informações sobre empresa, salário, contato e descrição da vaga.'
                          : 'Use o botão "Analisar Risco da Oportunidade" abaixo para iniciar a análise completa.'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de Submit */}
              <div className="pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full bg-gradient-to-r from-unodc-blue-600 to-unodc-navy-600 hover:from-unodc-blue-700 hover:to-unodc-navy-700 text-white font-semibold py-3 xs:py-4 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm xs:text-base sm:text-lg"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                      <span>Analisando Oportunidade...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="hidden xs:inline">Analisar Risco da Oportunidade</span>
                      <span className="xs:hidden">Analisar Oportunidade</span>
                    </div>
                  )}
                </button>
                <p className="text-xs sm:text-sm text-gray-500 text-center mt-3 sm:mt-4 px-2">
                  Esta análise é baseada em padrões conhecidos de tráfico humano e golpes. 
                  Sempre seja cauteloso e verifique informações adicionais.
                </p>
              </div>
              
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
