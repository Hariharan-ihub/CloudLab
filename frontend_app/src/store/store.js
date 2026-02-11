import { configureStore } from '@reduxjs/toolkit';
import labReducer from './labSlice';
import simulationReducer from './simulationSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    lab: labReducer,
    simulation: simulationReducer,
    auth: authReducer,
  },
});
