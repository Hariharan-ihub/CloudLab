import { useSelector } from 'react-redux';

// Custom hook to get authenticated user info
export const useAuth = () => {
  const { user, isAuthenticated, loading, token } = useSelector((state) => state.auth);
  
  return {
    user,
    userId: user?.id,
    isAuthenticated,
    loading,
    token,
    username: user?.username,
    email: user?.email,
  };
};

