// Auth utility functions

// Get auth token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Get user ID from auth state or localStorage
export const getUserId = (authState) => {
  if (authState?.user?.id) {
    return authState.user.id;
  }
  
  // Fallback to localStorage
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.id;
    } catch (e) {
      return null;
    }
  }
  
  return null;
};

// Get auth headers for API requests
export const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

