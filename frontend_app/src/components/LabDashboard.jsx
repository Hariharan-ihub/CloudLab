import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLabs, clearActiveLab } from '../store/labSlice';
import { fetchResources, resetSimulation } from '../store/simulationSlice';
import { useNavigate } from 'react-router-dom';
import { Clock, BarChart, Server, Database, Shield, PlayCircle } from 'lucide-react';

const LabDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { labs, loading, error } = useSelector((state) => state.lab);
  const { resources } = useSelector((state) => state.simulation);

  useEffect(() => {
    dispatch(clearActiveLab()); // Ensure we are in "List Mode"
    dispatch(resetSimulation()); // Reset simulation progress
    dispatch(fetchLabs());
    dispatch(fetchResources({ userId: 'user-123', type: 'EC2_INSTANCE' }));
    dispatch(fetchResources({ userId: 'user-123', type: 'S3_BUCKET' }));
    dispatch(fetchResources({ userId: 'user-123', type: 'VPC' }));
    dispatch(fetchResources({ userId: 'user-123', type: 'IAM_USER' }));
  }, [dispatch]);

  const getIcon = (service) => {
      switch(service) {
          case 'EC2': return <Server className="text-orange-500" size={32} />;
          case 'S3': return <Database className="text-green-500" size={32} />;
          case 'IAM': return <Shield className="text-red-500" size={32} />;
          default: return <Server className="text-gray-500" size={32} />;
      }
  };

  const getColor = (service) => {
      switch(service) {
          case 'EC2': return 'border-orange-500';
          case 'S3': return 'border-green-500';
          case 'IAM': return 'border-red-500';
          default: return 'border-gray-300';
      }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Training Catalog...</div>;
  if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="text-center mb-12 mt-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Cloud Learning Scenarios</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Select a real-world problem to solve using simulated cloud infrastructure.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {labs.filter(lab => lab.title !== 'Build a Secure VPC Network').map((lab) => (
          <div 
            key={lab.labId} 
            className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-t-4 ${getColor(lab.service)} group h-full flex flex-col`}
          >
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg group-hover:scale-110 transition-transform">
                        {getIcon(lab.service)}
                    </div>
                </div>

              <h3 className="text-xl font-bold mb-2 group-hover:text-aws-blue transition-colors">{lab.title}</h3>
              <p className="text-gray-600 text-sm mb-6 h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  {lab.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 font-medium border-t pt-4 mt-auto">
                  <div className="flex items-center">
                      <Clock size={14} className="mr-1" /> {lab.estimatedTime} min
                  </div>
                  <div className="flex items-center">
                       <BarChart size={14} className="mr-1" /> {lab.service} Service
                  </div>
              </div>
            </div>

            <div 
                className="bg-gray-50 px-6 py-3 cursor-pointer hover:bg-aws-blue hover:text-white transition-colors flex justify-between items-center font-bold text-sm"
                onClick={() => navigate(`/lab/${lab.labId}`)}
            >
                Start Lab <span className="text-lg">→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LabDashboard;
