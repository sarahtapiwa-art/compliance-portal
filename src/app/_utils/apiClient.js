export class ApiClient {
    constructor(baseUrl = '') {
      this.baseUrl = baseUrl;
      this.defaultHeaders = {
        'Content-Type': 'application/json'
      };
      this.token = null;
    }
  
getAccessToken(userToken = null) {
  if (userToken) return userToken;
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('token') || 
           document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
  }
  return null;
}
  
    getHeaders() {
      const token = this.getAccessToken();
      return {
        ...this.defaultHeaders,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
    }
  
    setDefaultHeaders(headers) {
      this.defaultHeaders = { ...this.defaultHeaders, ...headers };
    }
  
  
    async postMultipart(endpoint, formData, headers = {}) {
      const url = `${this.baseUrl}${endpoint}`;
      const token = this.getAccessToken();
      const baseHeaders = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...headers
      };
  
      if (baseHeaders['Content-Type']) {
        delete baseHeaders['Content-Type'];
      }
  
      const response = await fetch(url, {
        method: 'POST',
        headers: baseHeaders,
        body: formData 
      });
  
      const contentType = response.headers.get('content-type');
      let data = null;
  
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (response.status !== 204) {
        try {
          data = await response.text();
        } catch (e) {
        }
      }
  
      if (!response.ok) {
        const error = new Error(data?.message || data || 'API request failed');
        error.status = response.status;
        error.data = data;
        throw error;
      }
  
      return data;
    }
  
    async request(endpoint, options = {}) {
      const url = `${this.baseUrl}${endpoint}`;
      const baseHeaders = this.getHeaders();
      const headers = {
        ...baseHeaders,
        ...(options.headers || {})
      };
      
      if (
        (options.method === 'PUT' || options.method === 'POST') &&
        options.body !== undefined &&
        !headers['Content-Type']
      ) {
        headers['Content-Type'] = 'application/json';
      }
  
      const fetchOptions = {
        method: options.method || 'GET',
        headers,
        ...options,
      };
  
      if (options.body !== undefined) {
        fetchOptions.body = typeof options.body === 'string' 
          ? options.body 
          : JSON.stringify(options.body);
      }
  
      const response = await fetch(url, fetchOptions);
  
      const contentType = response.headers.get('content-type');
      let data = null;
  
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (response.status !== 204) {
        try {
          data = await response.text();
        } catch (e) {
        }
      }
  
      if (!response.ok) {
        const error = new Error(data?.message || data || 'API request failed');
        error.status = response.status;
        error.data = data;
        throw error;
      }
  
      return data;
    }
  
    get(endpoint, params = {}, headers = {}) {
      const query = new URLSearchParams(params).toString();
      const url = query ? `${endpoint}?${query}` : endpoint;
      const mergedHeaders = {
        ...this.getHeaders(), 
        ...headers           
      };
      return this.request(url, { headers: mergedHeaders });
    }
  
    post(endpoint, body = {}, headers = {}) {
      const mergedHeaders = {
        ...this.getHeaders(), 
        ...headers           
      };
      return this.request(endpoint, {
        method: 'POST',
        body,
        headers: mergedHeaders,
      });
    }
    outlookPost(endpoint, body = {}, headers = {}) {
        const mergedHeaders = {
            // ...this.getHeaders(),
            ...headers
        };
        return this.request(endpoint, {
            method: 'POST',
            body,
            headers: mergedHeaders,
        });
    }
    
    put(endpoint, body = {}, headers = {}) {
      const mergedHeaders = {
        ...this.getHeaders(), 
        ...headers           
      };
      return this.request(endpoint, {
        method: 'PUT',
        body,
        headers: mergedHeaders,
      });
    }

    patch(endpoint, body = {}, headers = {}) {
        const mergedHeaders = {
            ...this.getHeaders(),
            ...headers
        };
        return this.request(endpoint, {
            method: 'PATCH',
            body,
            headers: mergedHeaders,
        });
    }

  
    delete(endpoint, headers = {}) {
      const mergedHeaders = {
        ...this.getHeaders(), 
        ...headers           
      };
      return this.request(endpoint, {
        method: 'DELETE',
        headers: mergedHeaders,
      });
    }
  
    getStands(params = {}) {
      return this.get('/api/v1/stands', params);
    }
  
    getStandById(id) {
      return this.get(`/api/v1/stands/${id}`);
    }
  
    createStand(data) {
      return this.post('/api/v1/stands', data);
    }
  
    updateStand(id, data) {
      return this.put(`/api/v1/stands/${id}`, data);
    }
  
    deleteStand(id) {
      return this.delete(`/api/v1/stands/${id}`);
    }
  
    getClientStands(clientId, params = {}) {
      return this.get(`/api/v1/clients/${clientId}/stands`, params);
    }
  
    allocateStandToClient(clientId, standId, data) {
      return this.put(`/api/v1/clients/${clientId}/stands/${standId}`, data);
    }
  
    deallocateStandFromClient(clientId, standId) {
      return this.delete(`/api/v1/clients/${clientId}/stands/${standId}`);
    }
  
    getAvailableStands(productId, params = {}) {
      return this.get(`/api/v1/flexi-term-products/${productId}/stands`, {
        ...params,
        status: 'UNALLOCATED'
      });
    }
  
  
    getDepartments(params = {}) {
      return this.get(`/api/v1/departments`, {
        ...params,
      });
    }
  
    getReturnDefinition(params = {}) {
      return this.get('/api/v1/return-definition', params);
    }
  }

const isDev = process.env.NODE_ENV === 'development';

// In dev: '' so fetch calls go to frontend proxy
// In prod: full backend URL
const baseUrl = isDev ? '' : process.env.NEXT_PUBLIC_API_BASE_URL || 'https://192.168.3.143:18000';


export const apiClient = new ApiClient(baseUrl)