import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import LabDashboard from './components/LabDashboard';
import LabRunner from './components/LabRunner';
import ServiceRouter from './components/ServiceRouter';
import SettingsPage from './components/SettingsPage';
import ResourceLoader from './components/ResourceLoader'; // Assuming ResourceLoader is in this path

const App = () => {
  return (
    <ResourceLoader>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LabDashboard />} />
          <Route path="lab/:labId" element={<LabRunner />} />
          <Route path="service/*" element={<ServiceRouter />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </ResourceLoader>
  );
};

export default App;
