import { authService } from '../services/authService';
import { BASE_URL } from '../config/api';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

class ApiClient {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { requiresAuth = true, headers = {}, ...restOptions } = options;

    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers as Record<string, string>,
    };

    // Agregar token de autenticación si es requerido
    if (requiresAuth) {
      const authHeaders = authService.getAuthHeaders();
      Object.assign(finalHeaders, authHeaders);
    }

    // Si el endpoint ya incluye /api o es una URL completa, usarlo tal cual
    // Si no, agregarlo al BASE_URL (que ya incluye /api)
    let url: string;
    if (endpoint.startsWith('http')) {
      url = endpoint;
    } else if (endpoint.startsWith('/api/')) {
      // El endpoint ya tiene /api, entonces usar solo el base sin /api
      const baseWithoutApi = BASE_URL.replace('/api', '');
      url = `${baseWithoutApi}${endpoint}`;
    } else {
      url = `${BASE_URL}${endpoint}`;
    }

    const response = await fetch(url, {
      ...restOptions,
      headers: finalHeaders,
    });

    if (!response.ok) {
      // Si es 401, el token expiró o es inválido
      if (response.status === 401 && requiresAuth) {
        // Solo hacer logout si realmente estábamos autenticados
        if (authService.isAuthenticated()) {
          authService.logout();
          // Nota: La redirección debe manejarse en el componente con useNavigate
          // No usamos window.location aquí para mantener compatibilidad con React Router
        }
        throw new Error('Unauthorized');
      }

      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // Si la respuesta está vacía, retornar null
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async get<T>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requiresAuth });
  }

  async post<T>(endpoint: string, data?: any, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      requiresAuth,
    });
  }

  async put<T>(endpoint: string, data?: any, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      requiresAuth,
    });
  }

  async delete<T>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requiresAuth });
  }
}

export const apiClient = new ApiClient();
