# Deploy - HUMAI Verificar Oportunidade

## 🚀 Deploy Frontend

### Vercel (Recomendado)

1. **Conectar repositório**:
   ```bash
   # Instalar Vercel CLI
   npm i -g vercel
   
   # Fazer login
   vercel login
   
   # Deploy
   cd frontend
   vercel
   ```

2. **Configurar variáveis de ambiente**:
   - `VITE_APP_DENUNCIA_URL`: URL do sistema principal de denúncias
   - `VITE_APP_MAIN_URL`: URL do sistema principal

### Netlify

1. **Build local**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy manual**:
   - Arrastar pasta `dist/` para Netlify
   - Configurar redirects para SPA

3. **Deploy automático**:
   - Conectar repositório GitHub
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/dist`

### Docker

1. **Criar Dockerfile**:
   ```dockerfile
   FROM node:18-alpine as builder
   WORKDIR /app
   COPY frontend/package*.json ./
   RUN npm ci
   COPY frontend/ .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Build e run**:
   ```bash
   docker build -t humai-verify-opportunity .
   docker run -p 3001:80 humai-verify-opportunity
   ```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Frontend (.env)
VITE_APP_TITLE=HUMAI - Verificar Oportunidade
VITE_APP_DENUNCIA_URL=https://humai.vercel.app/denuncia-publica
VITE_APP_MAIN_URL=https://humai.vercel.app
VITE_APP_VERSION=1.0.0
```

### Nginx (Docker)

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache estático
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📱 Domínios Sugeridos

- **Produção**: `verify.humai.mz` ou `verificar.humai.mz`
- **Staging**: `verify-staging.humai.mz`
- **Desenvolvimento**: `localhost:3001`

## 🔗 Integração

### Link para Sistema Principal

O sistema redireciona para denúncias usando a URL configurada:

```typescript
// config.ts
export const config = {
  urls: {
    denuncia: 'https://humai.vercel.app/denuncia-publica',
    mainApp: 'https://humai.vercel.app'
  }
};
```

### Analytics

Adicionar Google Analytics ou similar:

```typescript
// src/utils/analytics.ts
export const trackEvent = (event: string, data?: any) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', event, data);
  }
};
```

## 🚦 Health Check

Endpoint para verificar se o sistema está funcionando:

```typescript
// src/utils/health.ts
export const healthCheck = async () => {
  try {
    const response = await fetch('/api/health');
    return response.ok;
  } catch {
    return false;
  }
};
```

## 📊 Monitoramento

### Logs

- **Vercel**: Logs automáticos no dashboard
- **Netlify**: Logs de build e função
- **Docker**: `docker logs <container-id>`

### Métricas

- **Performance**: Core Web Vitals
- **Uso**: Páginas visitadas, análises realizadas
- **Erros**: JavaScript errors, 404s

## 🔄 CI/CD

### GitHub Actions

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

## 🛡️ Segurança

### Headers de Segurança

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }
});
```

### CSP (Content Security Policy)

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline' fonts.googleapis.com; 
               font-src 'self' fonts.gstatic.com;">
```
