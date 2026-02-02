import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchLabs } from '../store/labSlice';

// This component can be used to pre-load global data
const ResourceLoader = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // We can pre-fetch labs here if we want them available globally
    // for search or other features, though dashboard does it too.
    dispatch(fetchLabs());
  }, [dispatch]);

  return <>{children}</>;
};

export default ResourceLoader;
