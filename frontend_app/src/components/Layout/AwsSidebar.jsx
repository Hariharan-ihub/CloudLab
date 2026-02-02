import React, { useState } from 'react';
import { Box, Home, Server, Database, Shield, Settings, Network, Lock, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AwsSidebar = () => {
  const location = useLocation();
  const { activeLab } = useSelector(state => state.lab);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Helper to check if a service is allowed
  const isAllowed = (path) => {
      if (!activeLab) return true; // Free mode
      if (path === '/' || path === '/settings') return true; // Always allow Home/Settings
      
      // Map service name to path segment
      const serviceMap = {
          'EC2': '/service/ec2',
          'S3': '/service/s3',
          'IAM': '/service/iam',
          'VPC': '/service/vpc',
          'EBS': '/service/ebs',
          'SECURITY_GROUP': '/service/securitygroups', // Assuming this maps
          'SECRETS_MANAGER': '/service/secretsmanager',
          'CLOUDWATCH': '/service/cloudwatch'
      };

      const allowedPath = serviceMap[activeLab.service];
      return path === allowedPath;
  };

  // Helper to preserve lab context in links
  const getLink = (path) => {
      if (activeLab) {
          return `${path}?labId=${activeLab.labId}`;
      }
      return path;
  };

  return (
    <div 
        className={`${isCollapsed ? 'w-[60px]' : 'w-[240px]'} bg-aws-nav text-white flex flex-col h-full flex-shrink-0 transition-all duration-300 z-40 relative`}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-700 h-[50px]">
        {!isCollapsed && <div className="font-bold text-lg text-gray-300 whitespace-nowrap overflow-hidden">Service Menu</div>}
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-white mx-auto md:mx-0 p-1"
        >
             {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
        {!activeLab && (
            <NavItem to={getLink('/')} icon={<Home size={20} />} label="Console Home" active={location.pathname === '/'} disabled={!isAllowed('/')} isCollapsed={isCollapsed} />
        )}
        
        {!isCollapsed && <div className="px-4 py-2 text-xs text-gray-500 font-bold uppercase mt-4 tracking-wider whitespace-nowrap">Compute</div>}
        <NavItem to={getLink('/service/ec2')} icon={<Server size={20} />} label="EC2" active={isActive('/service/ec2')} disabled={!isAllowed('/service/ec2')} isCollapsed={isCollapsed} />
        
        {!isCollapsed && <div className="px-4 py-2 text-xs text-gray-500 font-bold uppercase mt-4 tracking-wider whitespace-nowrap">Storage</div>}
        <NavItem to={getLink('/service/s3')} icon={<Database size={20} />} label="S3" active={isActive('/service/s3')} disabled={!isAllowed('/service/s3')} isCollapsed={isCollapsed} />
        <NavItem to={getLink('/service/ebs')} icon={<Box size={20} />} label="EBS" active={isActive('/service/ebs')} disabled={!isAllowed('/service/ebs')} isCollapsed={isCollapsed} comingSoon />
        
        {!isCollapsed && <div className="px-4 py-2 text-xs text-gray-500 font-bold uppercase mt-4 tracking-wider whitespace-nowrap">Networking & Security</div>}
        <NavItem to={getLink('/service/vpc')} icon={<Network size={20} />} label="VPC" active={isActive('/service/vpc')} disabled={!isAllowed('/service/vpc')} isCollapsed={isCollapsed} comingSoon />
        <NavItem to={getLink('/service/securitygroups')} icon={<Shield size={20} />} label="Security Groups" active={isActive('/service/securitygroups')} disabled={!isAllowed('/service/securitygroups')} isCollapsed={isCollapsed} comingSoon />
        <NavItem to={getLink('/service/iam')} icon={<Shield size={20} />} label="IAM" active={isActive('/service/iam')} disabled={!isAllowed('/service/iam')} isCollapsed={isCollapsed} />
        <NavItem to={getLink('/service/secretsmanager')} icon={<Lock size={20} />} label="Secrets Manager" active={isActive('/service/secretsmanager')} disabled={!isAllowed('/service/secretsmanager')} isCollapsed={isCollapsed} comingSoon />

        {!isCollapsed && <div className="px-4 py-2 text-xs text-gray-500 font-bold uppercase mt-4 tracking-wider whitespace-nowrap">Management</div>}
        <NavItem to={getLink('/service/cloudwatch')} icon={<Activity size={20} />} label="CloudWatch" active={isActive('/service/cloudwatch')} disabled={!isAllowed('/service/cloudwatch')} isCollapsed={isCollapsed} comingSoon />
      </nav>

      <div className="p-2 border-t border-gray-700">
        <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" active={location.pathname === '/settings'} disabled={false} isCollapsed={isCollapsed} />
      </div>
    </div>
  );
};

const NavItem = ({ to, icon, label, active, disabled, isCollapsed, comingSoon }) => (
  <Link 
    to={(disabled || comingSoon) ? '#' : to} 
    title={isCollapsed ? label : ''}
    className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-2.5 transition-all duration-200 group relative
        ${active ? 'bg-aws-navHover text-aws-orange border-l-4 border-aws-orange' : 'text-gray-300 hover:bg-aws-navHover hover:text-white border-l-4 border-transparent'}
        ${(disabled || comingSoon) ? 'opacity-50 cursor-not-allowed' : ''}
    `}
    onClick={(e) => (disabled || comingSoon) && e.preventDefault()}
  >
    <span className={`${isCollapsed ? '' : 'mr-3'} ${active ? 'text-aws-orange' : 'text-gray-400 group-hover:text-white'}`}>{icon}</span>
    {!isCollapsed && (
        <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis mr-2">{label}</span>
            {comingSoon ? (
                <span className="text-[9px] bg-blue-900/50 text-blue-200 px-1.5 py-0.5 rounded border border-blue-800 whitespace-nowrap">Soon</span>
            ) : (
                disabled && <Lock size={14} className="text-gray-500 ml-2" />
            )}
        </div>
    )}
  </Link>
);

export default AwsSidebar;
