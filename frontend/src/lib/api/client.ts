// Base API configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const TIMEOUT = 30000

interface FetchOptions extends RequestInit {
  timeout?: number
}

// Custom fetch wrapper with timeout and auth
async function apiFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || TIMEOUT)

  // Get auth token
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('auth-token')
    : null

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // if (token) {
  //   headers.Authorization = `Bearer ${token}`
  // }

  try {
    const response = await fetch(url.startsWith('http') ? url : `${BASE_URL}${url}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Handle authentication errors
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
        window.location.href = '/login'
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      console.error('API Error:', errorData)
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error) {
      console.error('API Error:', error.message)
    }
    throw error
  }
}

// API client methods
export const apiClient = {
  get: async <T>(url: string) => {
    const response = await apiFetch(url, { method: 'GET' })
    return { data: await response.json() as T }
  },

  post: async <T>(url: string, data?: any) => {
    const response = await apiFetch(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
    return { data: await response.json() as T }
  },

  put: async <T>(url: string, data?: any) => {
    const response = await apiFetch(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
    return { data: await response.json() as T }
  },

  patch: async <T>(url: string, data?: any) => {
    const response = await apiFetch(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
    return { data: await response.json() as T }
  },

  delete: async <T>(url: string) => {
    const response = await apiFetch(url, { method: 'DELETE' })
    return { data: await response.json() as T }
  }
}

// API response wrapper type
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  count?: number
}

// Error response type
export interface ApiError {
  message: string
  statusCode: number
  timestamp: string
}