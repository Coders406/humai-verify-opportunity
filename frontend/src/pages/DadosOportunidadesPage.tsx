import React, { useState, useEffect } from 'react';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
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
  // Eye,
  // Trash2,
  // ArrowLeft,
  X,
  Info,
  ExternalLink,
  LogOut,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { EstatisticasResponse, TopEmpresaRisco, TopEmpresasResponse, TopDominioRisco, TopDominiosResponse } from '../types';

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
  const { user, logout } = useAuth();
  const [vagas, setVagas] = useState<VagaCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisco, setFilterRisco] = useState<string>('TODOS');
  const [expandedVaga, setExpandedVaga] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [estatisticas, setEstatisticas] = useState<EstatisticasResponse>({ total_vagas: 0, alto_risco: 0 });
  const [topEmpresas, setTopEmpresas] = useState<TopEmpresaRisco[]>([]);
  const [topDominios, setTopDominios] = useState<TopDominioRisco[]>([]);
  const [modalVagaInfo, setModalVagaInfo] = useState<VagaCompleta | null>(null);
  const [modalAnaliseRisco, setModalAnaliseRisco] = useState<VagaCompleta | null>(null);
  const itemsPerPage = 10;

  const fetchEstatisticas = async () => {
    try {
      const response = await fetch(`${API_URL}/vagas/stats`);
      if (response.ok) {
        const data: EstatisticasResponse = await response.json();
        setEstatisticas(data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const fetchTopEmpresas = async () => {
    try {
      const response = await fetch(`${API_URL}/vagas/top-empresas-risco`);
      if (response.ok) {
        const data: TopEmpresasResponse = await response.json();
        setTopEmpresas(data.empresas);
      }
    } catch (err) {
      console.error('Erro ao carregar top empresas:', err);
    }
  };

  const fetchTopDominios = async () => {
    try {
      const response = await fetch(`${API_URL}/vagas/top-dominios-risco`);
      if (response.ok) {
        const data: TopDominiosResponse = await response.json();
        setTopDominios(data.dominios);
      }
    } catch (err) {
      console.error('Erro ao carregar top domínios:', err);
    }
  };

  const fetchVagas = async (page: number = 1) => {
    try {
      setLoading(true);
      
      // Se há filtro ativo, buscar todas as vagas filtradas sem paginação
      if (filterRisco !== 'TODOS') {
        const response = await fetch(`${API_URL}/vagas?nivel_risco=${filterRisco}`);
        
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
        const response = await fetch(`${API_URL}/vagas?limit=${itemsPerPage}&skip=${skip}`);
        
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
    fetchTopEmpresas();
    fetchTopDominios();
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

  const openVagaInfoModal = (vaga: VagaCompleta) => {
    setModalVagaInfo(vaga);
  };

  const closeVagaInfoModal = () => {
    setModalVagaInfo(null);
  };

  const openAnaliseRiscoModal = (vaga: VagaCompleta) => {
    setModalAnaliseRisco(vaga);
  };

  const closeAnaliseRiscoModal = () => {
    setModalAnaliseRisco(null);
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.nome}</span>
              </div>
              <button
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

        {/* Top Empresas com Alto Risco */}
        {topEmpresas && topEmpresas.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Empresas com Mais Vagas de Alto/Crítico Risco</h3>
                    <p className="text-red-100 text-sm mt-1">
                      Lista das empresas que mais aparecem em oportunidades de alto ou crítico risco
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                    <div className="text-white text-sm font-medium">{topEmpresas.length}</div>
                    <div className="text-red-100 text-xs">empresas</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {topEmpresas && topEmpresas.length > 0 ? topEmpresas.map((empresa, index) => {
                  // Calcular largura da barra de progresso de forma segura
                  const maxVagas = Math.max(...topEmpresas.map(e => e.total_vagas_alto_risco), 1);
                  const progressWidth = maxVagas > 0 
                    ? Math.min(100, (empresa.total_vagas_alto_risco / maxVagas) * 100) 
                    : 0;
                  
                  return (
                    <div 
                      key={empresa.empresa} 
                      className="relative overflow-hidden rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50 transition-all duration-300 hover:shadow-xl hover:scale-105"
                    >

                      {/* Conteúdo principal */}
                      <div className="p-5">
                        {/* Nome da empresa */}
                        <div className="mb-4">
                          <h4 className={`font-bold text-gray-900 text-base leading-tight ${
                            (empresa.empresa?.length || 0) > 25 ? 'text-sm' : 'text-base'
                          }`}>
                            {empresa.empresa || 'Empresa não especificada'}
                          </h4>
                        </div>

                        {/* Estatísticas */}
                        <div className="text-center">
                          <div className="text-3xl font-black mb-1 text-red-600">
                            {empresa.total_vagas_alto_risco}
                          </div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-red-700">
                            {empresa.total_vagas_alto_risco === 1 ? 'Vaga Suspeita' : 'Vagas Suspeitas'}
                          </div>
                        </div>

                        {/* Barra de progresso visual */}
                        <div className="mt-4">
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-2 rounded-full transition-all duration-1000 bg-gradient-to-r from-red-400 to-red-500"
                              style={{ width: `${progressWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Efeito de brilho no hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  );
                }) : (
                  <div className="col-span-full text-center py-8">
                    <div className="text-gray-500 text-sm">
                      Nenhuma empresa com alto risco encontrada
                    </div>
                  </div>
                )}
              </div>

              {/* Footer com informações adicionais */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                    <span>Dados atualizados em tempo real</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Baseado em {estatisticas.alto_risco} vagas de alto risco analisadas
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Domínios com Alto Risco */}
        {topDominios && topDominios.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Fontes com Mais Vagas de Alto/Crítico Risco</h3>
                    <p className="text-orange-100 text-sm mt-1">
                      Lista das fontes que mais aparecem em oportunidades de alto ou crítico risco
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                    <div className="text-white text-sm font-medium">{topDominios.length}</div>
                    <div className="text-orange-100 text-xs">fontes</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {topDominios && topDominios.length > 0 ? topDominios.map((dominio, index) => {
                  // Calcular largura da barra de progresso de forma segura
                  const maxVagas = Math.max(...topDominios.map(d => d.total_vagas_alto_risco), 1);
                  const progressWidth = maxVagas > 0 
                    ? Math.min(100, (dominio.total_vagas_alto_risco / maxVagas) * 100) 
                    : 0;
                  
                  return (
                    <div 
                      key={dominio.dominio} 
                      className="relative overflow-hidden rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 transition-all duration-300 hover:shadow-xl hover:scale-105"
                    >
                      {/* Conteúdo principal */}
                      <div className="p-5">
                        {/* Nome da fonte */}
                        <div className="mb-4">
                          <h4 className={`font-bold text-gray-900 text-base leading-tight ${
                            (dominio.dominio?.length || 0) > 25 ? 'text-sm' : 'text-base'
                          }`}>
                            {dominio.dominio || 'Fonte não especificada'}
                          </h4>
                        </div>

                        {/* Estatísticas */}
                        <div className="text-center">
                          <div className="text-3xl font-black mb-1 text-orange-600">
                            {dominio.total_vagas_alto_risco}
                          </div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                            {dominio.total_vagas_alto_risco === 1 ? 'Vaga Suspeita' : 'Vagas Suspeitas'}
                          </div>
                        </div>

                        {/* Barra de progresso visual */}
                        <div className="mt-4">
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-2 rounded-full transition-all duration-1000 bg-gradient-to-r from-orange-400 to-orange-500"
                              style={{ width: `${progressWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Efeito de brilho no hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  );
                }) : (
                  <div className="col-span-full text-center py-8">
                    <div className="text-gray-500 text-sm">
                      Nenhuma fonte com alto risco encontrada
                    </div>
                  </div>
                )}
              </div>

              {/* Footer com informações adicionais */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                    <span>Dados atualizados em tempo real</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Baseado em {estatisticas.alto_risco} vagas de alto risco analisadas
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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

                {/* Detalhes Expandidos - Apenas Análise de Risco */}
                {expandedVaga === vaga._id && (
                  <div className="p-6 bg-gray-50">
                    <div className="max-w-4xl mx-auto">
                      {/* Botões de Ação */}
                      <div className="flex flex-wrap gap-3 mb-6">
                        <button
                          onClick={() => openVagaInfoModal(vaga)}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          <Info className="h-4 w-4 mr-2" />
                          Ver Informações Completas
                        </button>
                        
                        <button
                          onClick={() => openAnaliseRiscoModal(vaga)}
                          className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Análise de Risco Detalhada
                        </button>
                        
                        {vaga.url_vaga && (
                          <a
                            href={vaga.url_vaga}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver Vaga Original
                          </a>
                        )}
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

      {/* Modal de Informações da Vaga */}
      {modalVagaInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-4 max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-3 sm:px-6 py-3 sm:py-4 text-white flex-shrink-0">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex items-start sm:items-center flex-1 min-w-0">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-xl font-bold leading-tight">Informações Completas da Vaga</h3>
                    <p className="text-blue-100 text-xs sm:text-sm truncate mt-0.5">{modalVagaInfo.titulo}</p>
                  </div>
                </div>
                <button
                  onClick={closeVagaInfoModal}
                  className="p-1.5 sm:p-2 hover:bg-blue-800 rounded-lg transition-colors flex-shrink-0 ml-2"
                  aria-label="Fechar modal"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-3 sm:p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                {/* Informações Básicas */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-5">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <Building className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 flex-shrink-0" />
                      <span>Informações Básicas</span>
                    </h4>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {modalVagaInfo.empresa && (
                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-1">Empresa:</label>
                          <p className="text-sm text-gray-800 bg-white p-3 rounded-lg border">{modalVagaInfo.empresa}</p>
                        </div>
                      )}
                      
                      {modalVagaInfo.localizacao && (
                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-1">Localização:</label>
                          <p className="text-sm text-gray-800 bg-white p-3 rounded-lg border flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            {modalVagaInfo.localizacao}
                          </p>
                        </div>
                      )}
                      
                      {modalVagaInfo.remuneracao && (
                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-1">Remuneração:</label>
                          <p className="text-sm text-gray-800 bg-white p-3 rounded-lg border flex items-center">
                            <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                            <span className="font-medium text-green-600">{modalVagaInfo.remuneracao}</span>
                          </p>
                        </div>
                      )}
                      
                      {modalVagaInfo.plataforma && (
                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-1">Plataforma:</label>
                          <p className="text-sm text-gray-800 bg-white p-3 rounded-lg border flex items-center">
                            <Globe className="h-4 w-4 mr-2 text-orange-500" />
                            {modalVagaInfo.plataforma}
                          </p>
                        </div>
                      )}
                      
                      {modalVagaInfo.contatos && (
                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-1">Contatos:</label>
                          <p className="text-sm text-gray-800 bg-white p-3 rounded-lg border flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-purple-500" />
                            {modalVagaInfo.contatos}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Benefícios */}
                  {modalVagaInfo.beneficios && (
                    <div className="bg-green-50 rounded-lg p-3 sm:p-5 border border-green-200">
                      <h4 className="text-base sm:text-lg font-semibold text-green-800 mb-2 sm:mb-3">Benefícios Oferecidos</h4>
                      <p className="text-xs sm:text-sm text-green-700 leading-relaxed">{modalVagaInfo.beneficios}</p>
                    </div>
                  )}
                </div>

                {/* Descrição e Requisitos */}
                <div className="space-y-4 sm:space-y-6">
                  {modalVagaInfo.descricao && (
                    <div className="bg-white rounded-lg p-3 sm:p-5 border border-gray-200">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Descrição da Vaga</h4>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {modalVagaInfo.descricao}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {modalVagaInfo.requisitos && (
                    <div className="bg-white rounded-lg p-3 sm:p-5 border border-gray-200">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Requisitos</h4>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {modalVagaInfo.requisitos}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Texto Original */}
                  {modalVagaInfo.texto_original && (
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-5 border border-gray-200">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Texto Original Completo</h4>
                      <div className="max-h-48 sm:max-h-60 overflow-y-auto bg-white p-2 sm:p-4 rounded-lg border">
                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {modalVagaInfo.texto_original}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações de Análise */}
              <div className="mt-4 sm:mt-8 bg-gray-50 rounded-lg p-3 sm:p-5">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Informações da Análise</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Data da Análise:</span>
                    <p className="text-gray-600">{formatDate(modalVagaInfo.data_analise)}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Tipo de Entrada:</span>
                    <p className="text-gray-600">{modalVagaInfo.tipo_entrada}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Nível de Risco:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getRiskColor(modalVagaInfo.nivel_risco)}`}>
                      {modalVagaInfo.nivel_risco} ({modalVagaInfo.pontuacao_risco}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex justify-end flex-shrink-0">
              <button
                onClick={closeVagaInfoModal}
                className="px-4 sm:px-6 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors w-full sm:w-auto"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Análise de Risco Detalhada */}
      {modalAnaliseRisco && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-4 max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 px-3 sm:px-6 py-3 sm:py-4 text-white flex-shrink-0">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex items-start sm:items-center flex-1 min-w-0">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-xl font-bold leading-tight">Análise de Risco Detalhada</h3>
                    <p className="text-red-100 text-xs sm:text-sm truncate mt-0.5">{modalAnaliseRisco.titulo}</p>
                  </div>
                </div>
                <button
                  onClick={closeAnaliseRiscoModal}
                  className="p-1.5 sm:p-2 hover:bg-red-800 rounded-lg transition-colors flex-shrink-0 ml-2"
                  aria-label="Fechar modal"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-3 sm:p-6 overflow-y-auto flex-1">
              {/* Alertas Críticos */}
              {modalAnaliseRisco.alertas && modalAnaliseRisco.alertas.length > 0 && (
                <div className="mb-4 sm:mb-8">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-500 flex-shrink-0" />
                    <span className="leading-tight">Alertas Críticos Encontrados</span>
                  </h4>
                  <div className="grid gap-2 sm:gap-3">
                    {modalAnaliseRisco.alertas.map((alerta, index) => (
                      <div key={index} className="flex items-start p-3 sm:p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 mt-0.5 flex-shrink-0 text-red-500" />
                        <p className="text-xs sm:text-sm text-red-800 font-medium leading-relaxed">{alerta}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* Recomendações de Segurança */}
              {modalAnaliseRisco.recomendacoes_detalhadas && modalAnaliseRisco.recomendacoes_detalhadas.length > 0 && (
                <div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-3 sm:px-6 py-3 sm:py-4 rounded-t-lg border border-green-200">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600 flex-shrink-0" />
                      <span className="leading-tight">Recomendações de Segurança</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Orientações específicas para proteger-se contra possíveis fraudes e riscos
                    </p>
                  </div>
                  <div className="bg-white border-l border-r border-b border-gray-200 rounded-b-lg p-3 sm:p-6">
                    <div className="grid gap-4 sm:gap-6">
                      {modalAnaliseRisco.recomendacoes_detalhadas.map((rec, index) => (
                        <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3 sm:p-6 hover:shadow-lg transition-all duration-200">
                          <div className="flex items-start gap-2 sm:gap-0">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-base sm:text-lg">{index + 1}</span>
                              </div>
                            </div>
                            <div className="ml-2 sm:ml-5 flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center mb-2 sm:mb-3 gap-2 sm:gap-0">
                                <h5 className="text-sm sm:text-lg font-bold text-blue-900 leading-tight">{rec.titulo}</h5>
                                <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full w-fit">
                                  Recomendação {index + 1}
                                </div>
                              </div>
                              
                              {rec.paragrafoProblematico && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                                  <div className="flex items-center mb-2">
                                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-2 flex-shrink-0" />
                                    <p className="text-xs sm:text-sm font-semibold text-red-800 leading-tight">Texto problemático identificado:</p>
                                  </div>
                                  <div className="bg-white border border-red-200 rounded-lg p-2 sm:p-3">
                                    <p className="text-xs sm:text-sm text-red-700 italic leading-relaxed">"{rec.paragrafoProblematico}"</p>
                                  </div>
                                </div>
                              )}
                              
                              <div className="bg-white border border-blue-200 rounded-lg p-3 sm:p-4">
                                <p className="text-xs sm:text-sm text-blue-800 leading-relaxed font-medium">{rec.explicacao}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex justify-end flex-shrink-0">
              <button
                onClick={closeAnaliseRiscoModal}
                className="px-4 sm:px-6 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors w-full sm:w-auto"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DadosOportunidadesPage;