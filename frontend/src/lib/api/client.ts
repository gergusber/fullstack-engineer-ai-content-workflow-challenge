import axios, { AxiosError, AxiosResponse } from 'axios'

// Create base client
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth-token')
      : null

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
        window.location.href = '/login'
      }
    }

    // Handle other errors
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

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