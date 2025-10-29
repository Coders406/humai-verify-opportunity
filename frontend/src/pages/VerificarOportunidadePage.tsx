import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, AlertTriangle, CheckCircle, XCircle, Loader2, Shield, AlertCircle, Briefcase, MapPin, DollarSign, Clock, Users, FileText, Link as LinkIcon, Copy, Wand2, Database } from 'lucide-react';
import { OportunidadeFormData, AnaliseResultado, RespostaAnalise, DadosVaga } from '@/types';
import { config } from '@/config';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultado, setResultado] = useState<AnaliseResultado | null>(null);
  const [dadosVaga, setDadosVaga] = useState<DadosVaga | null>(null);
  const [textoOriginal, setTextoOriginal] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [tipoEntrada, setTipoEntrada] = useState<'LINK' | 'TEXTO'>('LINK');
  const [mostrarTextoCompleto, setMostrarTextoCompleto] = useState(false);

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
  const watchedTextoPublicacao = watch('textoPublicacao');

  // Função para extrair dados automaticamente
  const extrairDadosAutomaticamente = async (link?: string, texto?: string) => {
    setIsExtracting(true);
    
    try {
      // Simular tempo de extração
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let dadosExtraidos: Partial<OportunidadeFormData> = {};
      
      if (link) {
        // Simulação de extração de dados de link
        dadosExtraidos = {
          titulo: 'Assistente Administrativo - Empresa ABC',
          empresa: 'Empresa ABC Ltda',
          descricao: 'Procuramos assistente administrativo para trabalhar em escritório moderno. Responsabilidades incluem atendimento ao cliente, organização de documentos e apoio geral.',
          requisitos: 'Ensino médio completo, experiência mínima de 1 ano, conhecimento em informática básica, boa comunicação.',
          remuneracao: 'R$ 2.500,00',
          localizacao: 'Maputo, Moçambique',
          tipoOportunidade: 'EMPREGO' as const,
          beneficios: 'Vale refeição, plano de saúde, ambiente de trabalho agradável',
          contato: 'Email: rh@empresaabc.com | Telefone: +258 21 123 4567',
          plataforma: 'LinkedIn',
        };
      } else if (texto) {
        // Simulação de extração de dados de texto
        const linhas = texto.split('\n').filter(linha => linha.trim());
        
        dadosExtraidos = {
          titulo: linhas[0] || 'Oportunidade Extraída',
          empresa: 'Empresa Extraída',
          descricao: texto.substring(0, 200) + '...',
          requisitos: 'Requisitos extraídos do texto',
          remuneracao: 'A definir',
          localizacao: 'Localização extraída',
          tipoOportunidade: 'EMPREGO' as const,
          beneficios: 'Benefícios conforme descrito',
          contato: 'Contato extraído do texto',
          plataforma: 'Rede Social',
        };
      }
      
      // Preencher os campos automaticamente
      Object.entries(dadosExtraidos).forEach(([key, value]) => {
        if (value) {
          setValue(key as keyof OportunidadeFormData, value);
        }
      });
      
    } catch (error) {
      console.error('Erro ao extrair dados:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const analisarOportunidade = async (data: OportunidadeFormData): Promise<RespostaAnalise> => {
    try {
      const response = await fetch('http://localhost:8000/analyze', {
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
          recomendacoes: ['Verifique a oportunidade com cuidado', 'Certifique-se de que o backend está rodando em http://localhost:8000'],
          detalhes: {
            tituloSuspeito: 0,
            empresaSuspeita: 0,
            descricaoVaga: 0,
            requisitosVagos: 0,
            salarioIrreal: 0,
            contatoSuspeito: 0,
            plataformaSuspeita: 0,
            emailSuspeito: 0,
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

        <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <button
                onClick={() => setResultado(null)}
                className="inline-flex items-center text-unodc-navy-600 hover:text-unodc-navy-800 transition-colors duration-200 group mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="text-sm font-medium">Voltar à análise</span>
              </button>
              
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-unodc-blue-600 to-unodc-navy-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Search className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-unodc-navy-900 mb-4">
                Análise de Risco Concluída
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Aqui está o resultado da análise da oportunidade que você verificou.
              </p>
            </div>

            {/* Resultado */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header do Resultado */}
              <div className={`px-8 py-8 text-center border-b ${getRiscoColor(resultado.nivelRisco)}`}>
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${getRiscoColor(resultado.nivelRisco)}`}>
                    {getRiscoIcon(resultado.nivelRisco)}
                  </div>
                </div>
                
              <h2 className="text-2xl font-bold mb-2">
                Risco {resultado.nivelRisco}
              </h2>
              <p className="text-lg">
                Pontuação: {resultado.pontuacao}/100
              </p>
            </div>

            {/* Informações da Vaga */}
            {dadosVaga && (
              <div className="px-8 py-6 bg-gray-50 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                      <Briefcase className="h-5 w-5 text-gray-600 mr-2" />
                      {dadosVaga.titulo || 'Título não disponível'}
                    </h3>
                    {dadosVaga.empresa && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Empresa:</strong> {dadosVaga.empresa}
                      </p>
                    )}
                    {dadosVaga.localizacao && (
                      <p className="text-sm text-gray-600 mb-1">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        {dadosVaga.localizacao}
                      </p>
                    )}
                    {dadosVaga.remuneracao && (
                      <p className="text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 inline mr-1" />
                        {dadosVaga.remuneracao}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setMostrarTextoCompleto(!mostrarTextoCompleto)}
                    className="ml-4 px-4 py-2 bg-unodc-blue-600 hover:bg-unodc-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {mostrarTextoCompleto ? 'Ocultar' : 'Ver'} Texto
                  </button>
                </div>
                
                {/* Texto Completo */}
                {mostrarTextoCompleto && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Texto Original Analisado:</h4>
                    <div className="max-h-60 overflow-y-auto">
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">
                        {textoOriginal}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

              {/* Conteúdo */}
              <div className="px-8 py-8 space-y-6">
                {/* Alertas */}
                {resultado.alertas.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                      Alertas Encontrados
                    </h3>
                    <div className="space-y-2">
                      {resultado.alertas.map((alerta, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-700">{alerta}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recomendações */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 text-unodc-blue-600 mr-2" />
                    Recomendações
                  </h3>
                  <div className="space-y-3">
                    {resultado.recomendacoesDetalhadas && resultado.recomendacoesDetalhadas.length > 0 ? (
                      // Usar recomendações detalhadas quando disponíveis
                      resultado.recomendacoesDetalhadas.map((recomendacao, index) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                          <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-start">
                            <Shield className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            {recomendacao.titulo}
                          </h4>
                          
                          {/* Parágrafo problemático */}
                          {recomendacao.paragrafoProblematico && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 ml-6">
                              <p className="text-xs font-medium text-red-800 mb-1 flex items-center">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Texto problemático encontrado:
                              </p>
                              <p className="text-sm text-red-700 italic">
                                "{recomendacao.paragrafoProblematico}"
                              </p>
                            </div>
                          )}
                          
                          {/* Explicação da recomendação */}
                          <p className="text-sm text-blue-700 leading-relaxed ml-6">
                            {recomendacao.explicacao}
                          </p>
                        </div>
                      ))
                    ) : (
                      // Fallback para recomendações simples
                      resultado.recomendacoes.map((recomendacao, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-700">{recomendacao}</p>
                      </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Detalhes da Análise */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <FileText className="h-5 w-5 text-gray-600 mr-2" />
                    Detalhes da Análise
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Percentual de suspeita para cada fator de risco:
                    <br />
                    <span className="text-green-600">0-30% = Baixo Risco</span> • 
                    <span className="text-yellow-600">31-60% = Médio Risco</span> • 
                    <span className="text-orange-600">61-85% = Alto Risco</span> • 
                    <span className="text-red-600">86-100% = Crítico</span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        emailSuspeito: 'Email Suspeito',
                        urlSuspeita: 'URL Suspeita'
                      };
                      
                      const label = labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      
                      // Determinar nível de risco e cores baseado na percentagem
                      let riskLevel, riskColor, barColor, badgeColor, badgeText;
                      
                      if (percent === 0) {
                        riskLevel = 'BAIXO';
                        riskColor = 'text-green-600';
                        barColor = 'bg-green-500';
                        badgeColor = 'bg-green-100 text-green-700';
                        badgeText = 'Baixo Risco';
                      } else if (percent <= 30) {
                        riskLevel = 'BAIXO';
                        riskColor = 'text-green-600';
                        barColor = 'bg-green-500';
                        badgeColor = 'bg-green-100 text-green-700';
                        badgeText = 'Baixo Risco';
                      } else if (percent <= 60) {
                        riskLevel = 'MÉDIO';
                        riskColor = 'text-yellow-600';
                        barColor = 'bg-yellow-500';
                        badgeColor = 'bg-yellow-100 text-yellow-700';
                        badgeText = 'Médio Risco';
                      } else if (percent <= 85) {
                        riskLevel = 'ALTO';
                        riskColor = 'text-orange-600';
                        barColor = 'bg-orange-500';
                        badgeColor = 'bg-orange-100 text-orange-700';
                        badgeText = 'Alto Risco';
                      } else {
                        riskLevel = 'CRÍTICO';
                        riskColor = 'text-red-600';
                        barColor = 'bg-red-500';
                        badgeColor = 'bg-red-100 text-red-700';
                        badgeText = 'Crítico';
                      }
                      
                      // Verificar se há texto suspeito para este item
                      const textoSuspeito = resultado.textosSuspeitos?.[key];
                      
                      return (
                        <div key={key} className="p-4 rounded-lg border bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-800">{label}</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${badgeColor}`}>
                                {badgeText}
                              </span>
                              <span className={`text-sm font-semibold ${riskColor}`}>{percent}%</span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-2 transition-all duration-300 ${barColor}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {percent === 0 ? 'Sem suspeita' : 
                             percent <= 30 ? 'Baixa suspeita' :
                             percent <= 60 ? 'Média suspeita' : 
                             percent <= 85 ? 'Alta suspeita' : 'Muito suspeita'}
                          </p>
                          
                          {/* Card com texto suspeito se disponível */}
                          {textoSuspeito && percent > 0 && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  <svg className="h-4 w-4 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="ml-2 flex-1">
                                  <p className="text-xs font-medium text-red-800 mb-1">
                                    Texto suspeito encontrado:
                                  </p>
                                  <p className="text-sm text-red-700 italic">
                                    "{textoSuspeito}"
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
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a
                      href={config.urls.denuncia}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 text-center"
                    >
                      <div className="flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        <span>Fazer Denúncia</span>
                      </div>
                    </a>
                    
                    <button
                      onClick={() => setResultado(null)}
                      className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-all duration-200"
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

      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-unodc-blue-600 to-unodc-navy-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Search className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-unodc-navy-900 mb-4">
              Verificar Oportunidade
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Analise uma oportunidade de emprego, estágio, curso ou negócio para identificar possíveis riscos de tráfico humano ou golpes.
            </p>
            
            {/* Botão de Navegação */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => navigate('/dados-oportunidades')}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Database className="h-4 w-4 mr-2" />
                Ver Dados das Oportunidades
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
              {/* Seleção do Tipo de Entrada */}
              <div className="bg-gradient-to-r from-unodc-blue-50 to-unodc-navy-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Wand2 className="h-5 w-5 text-unodc-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Como você quer verificar a oportunidade?</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoEntrada('LINK');
                      setValue('tipoEntrada', 'LINK');
                    }}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      watchedTipoEntrada === 'LINK'
                        ? 'border-unodc-blue-500 bg-unodc-blue-50'
                        : 'border-gray-200 bg-white hover:border-unodc-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <LinkIcon className={`h-6 w-6 ${watchedTipoEntrada === 'LINK' ? 'text-unodc-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <h4 className={`font-semibold ${watchedTipoEntrada === 'LINK' ? 'text-unodc-blue-900' : 'text-gray-700'}`}>
                      Por Link
                    </h4>
                    <p className={`text-sm ${watchedTipoEntrada === 'LINK' ? 'text-unodc-blue-700' : 'text-gray-500'}`}>
                      Cole o link da oportunidade e o sistema extrairá automaticamente os dados
                    </p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setTipoEntrada('TEXTO');
                      setValue('tipoEntrada', 'TEXTO');
                    }}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      watchedTipoEntrada === 'TEXTO'
                        ? 'border-unodc-blue-500 bg-unodc-blue-50'
                        : 'border-gray-200 bg-white hover:border-unodc-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Copy className={`h-6 w-6 ${watchedTipoEntrada === 'TEXTO' ? 'text-unodc-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <h4 className={`font-semibold ${watchedTipoEntrada === 'TEXTO' ? 'text-unodc-blue-900' : 'text-gray-700'}`}>
                      Por Texto
                    </h4>
                    <p className={`text-sm ${watchedTipoEntrada === 'TEXTO' ? 'text-unodc-blue-700' : 'text-gray-500'}`}>
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
                      <div className="flex gap-2">
                        <input
                          {...register('linkOportunidade')}
                          type="url"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unodc-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                          placeholder="https://linkedin.com/jobs/view/123456"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const link = watch('linkOportunidade');
                            if (link) {
                              extrairDadosAutomaticamente(link);
                            }
                          }}
                          disabled={isExtracting || !watch('linkOportunidade')}
                          className="px-6 py-3 bg-gradient-to-r from-unodc-blue-600 to-unodc-navy-600 hover:from-unodc-blue-700 hover:to-unodc-navy-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {isExtracting ? (
                            <div className="flex items-center">
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              <span>Extraindo...</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Wand2 className="h-4 w-4 mr-2" />
                              <span>Analisar</span>
                            </div>
                          )}
                        </button>
                      </div>
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
                            rows={8}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unodc-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                            placeholder="Cole aqui o texto completo da publicação da oportunidade...

