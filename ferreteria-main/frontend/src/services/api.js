const API_BASE_URL = 'http://localhost:4000/api';

class ApiService {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.timeout = 10000;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      timeout: this.timeout,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return;
      }

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new ApiError(
          response.status,
          response.statusText,
          errorData
        );
      }

      return await this.parseResponse(response);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError(408, 'Request Timeout', 'Tiempo de espera agotado');
      }
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network Error', 'Error de conexión');
    }
  }

  async parseResponse(response) {
    const contentType = response.headers.get('Content-Type') || '';
    
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    
    if (contentType.includes('text/')) {
      return await response.text();
    }
    
    return await response.blob();
  }

  async parseErrorResponse(response) {
    try {
      const error = await response.json();
      return error.error || error.message || 'Error en la petición';
    } catch {
      return 'Error en la petición';
    }
  }

  // HTTP Methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, data = null) {
    const options = { method: 'DELETE' };
    if (data) {
      options.body = JSON.stringify(data);
    }
    return this.request(endpoint, options);
  }
}

class ApiError extends Error {
  constructor(status, statusText, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
  }
}

// Create a singleton instance
export const apiService = new ApiService();
export { ApiError };