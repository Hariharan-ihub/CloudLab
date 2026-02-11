import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from '../../store/authSlice';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google authentication failed. Please try again.');
      navigate('/login', { replace: true });
      return;
    }

    if (token) {
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Fetch user data and update auth state
      dispatch(getCurrentUser());
    } else {
      toast.error('Authentication failed. Please try again.');
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, dispatch]);

  // Navigate once authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      toast.success('Successfully signed in with Google!');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aws-blue to-aws-orange">
      <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
        <Loader className="animate-spin mx-auto mb-4 text-aws-blue" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Completing Sign In</h2>
        <p className="text-gray-600">Please wait while we sign you in...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;

