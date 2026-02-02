import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const validateStep = createAsyncThunk(
  'simulation/validateStep',
  async ({ userId, labId, stepId, action, payload }, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:5000/api/simulation/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, labId, stepId, action, payload }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data);
      }
      return { ...data, stepId, action };
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

export const startLab = createAsyncThunk(
  'simulation/startLab',
  async ({ userId, labId }, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:5000/api/simulation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`http://localhost:5000/api/simulation/resources?userId=${userId}&type=${type}`);
      if (!response.ok) throw new Error('Failed to fetch resources');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
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
    isSubmitted: false,
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
        logGroups: []
    }
  },
  reducers: {
    setCurrentStep: (state, action) => {
      state.currentStepId = action.payload;
      state.validationStatus = 'idle';
      state.lastMessage = '';
    },
    submitLab: (state, action) => {
      state.isSubmitted = true;
      state.finalScore = action.payload;
    },
    resetSimulation: (state) => {
      state.currentStepId = null;
      state.completedSteps = [];
      state.validationStatus = 'idle';
      state.lastMessage = '';
      state.isSubmitted = false;
      state.finalScore = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(startLab.fulfilled, (state, action) => {
         // Reset state on start
         state.isSubmitted = false;
         state.completedSteps = [];
         // Clear resources so we fetch fresh ones
         state.resources = { ec2: [], s3: [], iam: [], iamRoles: [], iamPolicies: [], vpc: [], subnet: [], securityGroup: [], secrets: [], logGroups: [] };
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
          if (!type || type === 'IAM_USER' || type === 'IAM_ROLE' || type === 'IAM_POLICY') {
               state.resources.iam = action.payload.filter(r => ['IAM_USER', 'IAM_ROLE', 'IAM_POLICY'].includes(r.resourceType));
               // IAM likely needs specific dedup if we split it, but currently it's a mix. Leaving as is or dedup by _id? 
               // Let's rely on _id for mixed list or better yet, unique names? 
               // For now, IAM duplicates weren't reported, focusing on VPC/EC2.
          }
          if (!type || type === 'VPC') state.resources.vpc = unique(action.payload.filter(r => r.resourceType === 'VPC'), 'vpcId');
          if (!type || type === 'SUBNET') state.resources.subnet = unique(action.payload.filter(r => r.resourceType === 'SUBNET'), 'subnetId');
          if (!type || type === 'SECURITY_GROUP') state.resources.securityGroup = unique(action.payload.filter(r => r.resourceType === 'SECURITY_GROUP'), 'groupId');
          if (!type || type === 'SECRETS_MANAGER_SECRET') state.resources.secrets = unique(action.payload.filter(r => r.resourceType === 'SECRETS_MANAGER_SECRET'), 'name');
          if (!type || type === 'CLOUDWATCH_LOG_GROUP') state.resources.logGroups = unique(action.payload.filter(r => r.resourceType === 'CLOUDWATCH_LOG_GROUP'), 'logGroupName');
          if (!type || type === 'EBS_VOLUME') state.resources.ebs = unique(action.payload.filter(r => r.resourceType === 'EBS_VOLUME'), 'volumeId');
      })
      .addCase(validateStep.pending, (state) => {
        state.validationStatus = 'validating';
      })
      .addCase(validateStep.fulfilled, (state, action) => {
        const { success, message, stepId } = action.payload; 
        state.lastMessage = message;
        if (success) {
          state.validationStatus = 'success';
          if (stepId && !state.completedSteps.includes(stepId)) {
            state.completedSteps.push(stepId);
          }
        } else {
          state.validationStatus = 'error';
        }
      })
      .addCase(validateStep.rejected, (state, action) => {
        state.validationStatus = 'error';
        state.lastMessage = action.payload?.message || 'Validation failed';
      });
  },
});

export const { setCurrentStep, resetSimulation, submitLab } = simulationSlice.actions;
export default simulationSlice.reducer;
