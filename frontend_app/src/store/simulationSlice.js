import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const validateStep = createAsyncThunk(
  'simulation/validateStep',
  async ({ userId, labId, stepId, action, payload }, { rejectWithValue }) => {
    console.log('📡 [Redux] validateStep API call:', { userId, labId, stepId, action, payload });
    
    try {
      const token = localStorage.getItem('token');
      const requestBody = { userId, labId, stepId, action, payload };
      console.log('📤 [Redux] Sending request to /api/simulation/validate:', requestBody);
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/simulation/validate', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });
      
      console.log('📥 [Redux] Response status:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📥 [Redux] Response data:', data);
      
      if (!response.ok) {
        console.error('❌ [Redux] API error response:', data);
        return rejectWithValue(data);
      }
      
      console.log('✅ [Redux] API success:', { ...data, stepId, action });
      return { ...data, stepId, action };
    } catch (error) {
      console.error('❌ [Redux] Network/Request error:', error);
      return rejectWithValue({ message: error.message });
    }
  }
);

export const startLab = createAsyncThunk(
  'simulation/startLab',
  async ({ userId, labId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/simulation/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, labId }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data);
      }
      return data;
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

export const fetchResources = createAsyncThunk(
  'simulation/fetchResources',
  async ({ userId, type }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/simulation/resources?userId=${userId}&type=${type}`, {
        headers
      });
      if (!response.ok) throw new Error('Failed to fetch resources');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitLab = createAsyncThunk(
  'simulation/submitLab',
  async ({ userId, labId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/simulation/submit', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, labId }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data);
      }
      // Return the submission object from the response
      return data.submission || data;
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

const simulationSlice = createSlice({
  name: 'simulation',
  initialState: {
    currentStepId: null,
    completedSteps: [],
    validationStatus: 'idle', // idle | validating | success | error
    lastMessage: '',
    lastValidatedStepId: null,
    
    // Submission State
    isSubmitted: false,
    submissionStatus: 'idle', // idle | submitting | success | error
    submissionResult: null,   // Holds the feedback & youtube links
    
    finalScore: 0,
    resources: { // Centralized resource store
        ec2: [],
        s3: [],
        iam: [],
        iamRoles: [],
        iamPolicies: [],
        vpc: [],
        subnet: [],
        securityGroup: [],
        secrets: [],
        logGroups: [],
        iamGroups: []
    }
  },
  reducers: {
    setCurrentStep: (state, action) => {
      state.currentStepId = action.payload;
      state.validationStatus = 'idle';
      state.lastMessage = '';
      state.lastValidatedStepId = null;
    },
    resetSimulation: (state) => {
      state.currentStepId = null;
      state.completedSteps = [];
      state.validationStatus = 'idle';
      state.lastMessage = '';
      state.isSubmitted = false;
      state.finalScore = 0;
      state.lastValidatedStepId = null;
      state.submissionStatus = 'idle';
      state.submissionResult = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(startLab.fulfilled, (state, action) => {
         // Reset state on start
         state.isSubmitted = false;
         state.completedSteps = [];
         state.submissionStatus = 'idle';
         state.submissionResult = null;
         // Clear resources so we fetch fresh ones
         state.resources = { ec2: [], s3: [], iam: [], iamRoles: [], iamPolicies: [], iamGroups: [], vpc: [], subnet: [], securityGroup: [], secrets: [], logGroups: [] };
      })
      .addCase(submitLab.pending, (state) => {
          state.submissionStatus = 'submitting';
      })
      .addCase(submitLab.fulfilled, (state, action) => {
          state.submissionStatus = 'success';
          state.isSubmitted = true;
          state.submissionResult = action.payload;
          state.finalScore = action.payload.score;
      })
      .addCase(submitLab.rejected, (state, action) => {
          state.submissionStatus = 'error';
          state.lastMessage = action.payload?.message || 'Submission failed';
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
          const type = action.meta.arg.type;
          
          const unique = (arr, key) => {
             const seen = new Set();
             return arr.filter(item => {
                 const val = item.state[key];
                 if(seen.has(val)) return false;
                 seen.add(val);
                 return true;
             });
          };

          if (!type || type === 'EC2_INSTANCE') state.resources.ec2 = unique(action.payload.filter(r => r.resourceType === 'EC2_INSTANCE'), 'instanceId');
          if (!type || type === 'S3_BUCKET') state.resources.s3 = unique(action.payload.filter(r => r.resourceType === 'S3_BUCKET'), 'bucketName');
          if (!type || ['IAM_USER', 'IAM_ROLE', 'IAM_POLICY', 'IAM_GROUP'].includes(type)) {
               state.resources.iam = unique(action.payload.filter(r => r.resourceType === 'IAM_USER'), 'userName');
               state.resources.iamRoles = unique(action.payload.filter(r => r.resourceType === 'IAM_ROLE'), 'roleName');
               state.resources.iamPolicies = unique(action.payload.filter(r => r.resourceType === 'IAM_POLICY'), 'policyName');
               state.resources.iamGroups = unique(action.payload.filter(r => r.resourceType === 'IAM_GROUP'), 'groupName');
          }
          if (!type || type === 'VPC') state.resources.vpc = unique(action.payload.filter(r => r.resourceType === 'VPC'), 'vpcId');
          if (!type || type === 'SUBNET') state.resources.subnet = unique(action.payload.filter(r => r.resourceType === 'SUBNET'), 'subnetId');
          if (!type || type === 'SECURITY_GROUP') state.resources.securityGroup = unique(action.payload.filter(r => r.resourceType === 'SECURITY_GROUP'), 'groupId');
          if (!type || type === 'SECRETS_MANAGER_SECRET') state.resources.secrets = unique(action.payload.filter(r => r.resourceType === 'SECRETS_MANAGER_SECRET'), 'name');
          if (!type || type === 'CLOUDWATCH_LOG_GROUP') state.resources.logGroups = unique(action.payload.filter(r => r.resourceType === 'CLOUDWATCH_LOG_GROUP'), 'logGroupName');
          if (!type || type === 'EBS_VOLUME') state.resources.ebs = unique(action.payload.filter(r => r.resourceType === 'EBS_VOLUME'), 'volumeId');
      })
      .addCase(validateStep.pending, (state) => {
        console.log('⏳ [Redux] validateStep.pending');
        state.validationStatus = 'validating';
      })
      .addCase(validateStep.fulfilled, (state, action) => {
        const { success, message, stepId } = action.payload;
        console.log('✅ [Redux] validateStep.fulfilled:', { success, message, stepId });
        
        state.lastMessage = message;
        state.lastValidatedStepId = stepId;
        if (success) {
          state.validationStatus = 'success';
          if (stepId && !state.completedSteps.includes(stepId)) {
            state.completedSteps.push(stepId);
            console.log('✅ [Redux] Step added to completedSteps:', stepId);
          }
        } else {
          console.warn('⚠️ [Redux] Validation failed:', message);
          state.validationStatus = 'error';
        }
      })
      .addCase(validateStep.rejected, (state, action) => {
        console.error('❌ [Redux] validateStep.rejected:', action.payload);
        state.validationStatus = 'error';
        state.lastMessage = action.payload?.message || 'Validation failed';
      });
  },
});

export const { setCurrentStep, resetSimulation } = simulationSlice.actions;
export default simulationSlice.reducer;
