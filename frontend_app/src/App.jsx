import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { initializeAuth } from './store/authSlice';
import Layout from './components/Layout/Layout';
import LabDashboard from './components/LabDashboard';
import LabRunner from './components/LabRunner';
import ServiceRouter from './components/ServiceRouter';
import SettingsPage from './components/SettingsPage';
import ResourceLoader from './components/ResourceLoader';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import GoogleCallback from './components/Auth/GoogleCallback';
import OnboardingPage from './components/OnboardingPage';

const App = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { progressLoading } = useSelector((state) => state.simulation);

  useEffect(() => {
    // Initialize auth from localStorage on app load
    dispatch(initializeAuth());
  }, [dispatch]);

  const { preLabPhase } = useSelector((state) => state.simulation);
  const isOnboarded = user?.hasCompletedOnboarding === true || preLabPhase === 'completed';

  // If we are currently loading progress, show a global loader
  // but only if we are authenticated (otherwise we are just on login/register)
  if (isAuthenticated && progressLoading && !isOnboarded) {
    return (
      <div className="min-h-screen bg-aws-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-aws-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium tracking-tight">Syncing your learning progress...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        
        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <ResourceLoader>
                <Outlet />
              </ResourceLoader>
            </ProtectedRoute>
          }
        >
          {/* Onboarding is protected but doesn't use the main Layout */}
          <Route path="/onboarding" element={<OnboardingPage />} />
          
          {/* Main App Routes with Navigation Layout */}
          <Route element={<Layout />}>
            <Route 
              path="/" 
              element={isOnboarded ? <LabDashboard /> : <Navigate to="/onboarding" replace />} 
            />
            <Route 
              path="lab/:labId" 
              element={isOnboarded ? <LabRunner /> : <Navigate to="/onboarding" replace />} 
            />
            <Route path="service/*" element={<ServiceRouter />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default App;
