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
  async ({ userId, type, labId = null }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Include labId in query if provided, otherwise get all user resources
      const url = labId 
        ? `/api/simulation/resources?userId=${userId}&type=${type}&labId=${labId}`
        : `/api/simulation/resources?userId=${userId}&type=${type}`;
      
      const response = await fetch(url, {
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

// Load user progress and resources
export const loadUserProgress = createAsyncThunk(
  'simulation/loadUserProgress',
  async ({ userId, labId = null }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const url = labId 
        ? `/api/simulation/progress?userId=${userId}&labId=${labId}`
        : `/api/simulation/progress?userId=${userId}`;
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to load user progress');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

// Save resource history
export const saveResourceHistory = createAsyncThunk(
  'simulation/saveResourceHistory',
  async ({ userId, labId, resourceType, resourceData, resourceId, stepId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/resource-history/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId,
          labId: labId || null,
          resourceType,
          resourceData,
          resourceId: resourceId || null,
          stepId: stepId || null
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save resource history');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

// Get resource history
export const getResourceHistory = createAsyncThunk(
  'simulation/getResourceHistory',
  async ({ userId, labId = null, resourceType = null, service = null }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      let url;
      if (service) {
        url = `/api/resource-history/service?userId=${userId}&service=${service}`;
      } else {
        const params = new URLSearchParams({ userId });
        if (labId) params.append('labId', labId);
        if (resourceType) params.append('resourceType', resourceType);
        url = `/api/resource-history/history?${params.toString()}`;
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to get resource history');
      }
      
      const data = await response.json();
      return data;
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
    },
    
    // User Progress State
    userProgress: null,
    progressLoading: false,
    progressError: null,
    
    // Resource History State
    resourceHistory: null,
    historyLoading: false,
    historyError: null,

    // Pre-Lab Flow State
    preLabPhase: 'role', // null | 'role' | 'project' | 'jenkins' | 'completed'
    selectedRole: null,
    projectLink: '',
    repoInfo: null,
    jenkinsStatus: {
        status: 'idle', // idle | running | success | error
        currentStage: 0,
        stages: [
            { id: 1, name: 'Declarative: Checkout SCM', status: 'idle', logs: [] },
            { id: 2, name: 'AWS ECR Login', status: 'idle', logs: [] },
            { id: 3, name: 'Build & Push Docker Image', status: 'idle', logs: [] },
            { id: 4, name: 'Register New Task Definition with Latest Image', status: 'idle', logs: [] },
            { id: 5, name: 'Update ECS Service with New Task Definition', status: 'idle', logs: [] },
            { id: 6, name: 'Declarative: Post Actions', status: 'idle', logs: [] }
        ]
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
      
      // Note: We don't reset preLabPhase here as it's a global onboarding state
      // that should persist when navigating between labs or dashboard.
    },
    setPreLabPhase: (state, action) => {
      state.preLabPhase = action.payload;
    },
    setSelectedRole: (state, action) => {
      state.selectedRole = action.payload;
    },
    setProjectLink: (state, action) => {
      state.projectLink = action.payload;
      state.repoInfo = null; // Clear info when link changes
    },
    setRepoInfo: (state, action) => {
      state.repoInfo = action.payload;
    },
    updateJenkinsStage: (state, action) => {
        const { stageIndex, status, log } = action.payload;
        if (state.jenkinsStatus.stages[stageIndex]) {
            if (status) state.jenkinsStatus.stages[stageIndex].status = status;
            if (log) state.jenkinsStatus.stages[stageIndex].logs.push(log);
            if (status === 'running') state.jenkinsStatus.currentStage = stageIndex + 1;
        }
    },
    setJenkinsStatus: (state, action) => {
        state.jenkinsStatus.status = action.payload;
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
      })
      .addCase(loadUserProgress.pending, (state) => {
        state.progressLoading = true;
        state.progressError = null;
      })
      .addCase(loadUserProgress.fulfilled, (state, action) => {
        state.progressLoading = false;
        state.userProgress = action.payload;
        
        // Restore completed steps if progress exists
        if (action.payload.progress) {
          const progress = action.payload.progress;

          if (typeof progress === 'object' && !Array.isArray(progress)) {
            // Single lab progress
            if (progress.completedSteps) {
              state.completedSteps = progress.completedSteps;
            }
            if (progress.currentStep) {
              state.currentStepId = progress.currentStep;
            }
          } else if (typeof progress === 'object' && Object.keys(progress).length > 0) {
            // Multiple labs progress - use the first one or current lab
            const firstLabProgress = Object.values(progress)[0];
            if (firstLabProgress && firstLabProgress.completedSteps) {
              state.completedSteps = firstLabProgress.completedSteps;
            }
            if (firstLabProgress && firstLabProgress.currentStep) {
              state.currentStepId = firstLabProgress.currentStep;
            }
          }
        }
        
        // Restore resources if available
        if (action.payload.resources) {
          const resources = action.payload.resources;
          Object.keys(resources).forEach(resourceType => {
            const typeKey = resourceType.toLowerCase().replace(/_/g, '');
            if (typeKey === 'ec2instance') {
              state.resources.ec2 = resources[resourceType];
            } else if (typeKey === 's3bucket') {
              state.resources.s3 = resources[resourceType];
            } else if (typeKey === 'iamuser') {
              state.resources.iam = resources[resourceType];
            } else if (typeKey === 'iamrole') {
              state.resources.iamRoles = resources[resourceType];
            } else if (typeKey === 'iampolicy') {
              state.resources.iamPolicies = resources[resourceType];
            } else if (typeKey === 'iamgroup') {
              state.resources.iamGroups = resources[resourceType];
            } else if (typeKey === 'vpc') {
              state.resources.vpc = resources[resourceType];
            } else if (typeKey === 'subnet') {
              state.resources.subnet = resources[resourceType];
            } else if (typeKey === 'securitygroup') {
              state.resources.securityGroup = resources[resourceType];
            } else if (typeKey === 'secretsmanagersecret') {
              state.resources.secrets = resources[resourceType];
            } else if (typeKey === 'cloudwatchloggroup') {
              state.resources.logGroups = resources[resourceType];
            } else if (typeKey === 'ebsvolume') {
              state.resources.ebs = resources[resourceType] || [];
            }
          });
        }
      })
      .addCase(loadUserProgress.rejected, (state, action) => {
        state.progressLoading = false;
        state.progressError = action.payload?.message || 'Failed to load progress';
      })
      .addCase(saveResourceHistory.pending, (state) => {
        // Silent - don't show loading state for history saves
      })
      .addCase(saveResourceHistory.fulfilled, (state, action) => {
        // History saved successfully (silent success)
      })
      .addCase(saveResourceHistory.rejected, (state, action) => {
        // Silent failure - history is supplementary
        console.warn('Failed to save resource history:', action.payload?.message);
      })
      .addCase(getResourceHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(getResourceHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.resourceHistory = action.payload;
        state.historyError = null;
      })
      .addCase(getResourceHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload?.message || 'Failed to load resource history';
      })
      // Sync with Auth actions
      .addMatcher(
        (action) => action.type.endsWith('/fulfilled') && (
          action.type.startsWith('auth/login') || 
          action.type.startsWith('auth/register') || 
          action.type.startsWith('auth/getCurrentUser') ||
          action.type.startsWith('auth/saveRole') ||
          action.type.startsWith('auth/saveRepoInfo') ||
          action.type.startsWith('auth/completeOnboarding')
        ),
        (state, action) => {
          const user = action.payload.user || action.payload;
          if (user && typeof user === 'object') {
            if (user.onboardingPhase) state.preLabPhase = user.onboardingPhase;
            if (user.selectedRole) state.selectedRole = user.selectedRole;
            if (user.onboardingRepo) state.repoInfo = user.onboardingRepo;
          }
        }
      );
  },
});

export const { 
    setCurrentStep, 
    resetSimulation, 
    setPreLabPhase, 
    setSelectedRole, 
    setProjectLink, 
    setRepoInfo, 
    updateJenkinsStage, 
    setJenkinsStatus 
} = simulationSlice.actions;
export default simulationSlice.reducer;
