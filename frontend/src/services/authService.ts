const API_URL = 'http://localhost:8000';

export interface LoginData {
  email: string;
  senha: string;
  instituicaoId: string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  instituicaoId: string;
  instituicaoNome: string;
  ativo: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(data: LoginData): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erro ao fazer login' }));
      throw new Error(error.detail || 'Erro ao fazer login');
    }

    return response.json();
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  },
};

