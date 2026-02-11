import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchLabs = createAsyncThunk('labs/fetchLabs', async () => {
  try {
    console.log('Fetching labs from /api/labs...');
    const response = await fetch('/api/labs');
    console.log('Response status:', response.status);
    console.log('Response type:', response.headers.get('content-type'));
    
    if (!response.ok) {
        const text = await response.text();
        console.error('Fetch failed:', text);
        throw new Error(`Failed to fetch labs: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Labs data:', data);
    return data;
  } catch (err) {
    console.error('Fetch error details:', err);
    throw err;
  }
});

export const fetchLabById = createAsyncThunk('labs/fetchLabById', async (labId) => {
  const response = await fetch(`/api/labs/${labId}`);
  if (!response.ok) throw new Error('Failed to fetch lab');
  return response.json();
});

const labSlice = createSlice({
  name: 'lab',
  initialState: {
    labs: [],
    activeLab: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearActiveLab: (state) => {
      state.activeLab = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLabs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLabs.fulfilled, (state, action) => {
        state.loading = false;
        state.labs = action.payload;
      })
      .addCase(fetchLabs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchLabById.pending, (state) => {
        state.loading = true;
        state.activeLab = null; // Clear previous
      })
      .addCase(fetchLabById.fulfilled, (state, action) => {
        state.loading = false;
        state.activeLab = action.payload;
      })
      .addCase(fetchLabById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearActiveLab } = labSlice.actions;
export default labSlice.reducer;
