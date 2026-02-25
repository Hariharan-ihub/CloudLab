import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLabs } from '../store/labSlice';
import { loadUserProgress } from '../store/simulationSlice';

// This component can be used to pre-load global data
const ResourceLoader = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // We can pre-fetch labs here if we want them available globally
    // for search or other features, though dashboard does it too.
    dispatch(fetchLabs());
    
    // Load user progress if authenticated
    if (isAuthenticated && user?.id) {
      console.log('Loading user progress on app initialization...');
      dispatch(loadUserProgress({ userId: user.id }));
    }
  }, [dispatch, isAuthenticated, user]);

  return <>{children}</>;
};

export default ResourceLoader;
