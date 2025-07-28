// ✅ New: HTTP interceptor for automatic token refresh on 401s
let refreshInProgress = false;

export async function apiCall(url: string, options: RequestInit = {}) {
  let response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  // If unauthorized, try refresh once
  if (response.status === 401 && !refreshInProgress) {
    refreshInProgress = true;
    
    try {
      console.log('🔄 API got 401, attempting token refresh...');
      const { refreshAuthToken } = await import('@/app/(auth)/actions/auth');
      const refreshResult = await refreshAuthToken();
      
      if (refreshResult.success) {
        console.log('✅ Token refreshed, retrying request');
        // Retry original request
        response = await fetch(url, {
          ...options,
          credentials: 'include',
        });
      } else {
        console.log('❌ Token refresh failed, redirecting to login');
        window.location.href = '/';
      }
    } finally {
      refreshInProgress = false;
    }
  }

  return response;
}
  
  // Convenience methods
  export const api = {
    get: (url: string, options?: RequestInit) => 
      apiCall(url, { ...options, method: 'GET' }),
    
    post: (url: string, body?: any, options?: RequestInit) =>
      apiCall(url, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
    
    put: (url: string, body?: any, options?: RequestInit) =>
      apiCall(url, {
        ...options,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
    
    delete: (url: string, options?: RequestInit) =>
      apiCall(url, { ...options, method: 'DELETE' }),
  };
  