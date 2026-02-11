import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // Initialize auth from localStorage on app load
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        
        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ResourceLoader>
                <Layout />
              </ResourceLoader>
            </ProtectedRoute>
          }
        >
          <Route index element={<LabDashboard />} />
          <Route path="lab/:labId" element={<LabRunner />} />
          <Route path="service/*" element={<ServiceRouter />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
