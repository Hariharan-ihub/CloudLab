import { configureStore } from '@reduxjs/toolkit';
import labReducer from './labSlice';
import simulationReducer from './simulationSlice';

export const store = configureStore({
  reducer: {
    lab: labReducer,
    simulation: simulationReducer,
  },
});
