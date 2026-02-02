import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, useLocation } from 'react-router-dom';
import AwsSidebar from './AwsSidebar';
import AwsTopBar from './AwsTopBar';
import { Outlet } from 'react-router-dom';
import LabStepPanel from '../LabStepPanel';
import LabResultPanel from '../LabResultPanel';
import { fetchLabById, clearActiveLab } from '../../store/labSlice';

import CloudShellPanel from './CloudShellPanel';
import { useState } from 'react';

const Layout = () => {
  const { activeLab } = useSelector(state => state.lab);
  const { currentStepId, isSubmitted } = useSelector(state => state.simulation);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const [showCloudShell, setShowCloudShell] = useState(false);

  // Restore Lab Context from URL
  useEffect(() => {
      const labId = searchParams.get('labId');
      if (labId && !activeLab) {
          dispatch(fetchLabById(labId));
      }
      // FAILSAFE: If navigating to a service without a labId, clear the active lab
      // This allows freestyle exploration without the sidebar appearing
      if (!labId && activeLab && location.pathname.startsWith('/service/')) {
           console.log("Freestyle navigation detected: clearing active lab");
           dispatch(clearActiveLab());
      }
  }, [searchParams, activeLab, dispatch, location.pathname]);

  return (
    <div className="flex flex-col h-screen w-full bg-aws-bg overflow-hidden text-aws-text">
      <AwsTopBar onToggleCloudShell={() => setShowCloudShell(!showCloudShell)} />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        {location.pathname !== '/' && <AwsSidebar />}

        {/* Mission Control Panel (Lab Steps) - Only show when NOT on home */}
        {activeLab && location.pathname !== '/' && (
            <LabStepPanel lab={activeLab} currentStepId={currentStepId} />
        )}
        
        <main className="flex-1 overflow-auto relative bg-[#f2f3f3]">
           {activeLab && isSubmitted ? <LabResultPanel /> : <Outlet />}
        </main>

        {/* Global CloudShell Panel */}
        {showCloudShell && <CloudShellPanel onClose={() => setShowCloudShell(false)} />}
      </div>
    </div>
  );
}; // End Component

export default Layout;
