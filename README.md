# HUMAI - Verificar Oportunidade

Sistema independente para verificação de oportunidades de emprego, estágio, curso ou negócio para identificar possíveis riscos de tráfico humano ou golpes.

## 🚀 Funcionalidades

- **Análise de Oportunidades**: Sistema de análise baseado em regras para identificar padrões suspeitos
- **Extração Automática**: Extração automática de dados de links ou texto de publicações
- **Análise de Risco**: Classificação de risco (BAIXO, MÉDIO, ALTO, CRÍTICO) com pontuação
- **Recomendações**: Sugestões personalizadas baseadas no nível de risco identificado
- **Interface Moderna**: Design responsivo e intuitivo com cores UNODC

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Fonts**: Inter, JetBrains Mono

## 📦 Instalação

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:3001`

## 🎯 Como Usar

1. **Acesse a aplicação** em `http://localhost:3001`
2. **Escolha o tipo de entrada**:
   - **Por Link**: Cole o link da oportunidade
   - **Por Texto**: Cole o texto da publicação
3. **Extraia os dados** automaticamente clicando no botão correspondente
4. **Analise a oportunidade** clicando em "Analisar Risco da Oportunidade"
5. **Veja o resultado** com nível de risco, alertas e recomendações

## 🔍 Critérios de Análise

O sistema analisa os seguintes aspectos:

- **Título**: Palavras suspeitas relacionadas a exploração
- **Empresa**: Nome genérico ou suspeito
- **Descrição**: Elementos suspeitos como "viagem", "estrangeiro"
- **Requisitos**: Vagos ou genéricos
- **Remuneração**: Valores irrealistas
- **Contato**: Apenas WhatsApp sem email
- **Plataforma**: Redes sociais não profissionais

## 🎨 Design

- **Cores**: Paleta UNODC (azul e navy)
- **Tipografia**: Inter para texto, JetBrains Mono para código
- **Responsivo**: Funciona em desktop, tablet e mobile
- **Acessibilidade**: Contraste adequado e navegação por teclado

## 🔗 Integração

- **Denúncia**: Link direto para o sistema principal de denúncias
- **Independente**: Pode ser usado separadamente do sistema principal
- **API Ready**: Preparado para integração com backend futuro

## 📱 Responsividade

- **Mobile First**: Design otimizado para dispositivos móveis
- **Breakpoints**: xs (475px), sm (640px), md (768px), lg (1024px), xl (1280px), 3xl (1600px)
- **Componentes**: Adaptáveis a diferentes tamanhos de tela

## 🚀 Deploy

### Frontend (Vercel/Netlify)

```bash
cd frontend
npm run build
# Deploy da pasta dist/
```

### Variáveis de Ambiente

```env
VITE_APP_TITLE=HUMAI - Verificar Oportunidade
VITE_APP_DENUNCIA_URL=http://localhost:3000/denuncia-publica
```

## 📄 Licença

Este projeto faz parte do sistema HUMAI para combate ao tráfico humano em Moçambique.


