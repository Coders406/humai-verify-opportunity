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
  const itemsPerPage = 10;

  const fetchVagas = async (page: number = 1) => {
    try {
      setLoading(true);
      const skip = (page - 1) * itemsPerPage;
      const response = await fetch(`http://localhost:8000/vagas?limit=${itemsPerPage}&skip=${skip}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }
      
      const data: VagasResponse = await response.json();
      setVagas(data.vagas);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados das oportunidades');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

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
    const matchesSearch = !searchTerm || 
      vaga.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaga.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaga.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterRisco === 'TODOS' || vaga.nivel_risco === filterRisco;
    
    return matchesSearch && matchesFilter;
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total de Vagas</p>
                <p className="text-2xl font-bold text-gray-900">{vagas.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Alto Risco</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vagas.filter(v => v.nivel_risco === 'ALTO' || v.nivel_risco === 'CRITICO').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Baixo Risco</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vagas.filter(v => v.nivel_risco === 'BAIXO').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Empresas Únicas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(vagas.map(v => v.empresa).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Vagas */}
        <div className="space-y-4">
          {filteredVagas.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma oportunidade encontrada</h3>
              <p className="text-gray-500">
                {searchTerm || filterRisco !== 'TODOS' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Nenhuma vaga foi analisada ainda'
                }
              </p>
            </div>
          ) : (
            filteredVagas.map((vaga) => (
              <div key={vaga._id} className="bg-white rounded-lg shadow-sm border">
                {/* Cabeçalho da Vaga */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 mr-3">
                          {vaga.titulo || 'Título não disponível'}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(vaga.nivel_risco)}`}>
                          {vaga.nivel_risco}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Building className="h-4 w-4 mr-1" />
                        <span className="mr-4">{vaga.empresa || 'Empresa não informada'}</span>
                        {vaga.localizacao && (
                          <>
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="mr-4">{vaga.localizacao}</span>
                          </>
                        )}
                        {vaga.remuneracao && (
                          <>
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span>{vaga.remuneracao}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Analisada em {formatDate(vaga.data_analise)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{vaga.pontuacao_risco}</div>
                        <div className="text-xs text-gray-500">pontos de risco</div>
                      </div>
                      <button
                        onClick={() => toggleExpanded(vaga._id)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {expandedVaga === vaga._id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Barra de Risco */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getRiskBarColor(vaga.pontuacao_risco)}`}
                        style={{ width: `${vaga.pontuacao_risco}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Detalhes Expandidos */}
                {expandedVaga === vaga._id && (
                  <div className="border-t bg-gray-50 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Informações da Vaga */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          Informações da Vaga
                        </h4>
                        
                        <div className="space-y-3">
                          {vaga.descricao && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Descrição:</label>
                              <p className="text-sm text-gray-600 mt-1">{vaga.descricao}</p>
                            </div>
                          )}
                          
                          {vaga.requisitos && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Requisitos:</label>
                              <p className="text-sm text-gray-600 mt-1">{vaga.requisitos}</p>
                            </div>
                          )}
                          
                          {vaga.beneficios && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Benefícios:</label>
                              <p className="text-sm text-gray-600 mt-1">{vaga.beneficios}</p>
                            </div>
                          )}
                          
                          {vaga.contatos && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Contatos:</label>
                              <p className="text-sm text-gray-600 mt-1 flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                {vaga.contatos}
                              </p>
                            </div>
                          )}
                          
                          {vaga.plataforma && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Plataforma:</label>
                              <p className="text-sm text-gray-600 mt-1 flex items-center">
                                <Globe className="h-4 w-4 mr-1" />
                                {vaga.plataforma}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Análise de Risco */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Shield className="h-5 w-5 mr-2" />
                          Análise de Risco
                        </h4>
                        
                        {/* Alertas */}
                        {vaga.alertas.length > 0 && (
                          <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700">Alertas:</label>
                            <ul className="mt-1 space-y-1">
                              {vaga.alertas.map((alerta, index) => (
                                <li key={index} className="text-sm text-red-600 flex items-start">
                                  <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                                  {alerta}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Detalhes de Risco */}
                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-700">Detalhes da Análise:</label>
                          <div className="mt-2 space-y-2">
                            {Object.entries(vaga.detalhes_risco).map(([key, value]) => {
                              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                              return (
                                <div key={key} className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">{label}:</span>
                                  <div className="flex items-center">
                                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                      <div
                                        className={`h-2 rounded-full ${getRiskBarColor(value)}`}
                                        style={{ width: `${value}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 w-8">{value}%</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Recomendações */}
                        {vaga.recomendacoes_detalhadas && vaga.recomendacoes_detalhadas.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Recomendações:</label>
                            <div className="mt-2 space-y-3">
                              {vaga.recomendacoes_detalhadas.map((rec, index) => (
                                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <h5 className="text-sm font-semibold text-blue-900 mb-1">{rec.titulo}</h5>
                                  {rec.paragrafoProblematico && (
                                    <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                                      <p className="text-xs text-red-800 font-medium mb-1">Texto problemático:</p>
                                      <p className="text-sm text-red-700 italic">"{rec.paragrafoProblematico}"</p>
                                    </div>
                                  )}
                                  <p className="text-sm text-blue-700">{rec.explicacao}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DadosOportunidadesPage;
