import axios from 'axios';

// Create auth-aware API client for use in React components
// This should be used with the useAuth hook to get the session token
export const createAuthenticatedClient = (getToken: () => Promise<string | null>) => {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add Clerk token
  client.interceptors.request.use(
    async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to get auth token:', error);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle authentication errors
      if (error.response?.status === 401) {
        console.error('Authentication error - redirecting to sign in');
        if (typeof window !== 'undefined') {
          window.location.href = '/sign-in';
        }
      }

      // Handle other errors
      const errorMessage = error.response?.data?.message || error.message || 'Unknown API error';
      console.error('API Error:', errorMessage);
      return Promise.reject(error);
    }
  );

  return client;
};
