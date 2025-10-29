import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  AlertTriangle, 
  Shield, 
  Calendar,
  Building,
  MapPin,
  DollarSign,
  Phone,
  Globe,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VagaCompleta {
  _id: string;
  url_vaga?: string;
  texto_original?: string;
  tipo_entrada: string;
  titulo?: string;
  empresa?: string;
  descricao?: string;
  requisitos?: string;
  remuneracao?: string;
  localizacao?: string;
  tipo_oportunidade?: string;
  beneficios?: string;
  contatos?: string;
  plataforma?: string;
  nivel_risco: string;
  pontuacao_risco: number;
  alertas: string[];
  recomendacoes: string[];
  recomendacoes_detalhadas: Array<{
    titulo: string;
    explicacao: string;
    paragrafoProblematico?: string;
  }>;
  detalhes_risco: Record<string, number>;
  data_analise: string;
  data_criacao: string;
}

interface VagasResponse {
  vagas: VagaCompleta[];
  total: number;
  limit: number;
  skip: number;
}

interface EstatisticasResponse {
  total_vagas: number;
  alto_risco: number;
}

const DadosOportunidadesPage: React.FC = () => {
  const navigate = useNavigate();
  const [vagas, setVagas] = useState<VagaCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisco, setFilterRisco] = useState<string>('TODOS');
  const [expandedVaga, setExpandedVaga] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [estatisticas, setEstatisticas] = useState<EstatisticasResponse>({ total_vagas: 0, alto_risco: 0 });
  const itemsPerPage = 10;

  const fetchEstatisticas = async () => {
    try {
      const response = await fetch('http://localhost:8000/vagas/stats');
      if (response.ok) {
        const data: EstatisticasResponse = await response.json();
        setEstatisticas(data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const fetchVagas = async (page: number = 1) => {
    try {
      setLoading(true);
      
      // Se há filtro ativo, buscar todas as vagas filtradas sem paginação
      if (filterRisco !== 'TODOS') {
        const response = await fetch(`http://localhost:8000/vagas?nivel_risco=${filterRisco}`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar dados');
        }
        
        const data: VagasResponse = await response.json();
        setVagas(data.vagas);
        setTotalPages(1); // Sem paginação quando há filtro
        setError(null);
      } else {
        // Sem filtro, usar paginação normal
        const skip = (page - 1) * itemsPerPage;
        const response = await fetch(`http://localhost:8000/vagas?limit=${itemsPerPage}&skip=${skip}`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar dados');
        }
        
        const data: VagasResponse = await response.json();
        setVagas(data.vagas);
        setTotalPages(Math.ceil(data.total / itemsPerPage));
        setError(null);
      }
    } catch (err) {
      setError('Erro ao carregar dados das oportunidades');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Resetar para página 1 quando o filtro muda
    fetchVagas(1);
    fetchEstatisticas();
  }, [filterRisco]);

  useEffect(() => {
    fetchVagas(currentPage);
  }, [currentPage]);

  const getRiskColor = (nivel: string) => {
    switch (nivel) {
      case 'BAIXO': return 'text-green-600 bg-green-100';
      case 'MEDIO': return 'text-yellow-600 bg-yellow-100';
      case 'ALTO': return 'text-orange-600 bg-orange-100';
      case 'CRITICO': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskBarColor = (percent: number) => {
    if (percent <= 30) return 'bg-green-500';
    if (percent <= 60) return 'bg-yellow-500';
    if (percent <= 85) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const filteredVagas = vagas.filter(vaga => {
    // Apenas filtrar por busca de texto (título, empresa, descrição)
    // O filtro de risco é feito no backend
    const matchesSearch = !searchTerm || 
      vaga.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaga.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaga.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpanded = (vagaId: string) => {
    setExpandedVaga(expandedVaga === vagaId ? null : vagaId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Dados das Oportunidades</h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </button>
          </div>
          <p className="text-gray-600">
            Visualize e gerencie todas as oportunidades analisadas pelo sistema
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título, empresa ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro de Risco */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterRisco}
                onChange={(e) => setFilterRisco(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="TODOS">Todos os níveis de risco</option>
                <option value="BAIXO">Baixo Risco</option>
                <option value="MEDIO">Médio Risco</option>
                <option value="ALTO">Alto Risco</option>
                <option value="CRITICO">Crítico</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total de Vagas</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.total_vagas}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Alto Risco</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.alto_risco}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Vagas */}
        <div className="space-y-6">
          {filteredVagas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Database className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Nenhuma oportunidade encontrada</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm || filterRisco !== 'TODOS' 
                  ? 'Tente ajustar os filtros de busca para encontrar mais resultados'
                  : 'Nenhuma vaga foi analisada ainda. Comece analisando uma oportunidade!'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
            {filteredVagas.map((vaga) => (
              <div key={vaga._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
                {/* Header da Vaga */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900 truncate">
                          {vaga.titulo || 'Título não disponível'}
                        </h3>
                        <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getRiskColor(vaga.nivel_risco)}`}>
                          {vaga.nivel_risco}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                        {vaga.empresa && (
                          <div className="flex items-center gap-1.5">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{vaga.empresa}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(vaga.data_analise)}</span>
                        </div>
                        
                        {vaga.remuneracao && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-green-600">{vaga.remuneracao}</span>
                          </div>
                        )}

                        {vaga.localizacao && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{vaga.localizacao}</span>
                          </div>
                        )}
                      </div>

                      {/* Barra de Risco Melhorada */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">Nível de Risco</span>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">{vaga.pontuacao_risco}%</span>
                            <div className={`w-3 h-3 rounded-full ${
                              vaga.pontuacao_risco <= 30 ? 'bg-green-500' :
                              vaga.pontuacao_risco <= 60 ? 'bg-yellow-500' :
                              vaga.pontuacao_risco <= 85 ? 'bg-orange-500' : 'bg-red-500'
                            }`} />
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              vaga.pontuacao_risco <= 30 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                              vaga.pontuacao_risco <= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                              vaga.pontuacao_risco <= 85 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 
                              'bg-gradient-to-r from-red-400 to-red-500'
                            }`}
                            style={{ width: `${vaga.pontuacao_risco}%` }}
                          />
                        </div>
                      </div>

                      {/* Resumo das Recomendações */}
                      {vaga.recomendacoes && vaga.recomendacoes.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Principais Recomendações:</h4>
                          <div className="flex flex-wrap gap-2">
                            {vaga.recomendacoes.slice(0, 3).map((rec, index) => (
                              <span
                                key={index}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200"
                              >
                                {rec}
                              </span>
                            ))}
                            {vaga.recomendacoes.length > 3 && (
                              <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-lg border border-gray-200">
                                +{vaga.recomendacoes.length - 3} mais
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleExpanded(vaga._id)}
                        className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                      >
                        {expandedVaga === vaga._id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detalhes Expandidos */}
                {expandedVaga === vaga._id && (
                  <div className="p-6 bg-gray-50">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {/* Informações da Vaga */}
                      <div className="space-y-6">
                        <div className="bg-white rounded-lg p-5 border border-gray-200">
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-blue-600" />
                            Informações da Vaga
                          </h4>
                          
                          <div className="space-y-4">
                            {vaga.descricao && (
                              <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Descrição:</label>
                                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">{vaga.descricao}</p>
                              </div>
                            )}
                            
                            {vaga.requisitos && (
                              <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Requisitos:</label>
                                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">{vaga.requisitos}</p>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {vaga.beneficios && (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                  <label className="text-sm font-semibold text-green-700 block mb-1">Benefícios:</label>
                                  <p className="text-sm text-green-800">{vaga.beneficios}</p>
                                </div>
                              )}
                              
                              {vaga.contatos && (
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                  <label className="text-sm font-semibold text-purple-700 block mb-1">Contatos:</label>
                                  <p className="text-sm text-purple-800 font-medium flex items-center">
                                    <Phone className="h-4 w-4 mr-1" />
                                    {vaga.contatos}
                                  </p>
                                </div>
                              )}
                              
                              {vaga.plataforma && (
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                  <label className="text-sm font-semibold text-orange-700 block mb-1">Plataforma:</label>
                                  <p className="text-sm text-orange-800 font-medium flex items-center">
                                    <Globe className="h-4 w-4 mr-1" />
                                    {vaga.plataforma}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Análise de Risco */}
                      <div className="space-y-6">
                        <div className="bg-white rounded-lg p-5 border border-gray-200">
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Shield className="h-5 w-5 mr-2 text-red-600" />
                            Análise de Risco
                          </h4>
                          
                          {/* Alertas */}
                          {vaga.alertas && vaga.alertas.length > 0 && (
                            <div className="mb-6">
                              <label className="text-sm font-semibold text-gray-700 block mb-3">Alertas Encontrados:</label>
                              <div className="space-y-2">
                                {vaga.alertas.map((alerta, index) => (
                                  <div key={index} className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-red-500" />
                                    <p className="text-sm text-red-700">{alerta}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Detalhes de Risco */}
                          <div className="mb-6">
                            <label className="text-sm font-semibold text-gray-700 block mb-3">Detalhes da Análise:</label>
                            <div className="space-y-3">
                              {Object.entries(vaga.detalhes_risco).map(([key, value]) => {
                                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                return (
                                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">{label}:</span>
                                    <div className="flex items-center gap-3">
                                      <div className="w-20 bg-gray-200 rounded-full h-2">
                                        <div
                                          className={`h-2 rounded-full transition-all duration-300 ${
                                            value <= 30 ? 'bg-green-500' :
                                            value <= 60 ? 'bg-yellow-500' :
                                            value <= 85 ? 'bg-orange-500' : 'bg-red-500'
                                          }`}
                                          style={{ width: `${value}%` }}
                                        />
                                      </div>
                                      <span className="text-sm font-bold text-gray-900 w-8 text-right">{value}%</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Recomendações Detalhadas */}
                          {vaga.recomendacoes_detalhadas && vaga.recomendacoes_detalhadas.length > 0 && (
                            <div>
                              <label className="text-sm font-semibold text-gray-700 block mb-3">Recomendações Detalhadas:</label>
                              <div className="space-y-4">
                                {vaga.recomendacoes_detalhadas.map((rec, index) => (
                                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h5 className="text-sm font-bold text-blue-900 mb-2">{rec.titulo}</h5>
                                    {rec.paragrafoProblematico && (
                                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                                        <p className="text-xs font-semibold text-red-800 mb-1">Texto problemático:</p>
                                        <p className="text-sm text-red-700 italic">"{rec.paragrafoProblematico}"</p>
                                      </div>
                                    )}
                                    <p className="text-sm text-blue-800 leading-relaxed">{rec.explicacao}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                
                <div className="px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg">
                  Página {currentPage} de {totalPages}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DadosOportunidadesPage;