import { apiRequest } from './client.js'

export const api = {
  users: {
    list: (token, role) =>
      apiRequest('/users', {
        token,
        params: role ? { role } : undefined
      }),
    create: (token, payload) =>
      apiRequest('/users', {
        method: 'POST',
        token,
        body: payload
      }),
    update: (token, id, payload) =>
      apiRequest(`/users/${id}`, {
        method: 'PUT',
        token,
        body: payload
      }),
    delete: (token, id) =>
      apiRequest(`/users/${id}`, {
        method: 'DELETE',
        token
      })
  },
  vehicles: {
    list: (token) =>
      apiRequest('/vehicles', {
        token
      }),
    create: (token, payload) =>
      apiRequest('/vehicles', {
        method: 'POST',
        token,
        body: payload
      }),
    update: (token, id, payload) =>
      apiRequest(`/vehicles/${id}`, {
        method: 'PUT',
        token,
        body: payload
      }),
    delete: (token, id) =>
      apiRequest(`/vehicles/${id}`, {
        method: 'DELETE',
        token
      })
  },
  products: {
    list: (token) =>
      apiRequest('/products', {
        token
      }),
    create: (token, payload) =>
      apiRequest('/products', {
        method: 'POST',
        token,
        body: payload
      }),
    update: (token, id, payload) =>
      apiRequest(`/products/${id}`, {
        method: 'PUT',
        token,
        body: payload
      }),
    delete: (token, id) =>
      apiRequest(`/products/${id}`, {
        method: 'DELETE',
        token
      })
  },
  deliveries: {
    list: (token, filters) =>
      apiRequest('/deliveries', {
        token,
        params: filters
      }),
    get: (token, id) =>
      apiRequest(`/deliveries/${id}`, {
        token
      }),
    create: (token, payload) =>
      apiRequest('/deliveries', {
        method: 'POST',
        token,
        body: payload
      }),
    update: (token, id, payload) =>
      apiRequest(`/deliveries/${id}`, {
        method: 'PUT',
        token,
        body: payload
      }),
    delete: (token, id) =>
      apiRequest(`/deliveries/${id}`, {
        method: 'DELETE',
        token
      }),
    generate: (token, payload) =>
      apiRequest('/deliveries/generate', {
        method: 'POST',
        token,
        body: payload
      })
  },
  courier: {
    list: (token, filters) =>
      apiRequest('/courier/deliveries', {
        token,
        params: filters
      }),
    get: (token, id) =>
      apiRequest(`/courier/deliveries/${id}`, {
        token
      })
  },
  route: {
    calculate: (token, payload) =>
      apiRequest('/routes/calculate', {
        method: 'POST',
        token,
        body: payload
      })
  }
}
