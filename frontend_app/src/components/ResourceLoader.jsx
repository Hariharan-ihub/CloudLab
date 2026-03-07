import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLabs } from '../store/labSlice';
import { loadUserProgress } from '../store/simulationSlice';

// This component can be used to pre-load global data
const ResourceLoader = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { userProgress, progressLoading } = useSelector((state) => state.simulation);

  useEffect(() => {
    // Fetch labs (idempotent in slice usually, but good to keep)
    dispatch(fetchLabs());
    
    // Load user progress if authenticated and not already loading/loaded
    if (isAuthenticated && user?.id && !userProgress && !progressLoading) {
      console.log('Loading user progress on app initialization...');
      dispatch(loadUserProgress({ userId: user.id }));
    }
  }, [dispatch, isAuthenticated, user, userProgress, progressLoading]);

  return <>{children}</>;
};

export default ResourceLoader;
