import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
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
import RoleSelector from './components/Lab/RoleSelector';
import { slugify } from './utils/slugify';

// Wrapper for validating role slug in the URL
const RoleGuard = ({ children }) => {
  const { roleSlug: urlSlug } = useParams();
  const { user } = useSelector(state => state.auth);
  const { selectedRole } = useSelector(state => state.simulation);
  
  const userRole = user?.selectedRole || selectedRole;
  const expectedSlug = userRole?.title ? slugify(userRole.title) : null;

  if (!expectedSlug) {
    return <Navigate to="/role-selection" replace />;
  }

  if (urlSlug !== expectedSlug) {
     return <Navigate to={`/${expectedSlug}/services`} replace />;
  }

  return children;
};

const App = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { progressLoading, preLabPhase, selectedRole } = useSelector((state) => state.simulation);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  const isOnboarded = user?.hasCompletedOnboarding === true || preLabPhase === 'completed';
  const roleSlug = user?.selectedRole?.title ? slugify(user.selectedRole.title) : (selectedRole?.title ? slugify(selectedRole.title) : null);

  return (
    <>
      <Toaster position="top-right" />
      
      {/* Non-destructive Loading Overlay */}
      {isAuthenticated && progressLoading && !isOnboarded && (
        <div className="fixed inset-0 bg-aws-bg flex items-center justify-center z-[9999] animate-in fade-in duration-300">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-aws-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium tracking-tight">Syncing your learning progress...</p>
          </div>
        </div>
      )}

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        
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
          {/* Root Dispatcher */}
          <Route 
            path="/" 
            element={
              !isAuthenticated ? <Navigate to="/login" replace /> :
              !isOnboarded ? (
                roleSlug ? <Navigate to={`/${roleSlug}/onboarding`} replace /> : <Navigate to="/role-selection" replace />
              ) : <Navigate to={`/${roleSlug}/services`} replace />
            } 
          />

          {/* Onboarding Flow */}
          <Route path="/role-selection" element={isOnboarded ? <Navigate to={`/${roleSlug}/services`} replace /> : <RoleSelector />} />
          <Route path="/:roleSlug/onboarding" element={isOnboarded ? <Navigate to={`/${roleSlug}/services`} replace /> : <OnboardingPage />} />
          
          {/* Main App Routes (Centralized under /:roleSlug/services) */}
          <Route path="/:roleSlug" element={<RoleGuard><Outlet /></RoleGuard>}>
            <Route element={<Layout />}>
              <Route 
                path="services" 
                element={isOnboarded ? <LabDashboard /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="services/lab/:labId" 
                element={isOnboarded ? <LabRunner /> : <Navigate to="/" replace />} 
              />
              <Route path="service/*" element={<ServiceRouter />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
