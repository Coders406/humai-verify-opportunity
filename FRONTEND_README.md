# HumAI Verify Opportunity - Frontend

Sistema de verificação de oportunidades de emprego para identificar riscos de tráfico humano e golpes.

## 🚀 Funcionalidades

### 1. **Análise de Oportunidades**
- **Análise por Link**: Extrai conteúdo de URLs de vagas
- **Análise por Texto**: Analisa texto copiado/colado
- **IA Avançada**: Usa Google Gemini para análise inteligente
- **4 Níveis de Risco**: Baixo, Médio, Alto, Crítico
- **Percentuais Detalhados**: Análise específica por categoria

### 2. **Visualização de Dados** (NOVO!)
- **Dashboard Completo**: Visualize todas as oportunidades analisadas
- **Filtros Avançados**: Por nível de risco, busca por texto
- **Estatísticas**: Total de vagas, distribuição de riscos
- **Detalhes Expandidos**: Informações completas de cada vaga
- **Paginação**: Navegação eficiente entre páginas

### 3. **Análise Detalhada**
- **Parágrafos Problemáticos**: Texto específico que gerou alerta
- **Recomendações Explicadas**: Motivos detalhados para cada recomendação
- **Barras de Progresso**: Visualização clara dos percentuais de risco
- **Cores Intuitivas**: Verde (seguro) a Vermelho (crítico)

## 🛠️ Tecnologias

- **React 18** com TypeScript
- **React Router** para navegação
- **React Hook Form** com validação Zod
- **Tailwind CSS** para estilização
- **Lucide React** para ícones
- **Vite** como bundler

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   ├── pages/              # Páginas da aplicação
│   │   ├── VerificarOportunidadePage.tsx  # Página principal
│   │   └── DadosOportunidadesPage.tsx     # Dashboard de dados (NOVO!)
│   ├── types/              # Definições TypeScript
│   ├── utils/              # Utilitários
│   └── config.ts           # Configurações
├── public/                 # Arquivos estáticos
└── package.json
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- Backend rodando em http://localhost:8000
- MongoDB rodando em localhost:27017

### Instalação
```bash
cd frontend
npm install
```

### Desenvolvimento
```bash
npm run dev
```
Acesse: http://localhost:3002

### Build para Produção
```bash
npm run build
```

## 📱 Páginas da Aplicação

### 1. **Página Principal** (`/`)
- Formulário de análise de oportunidades
- Suporte a links e texto
- Resultados em tempo real
- Navegação para dashboard

### 2. **Dashboard de Dados** (`/dados-oportunidades`) - NOVO!
- Lista todas as oportunidades analisadas
- Filtros por nível de risco
- Busca por texto
- Estatísticas em tempo real
- Detalhes expandíveis

## 🎨 Interface

### **Cores do Sistema**
- **Verde**: Baixo risco (0-30%)
- **Amarelo**: Médio risco (31-60%)
- **Laranja**: Alto risco (61-85%)
- **Vermelho**: Crítico (86-100%)

### **Componentes Principais**
- **Cards de Vaga**: Informações resumidas
- **Barras de Progresso**: Visualização de percentuais
- **Alertas Coloridos**: Indicadores visuais de risco
- **Filtros Intuitivos**: Busca e filtragem fácil

## 🔗 Integração com Backend

### **Endpoints Utilizados**
- `POST /analyze` - Analisa oportunidade
- `GET /vagas` - Lista vagas com paginação
- `GET /vagas/{id}` - Obtém vaga específica

### **Estrutura de Dados**
```typescript
interface VagaCompleta {
  _id: string;
  titulo?: string;
  empresa?: string;
  descricao?: string;
  remuneracao?: string;
  nivel_risco: string;
  pontuacao_risco: number;
  alertas: string[];
  recomendacoes_detalhadas: Array<{
    titulo: string;
    explicacao: string;
    paragrafoProblematico?: string;
  }>;
  detalhes_risco: Record<string, number>;
  data_analise: string;
}
```

## 🚀 Funcionalidades em Destaque

### **Análise Inteligente**
- Extração automática de dados da vaga
- Identificação de padrões suspeitos
- Recomendações personalizadas
- Parágrafos problemáticos destacados

### **Dashboard Avançado**
- Visualização de todas as análises
- Filtros e busca em tempo real
- Estatísticas de risco
- Navegação intuitiva

### **Interface Responsiva**
- Design mobile-first
- Componentes adaptáveis
- Navegação fluida
- Feedback visual claro

## 🔧 Configuração

### **Variáveis de Ambiente**
```env
VITE_API_URL=http://localhost:8000
```

### **Personalização**
- Cores em `tailwind.config.js`
- Componentes em `src/components/`
- Páginas em `src/pages/`
- Tipos em `src/types/`

## 📊 Métricas e Estatísticas

O dashboard exibe:
- **Total de vagas** analisadas
- **Distribuição por nível de risco**
- **Empresas únicas** encontradas
- **Alertas de alto risco** identificados

## 🎯 Próximos Passos

- [ ] Exportação de dados (CSV/PDF)
- [ ] Gráficos de tendências
- [ ] Filtros avançados por data
- [ ] Relatórios personalizados
- [ ] Notificações de alertas críticos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.
