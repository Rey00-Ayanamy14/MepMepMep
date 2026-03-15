import { apiRequest } from './client.js'

function createCrudApi(resourcePath, options = {}) {
  const {
    hasList = true,
    hasCreate = true,
    hasUpdate = true,
    hasDelete = true,
    customMethods = {}
  } = options

  const crudApi = {}

  if (hasList) {
    crudApi.list = (token, params) =>
      apiRequest(resourcePath, { token, params })
  }

  if (hasCreate) {
    crudApi.create = (token, payload) =>
      apiRequest(resourcePath, {
        method: 'POST',
        token,
        body: payload
      })
  }

  if (hasUpdate) {
    crudApi.update = (token, id, payload) =>
      apiRequest(`${resourcePath}/${id}`, {
        method: 'PUT',
        token,
        body: payload
      })
  }

  if (hasDelete) {
    crudApi.delete = (token, id) =>
      apiRequest(`${resourcePath}/${id}`, {
        method: 'DELETE',
        token
      })
  }

  return { ...crudApi, ...customMethods }
}

const PATHS = {
  USERS: '/users',
  VEHICLES: '/vehicles',
  PRODUCTS: '/products',
  DELIVERIES: '/deliveries',
  COURIER: '/courier/deliveries',
  ROUTES: '/routes',
  LEGACY: '/legacy',
  ANALYTICS: '/analytics',
  NOTIFICATIONS: '/notifications'
}

export const api = {
  users: createCrudApi(PATHS.USERS),
  vehicles: createCrudApi(PATHS.VEHICLES),
  products: createCrudApi(PATHS.PRODUCTS),
  
  deliveries: createCrudApi(PATHS.DELIVERIES, {
    customMethods: {
      get: (token, id) => apiRequest(`${PATHS.DELIVERIES}/${id}`, { token }),
      generate: (token, payload) =>
        apiRequest(`${PATHS.DELIVERIES}/generate`, {
          method: 'POST',
          token,
          body: payload
        })
    }
  }),
  
  courier: {
    list: (token, filters) =>
      apiRequest(PATHS.COURIER, { token, params: filters }),
    get: (token, id) =>
      apiRequest(`${PATHS.COURIER}/${id}`, { token })
  },
  
  route: {
    calculate: (token, payload) =>
      apiRequest(`${PATHS.ROUTES}/calculate`, {
        method: 'POST',
        token,
        body: payload
      })
  },
  
  legacy: {
    getOrders: (token) => apiRequest(`${PATHS.LEGACY}/orders`, { token }),
    getCustomers: (token) => apiRequest(`${PATHS.LEGACY}/customers`, { token }),
    syncData: (token, payload) =>
      apiRequest(`${PATHS.LEGACY}/sync`, {
        method: 'POST',
        token,
        body: payload
      })
  },
  
  analytics: {
    getStats: (token, period) =>
      apiRequest(`${PATHS.ANALYTICS}/stats`, {
        token,
        params: { period }
      }),
    getReport: (token, type, dateFrom, dateTo) =>
      apiRequest(`${PATHS.ANALYTICS}/report`, {
        token,
        params: { type, dateFrom, dateTo }
      })
  },
  
  notifications: {
    list: (token) => apiRequest(PATHS.NOTIFICATIONS, { token }),
    markRead: (token, id) =>
      apiRequest(`${PATHS.NOTIFICATIONS}/${id}/read`, {
        method: 'POST',
        token
      }),
    markAllRead: (token) =>
      apiRequest(`${PATHS.NOTIFICATIONS}/read-all`, {
        method: 'POST',
        token
      })
  }
}

export const oldApi = {
  fetchUsers: (token) => apiRequest('/old/users', { token }),
  fetchVehicles: (token) => apiRequest('/old/vehicles', { token }),
  fetchDeliveries: (token) => apiRequest('/old/deliveries', { token })
}