Exemplo:
Vaga: Desenvolvedor Python
Empresa: TechCorp
Salário: R$ 8.000
Contato: rh@techcorp.com
Descrição: Buscamos desenvolvedor Python com experiência..."
                          />
                          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                            {watch('textoPublicacao')?.length || 0} caracteres
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const texto = watch('textoPublicacao');
                              if (texto) {
                                extrairDadosAutomaticamente(undefined, texto);
                              }
                            }}
                            disabled={isExtracting || !watch('textoPublicacao')}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-unodc-blue-600 to-unodc-navy-600 hover:from-unodc-blue-700 hover:to-unodc-navy-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            {isExtracting ? (
                              <div className="flex items-center justify-center">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                <span>Analisando Texto...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <Wand2 className="h-4 w-4 mr-2" />
                                <span>Analisar Texto</span>
                              </div>
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setValue('textoPublicacao', '')}
                            disabled={!watch('textoPublicacao')}
                            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Wand2 className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">
                        {watchedTipoEntrada === 'LINK' ? 'Extração Automática' : 'Análise de Texto'}
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {watchedTipoEntrada === 'LINK' 
                          ? 'O sistema irá extrair automaticamente informações como título, empresa, descrição, requisitos e contatos da oportunidade fornecida.'
                          : 'Cole o texto completo da publicação (post, anúncio, email, etc.) e o sistema analisará automaticamente todos os elementos para detectar sinais de golpe ou tráfico humano.'
                        }
                      </p>
                      {watchedTipoEntrada === 'TEXTO' && (
                        <div className="mt-2 text-xs text-blue-600">
                          <strong>Dica:</strong> Quanto mais completo for o texto, mais precisa será a análise. Inclua informações sobre empresa, salário, contato e descrição da vaga.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de Submit */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full bg-gradient-to-r from-unodc-blue-600 to-unodc-navy-600 hover:from-unodc-blue-700 hover:to-unodc-navy-700 text-white font-semibold py-4 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      <span>Analisando Oportunidade...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Search className="h-5 w-5 mr-2" />
                      <span>Analisar Risco da Oportunidade</span>
                    </div>
                  )}
                </button>
                <p className="text-sm text-gray-500 text-center mt-4">
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
