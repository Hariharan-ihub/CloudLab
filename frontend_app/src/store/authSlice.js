import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async ({ username, email, password, firstName, lastName }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, firstName, lastName }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data);
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data);
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

// Get current user
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue({ message: 'No token found' });
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return rejectWithValue(data);
      }

      return data;
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

// Complete onboarding
export const completeOnboarding = createAsyncThunk(
  'auth/completeOnboarding',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return rejectWithValue({ message: 'No token found' });

      const response = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      const data = await response.json();
      if (!response.ok) return rejectWithValue(data);

      // Update stored user if possible
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
            const user = JSON.parse(userStr);
            user.hasCompletedOnboarding = true;
            localStorage.setItem('user', JSON.stringify(user));
        } catch (e) { console.error('Error updating localStorage:', e); }
      }

      return data;
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

// Save selected role
export const saveRole = createAsyncThunk(
  'auth/saveRole',
  async (selectedRole, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return rejectWithValue({ message: 'No token found' });

      const response = await fetch('/api/auth/save-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selectedRole })
      });

      const data = await response.json();
      if (!response.ok) return rejectWithValue(data);

      // Update stored user if possible
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
            const user = JSON.parse(userStr);
            user.selectedRole = selectedRole;
            localStorage.setItem('user', JSON.stringify(user));
        } catch (e) { console.error('Error updating localStorage:', e); }
      }

      return data;
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    initializeAuth: (state) => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          state.user = JSON.parse(userStr);
          state.token = token;
          state.isAuthenticated = true;
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Registration failed';
        state.isAuthenticated = false;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
        state.isAuthenticated = false;
      })
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = localStorage.getItem('token'); // Ensure token is set
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      // Complete Onboarding
      .addCase(completeOnboarding.fulfilled, (state) => {
        if (state.user) {
          state.user.hasCompletedOnboarding = true;
        }
      })
      // Save Role
      .addCase(saveRole.fulfilled, (state, action) => {
        if (state.user) {
          state.user.selectedRole = action.payload.selectedRole;
        }
      });
  },
});

export const { logout, clearError, initializeAuth } = authSlice.actions;
export default authSlice.reducer;

