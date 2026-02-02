import { configureStore } from '@reduxjs/toolkit';
import labReducer from './labSlice';
import simulationReducer from './simulationSlice';

// Load state from localStorage
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('milai-lab-state');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

// Save state to localStorage
const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('milai-lab-state', serializedState);
  } catch {
    // ignore write errors
  }
};

const preloadedState = loadState();

export const store = configureStore({
  reducer: {
    lab: labReducer,
    simulation: simulationReducer,
  },
  preloadedState
});

store.subscribe(() => {
  saveState({
     lab: store.getState().lab,
     simulation: store.getState().simulation
  });
});
