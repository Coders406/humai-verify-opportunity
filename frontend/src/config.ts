// Configurações da aplicação
export const config = {
  app: {
    title: 'HUMAI - Verificar Oportunidade',
    version: '1.0.0',
    description: 'Sistema de verificação de oportunidades para identificar possíveis riscos de tráfico humano'
  },
  urls: {
    denuncia: 'http://localhost:3000/denuncia-publica',
    mainApp: 'http://localhost:3000'
  },
  analysis: {
    riskThresholds: {
      low: 30,
      medium: 60,
      high: 80
    },
    suspiciousWords: {
      title: ['modelo', 'garota', 'garoto', 'acompanhante', 'massagem', 'trabalho fácil', 'ganhe muito'],
      description: ['viagem', 'estrangeiro', 'sem experiência', 'trabalho noturno', 'acompanhamento'],
      platforms: ['facebook', 'instagram', 'telegram', 'grupo whatsapp']
    }
  }
};
