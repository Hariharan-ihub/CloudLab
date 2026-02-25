const SimulatedResource = require('../models/SimulatedResource');
const UserProgress = require('../models/UserProgress');
const Step = require('../models/Step');
const Lab = require('../models/Lab');
const LabSubmission = require('../models/LabSubmission');
const ResourceHistory = require('../models/ResourceHistory');
const axios = require('axios');
const geminiService = require('../services/geminiService');
const youtubeService = require('../services/youtubeService');

// Helper function to save resource history
async function saveResourceHistory(userId, labId, resourceType, resourceData, resourceId, stepId) {
  try {
    const historyEntry = new ResourceHistory({
      userId,
      labId: labId || null,
      resourceType,
      resourceData,
      resourceId: resourceId || null,
      stepId: stepId || null,
      status: 'active'
    });
    await historyEntry.save();
    console.log(`✅ [Backend] Resource history saved for ${resourceType}`);
    return historyEntry;
  } catch (error) {
    console.error(`⚠️ [Backend] Failed to save resource history for ${resourceType}:`, error);
    // Don't throw - history is supplementary
    return null;
  }
}

// Initialize Lab Environment
exports.startLab = async (req, res) => {
  const { userId, labId } = req.body;
  try {
    const lab = await Lab.findOne({ labId });
    if (!lab) return res.status(404).json({ message: 'Lab not found' });

    // Reset Environment - Only delete resources for this specific lab
    // If labId is provided, only delete resources for that lab
    // This allows users to have resources from multiple labs
    const deleteQuery = labId 
      ? { userId, labId } // Delete only resources for this lab
      : { userId, labId: null }; // Delete only resources not associated with any lab (legacy)
    
    await SimulatedResource.deleteMany(deleteQuery);
    await UserProgress.findOneAndDelete({ userId, labId });

    // Seed Initial State
    if (lab.initialState) {
        const seeds = [];
        for (const [key, resources] of Object.entries(lab.initialState)) {
            let resourceType = key.toUpperCase();
            if (key === 'vpc') resourceType = 'VPC';
            if (key === 'subnet') resourceType = 'SUBNET';
            if (key === 'securityGroup') resourceType = 'SECURITY_GROUP';
            if (key === 'ec2') resourceType = 'EC2_INSTANCE';
            if (key === 's3') resourceType = 'S3_BUCKET';
            if (key === 'iamUser') resourceType = 'IAM_USER';

            for (const resourceState of resources) {
                 seeds.push({
                     userId,
                     labId, // Associate seeded resources with this lab
                     resourceType,
                     state: resourceState,
                     status: 'active'
                 });
            }
        }
        if (seeds.length > 0) {
             await SimulatedResource.insertMany(seeds);
        }
    }

    res.json({ success: true, message: 'Lab started and environment seeded.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch resources for a specific service type
// Fetch resources for a specific service type
exports.getResources = async (req, res) => {
  const { userId, type, labId } = req.query;
  try {
    // Build query - if labId is provided, filter by it, otherwise get all user resources
    const query = { userId, resourceType: type };
    
    // If labId is provided, get resources for that lab OR resources not associated with any lab (for backward compatibility)
    if (labId) {
      query.$or = [
        { labId: labId },
        { labId: null } // Include legacy resources without labId
      ];
    }
    
    const resources = await SimulatedResource.find(query);
    
    // SIMULATION: Calculate Dynamic State for EC2
    const now = new Date();
    const dynamicResources = resources.map(r => {
        const doc = r.toObject();
        if (doc.resourceType === 'EC2_INSTANCE' && doc.state.status === 'running') {
            const launchTime = new Date(doc.state.launchTime);
            // 15 Seconds "Pending" State Simulation
            if ((now - launchTime) < 15000) {
                doc.state.status = 'pending';
            }
        }
        return doc;
    });

    res.json(dynamicResources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Unified Validation & Action Handler
exports.validateAction = async (req, res) => {
  const { userId, labId, stepId, action, payload } = req.body;

  console.log('🔍 [Backend] validateAction called:', {
    userId,
    labId,
    stepId,
    action,
    payload: payload ? { ...payload, userData: payload.userData ? '[hidden]' : undefined } : null,
    timestamp: new Date().toISOString()
  });

  try {
    // 1. Validate Step (if associated with a Lab Step)
    let success = true;
    let message = 'Action completed.';
    
    if (stepId) {
        console.log(`🔍 [Backend] Looking for step: stepId=${stepId}, labId=${labId}`);
        const step = await Step.findOne({ stepId: stepId, labId: labId });
        
        if (step) {
             console.log(`✅ [Backend] Step found:`, {
               stepId: step.stepId,
               title: step.title,
               expectedAction: step.expectedAction,
               order: step.order,
               receivedAction: action
             });
             
             // 1a. Validate Sequence (New)
             if (step.order > 1) {
                 console.log(`🔍 [Backend] Checking step sequence (order: ${step.order})`);
                 let progress = await UserProgress.findOne({ userId, labId });
                 
                 // Special handling for launch step - auto-complete missing steps if payload has data
                 if (action === 'CLICK_FINAL_LAUNCH') {
                   console.log(`🚀 [Backend] Launch action detected, checking for missing step validations...`);
                   console.log(`📦 [Backend] Payload received:`, {
                     name: payload?.name,
                     ami: payload?.ami,
                     instanceType: payload?.instanceType,
                     vpcId: payload?.vpcId,
                     subnetId: payload?.subnetId
                   });
                   
                   // Get all previous steps - use labId string (not MongoDB _id)
                   const allPreviousSteps = await Step.find({ 
                     labId: labId,  // Use labId from request, not step.labId
                     order: { $lt: step.order } 
                   }).sort({ order: 1 });
                   
                   console.log(`🔍 [Backend] Found ${allPreviousSteps.length} previous steps for labId: ${labId}`);
                   allPreviousSteps.forEach(s => {
                     console.log(`  - Step ${s.order}: ${s.stepId} (${s.title})`);
                   });
                   
                   // Initialize progress if it doesn't exist
                   if (!progress) {
                     progress = new UserProgress({ userId, labId, completedSteps: [], currentStep: step.stepId });
                     console.log(`📝 [Backend] Created new progress record`);
                   } else {
                     console.log(`📝 [Backend] Existing progress:`, { completedSteps: progress.completedSteps });
                   }
                   
                   // Check each previous step and auto-complete if payload has required data
                   let allStepsComplete = true;
                   for (const prevStep of allPreviousSteps) {
                     const isCompleted = progress.completedSteps.includes(prevStep.stepId);
                     
                     if (!isCompleted) {
                       console.log(`⚠️ [Backend] Step ${prevStep.order} (${prevStep.stepId}) not completed`);
                       console.log(`   Validation logic:`, prevStep.validationLogic);
                       console.log(`   Expected action:`, prevStep.expectedAction);
                       
                       // Check if payload has the required field for this step
                       const stepField = prevStep.validationLogic?.field;
                       const hasData = stepField && payload && payload[stepField];
                       
                       console.log(`   Checking payload for field "${stepField}":`, hasData ? `Found: ${payload[stepField]}` : 'Not found');
                       
                       // Special cases for steps that don't have field-based validation
                       const stepType = prevStep.validationLogic?.type;
                       const hasGenericData = !stepField && (
                         (stepType === 'CLICK_BUTTON' && payload) ||
                         (stepType === 'URL_CONTAINS' && payload) ||
                         (prevStep.expectedAction === 'NAVIGATE' && payload)
                       );
                       
                       if (hasData || hasGenericData) {
                         console.log(`✅ [Backend] Auto-completing step ${prevStep.order} (${prevStep.stepId}) - payload has required data`);
                         if (!progress.completedSteps.includes(prevStep.stepId)) {
                           progress.completedSteps.push(prevStep.stepId);
                           console.log(`   Added to completedSteps`);
                         }
                       } else {
                         console.warn(`❌ [Backend] Step ${prevStep.order} (${prevStep.stepId}) missing required data:`);
                         console.warn(`   Field: ${stepField}, Type: ${stepType}, Payload keys:`, Object.keys(payload || {}));
                         allStepsComplete = false;
                         const errorMsg = `Please complete step ${prevStep.order}: ${prevStep.title} first.`;
                         await progress.save(); // Save any auto-completed steps
                         console.log(`💾 [Backend] Saved progress before returning error`);
                         return res.json({ success: false, message: errorMsg });
                       }
                     } else {
                       console.log(`✅ [Backend] Step ${prevStep.order} (${prevStep.stepId}) already completed`);
                     }
                   }
                   
                   // Save progress with auto-completed steps
                   if (allStepsComplete) {
                     await progress.save();
                     console.log(`✅ [Backend] All previous steps validated/completed. Saved progress:`, { completedSteps: progress.completedSteps });
                   }
                 } else {
                   // Normal validation for non-launch actions
                   const prevStep = await Step.findOne({ labId: step.labId, order: step.order - 1 });
                   
                   console.log(`🔍 [Backend] Previous step check:`, {
                     prevStep: prevStep ? { stepId: prevStep.stepId, title: prevStep.title } : null,
                     progress: progress ? { completedSteps: progress.completedSteps } : null
                   });
                   
                   if (prevStep && (!progress || !progress.completedSteps.includes(prevStep.stepId))) {
                     const errorMsg = `Please complete step ${step.order - 1}: ${prevStep.title} first.`;
                     console.warn(`⚠️ [Backend] Step sequence validation failed: ${errorMsg}`);
                     return res.json({ success: false, message: errorMsg });
                   }
                 }
             }

             // Flexible action matching for SELECT operations
             const isSelectAction = (expected, received) => {
               // Map SELECT_OPTION to specific SELECT actions based on field
               if (received === 'SELECT_OPTION' && payload?.field) {
                 const fieldToActionMap = {
                   'ami': 'SELECT_AMI',
                   'instanceType': 'SELECT_INSTANCE_TYPE'
                 };
                 const mappedAction = fieldToActionMap[payload.field];
                 return mappedAction === expected;
               }
               return expected === received;
             };

             if (step.expectedAction !== 'GENERIC' && !isSelectAction(step.expectedAction, action)) {
                 success = false;
                 message = `Incorrect action. Expected ${step.expectedAction}, got ${action}`;
                 console.warn(`⚠️ [Backend] Action mismatch:`, { 
                   expected: step.expectedAction, 
                   received: action,
                   payloadField: payload?.field 
                 });
             } else {
                 console.log(`✅ [Backend] Action validation passed: ${action} (expected: ${step.expectedAction})`);
             }
             // Add payload validation logic here if needed details
        } else {
            console.warn(`⚠️ [Backend] Step not found: stepId=${stepId}, labId=${labId}`);
        }
    } else {
        console.log(`ℹ️ [Backend] No stepId provided, skipping step validation`);
    }

    // 2. Perform Side Effects (Simulate Cloud State) if validation passed (or if no step validation required)
    if (success) {
        console.log(`✅ [Backend] Validation passed, processing action: ${action}`);
        
        // --- EC2 HANDLERS ---
        if (action === 'CLICK_FINAL_LAUNCH') {
            console.log('🚀 [Backend] Processing CLICK_FINAL_LAUNCH action');
            console.log('📦 [Backend] Payload received:', {
              name: payload?.name,
              ami: payload?.ami,
              instanceType: payload?.instanceType,
              vpcId: payload?.vpcId,
              subnetId: payload?.subnetId,
              securityGroups: payload?.securityGroups,
              hasUserData: !!payload?.userData,
              hasKeyPair: !!payload?.keyPair,
              storage: payload?.storage
            });
            
            try {
              const instanceData = {
                userId,
                labId: labId || null, // Associate with lab if provided
                resourceType: 'EC2_INSTANCE',
                state: {
                    name: payload.name || 'MyInstance',
                    ami: payload.ami,
                    instanceType: payload.instanceType,
                    vpcId: payload.vpcId || 'vpc-default',
                    subnetId: payload.subnetId || 'subnet-default',
                    securityGroups: payload.securityGroups || [],
                    userData: payload.userData || '',
                    status: 'running',
                    instanceId: `i-${Math.random().toString(36).substr(2, 9)}`,
                    launchTime: new Date().toISOString()
                },
                status: 'running'
              };
              
              console.log('💾 [Backend] Creating instance:', {
                userId: instanceData.userId,
                resourceType: instanceData.resourceType,
                state: {
                  name: instanceData.state.name,
                  ami: instanceData.state.ami,
                  instanceType: instanceData.state.instanceType,
                  instanceId: instanceData.state.instanceId
                }
              });
              
              const newInstance = new SimulatedResource(instanceData);
              await newInstance.save();
              
              console.log('✅ [Backend] Instance saved successfully:', {
                _id: newInstance._id,
                instanceId: newInstance.state.instanceId,
                name: newInstance.state.name
              });
              
              // Save to resource history
              await saveResourceHistory(
                userId,
                labId,
                'EC2_INSTANCE',
                {
                  name: payload.name || 'MyInstance',
                  ami: payload.ami,
                  instanceType: payload.instanceType,
                  vpcId: payload.vpcId,
                  subnetId: payload.subnetId,
                  securityGroups: payload.securityGroups || [],
                  userData: payload.userData || '',
                  keyPair: payload.keyPair || '',
                  storage: payload.storage || {}
                },
                newInstance._id,
                stepId
              );
              
              message = 'Instance launched successfully!';
            } catch (dbError) {
              console.error('❌ [Backend] Database error saving instance:', dbError);
              success = false;
              message = `Database error: ${dbError.message}`;
            }
        }

        if (action === 'TERMINATE_INSTANCE') {
             if (payload.resourceId) {
                 await SimulatedResource.findByIdAndDelete(payload.resourceId);
                 message = 'Instance terminated.';
             } else {
                 // Fallback for older payloads or safeguards
                 await SimulatedResource.findOneAndDelete({ 
                     userId, 
                     resourceType: 'EC2_INSTANCE', 
                     'state.instanceId': payload.instanceId 
                 });
                 message = 'Instance terminated (legacy).';
             }
        }

        if (action === 'STOP_INSTANCE') {
            const inst = await SimulatedResource.findById(payload.resourceId);
            if (inst) {
                inst.state.status = 'stopped';
                inst.markModified('state');
                await inst.save();
                message = 'Instance stopped.';
            }
        }

        if (action === 'START_INSTANCE') {
            const inst = await SimulatedResource.findById(payload.resourceId);
            if (inst) {
                inst.state.status = 'running';
                inst.markModified('state');
                await inst.save();
                message = 'Instance started.';
            }
        }

        if (action === 'REBOOT_INSTANCE') {
             // Simulate reboot by just message or toggle status briefly if real-time
             message = 'Instance rebooted.';
        }

        // --- S3 HANDLERS ---
        if (action === 'CREATE_BUCKET') {
            // Check for duplicate name globally (mocked per user for now)
            const existing = await SimulatedResource.findOne({ 
                resourceType: 'S3_BUCKET', 
                'state.bucketName': payload.bucketName 
            });
            
            if (existing) {
                return res.json({ success: false, message: 'Bucket name already exists.' });
            }

            const newBucket = new SimulatedResource({
                userId,
                labId: labId || null,
                resourceType: 'S3_BUCKET',
                state: {
                    bucketName: payload.bucketName,
                    region: 'us-east-1',
                    objects: [] // Array of objects basic
                },
                status: 'active'
            });
            await newBucket.save();
            
            // Save to resource history
            await saveResourceHistory(
              userId,
              labId,
              'S3_BUCKET',
              {
                bucketName: payload.bucketName,
                region: 'us-east-1',
                aclEnabled: payload.aclEnabled || false,
                blockPublicAccess: payload.blockPublicAccess !== false,
                versioning: payload.versioning || false,
                encryption: payload.encryption || 'SSE-S3'
              },
              newBucket._id,
              stepId
            );
            
            message = 'Bucket created successfully!';
        }

        if (action === 'UPLOAD_OBJECT') {
            const bucket = await SimulatedResource.findOne({ 
                userId, 
                resourceType: 'S3_BUCKET', 
                'state.bucketName': payload.bucketName 
            });

            if (bucket) {
                const newObject = {
                    key: payload.fileName,
                    size: payload.fileSize || '1KB',
                    lastModified: new Date().toISOString()
                };
                
                const currentObjects = bucket.state.objects || [];
                bucket.state.objects = [...currentObjects, newObject];
                bucket.markModified('state');
                await bucket.save();
                message = `Uploaded ${payload.fileName} to ${payload.bucketName}`;
            } else {
                return res.json({ success: false, message: 'Bucket not found.' });
            }
        }

        if (action === 'DELETE_BUCKET') {
             await SimulatedResource.findOneAndDelete({ 
                 userId, 
                 resourceType: 'S3_BUCKET', 
                 'state.bucketName': payload.bucketName 
             });
             message = `Bucket ${payload.bucketName} deleted.`;
        }

        if (action === 'DELETE_OBJECT') {
            const bucket = await SimulatedResource.findOne({ 
                userId, 
                resourceType: 'S3_BUCKET', 
                'state.bucketName': payload.bucketName 
            });
            if (bucket) {
                const currentObjects = bucket.state.objects || [];
                const updatedObjects = currentObjects.filter(obj => obj.key !== payload.fileName);
                bucket.state.objects = updatedObjects;
                bucket.markModified('state');
                await bucket.save();
                message = `Object ${payload.fileName} deleted.`;
            }
        }

        if (action === 'TOGGLE_VERSIONING') {
             const bucket = await SimulatedResource.findOne({ 
                userId, 
                resourceType: 'S3_BUCKET', 
                'state.bucketName': payload.bucketName 
            });
            if (bucket) {
                bucket.state.versioning = payload.enabled ? 'Enabled' : 'Suspended';
                bucket.markModified('state');
                await bucket.save();
                message = `Bucket versioning ${payload.enabled ? 'enabled' : 'suspended'}.`;
            }
        }

        // --- SECRETS MANAGER HANDLERS ---
        if (action === 'CREATE_SECRET') {
             const newSecret = new SimulatedResource({
                 userId,
                 labId: labId || null,
                 resourceType: 'SECRETS_MANAGER_SECRET',
                 state: {
                     name: payload.name,
                     description: payload.description || '',
                     secretValue: payload.secretValue, // In real app, encrypt this!
                     createdDate: new Date().toISOString()
                 },
                 status: 'active'
             });
             await newSecret.save();
             message = 'Secret created successfully!';
        }

        if (action === 'DELETE_SECRET') {
             await SimulatedResource.findOneAndDelete({
                 userId,
                 resourceType: 'SECRETS_MANAGER_SECRET',
                 'state.name': payload.name
             });
             message = 'Secret deleted.';
        }

        // --- CLOUDWATCH HANDLERS ---
        if (action === 'CREATE_LOG_GROUP') {
             const newGroup = new SimulatedResource({
                 userId,
                 labId: labId || null,
                 resourceType: 'CLOUDWATCH_LOG_GROUP',
                 state: {
                     logGroupName: payload.logGroupName,
                     retention: payload.retention || 'Never expire',
                     createdDate: new Date().toISOString()
                 },
                 status: 'active'
             });
             await newGroup.save();
             message = 'Log group created.';
        }

        // --- IAM HANDLERS ---
        if (action === 'CREATE_IAM_USER') {
             const newUser = new SimulatedResource({
                userId,
                labId: labId || null,
                resourceType: 'IAM_USER',
                state: {
                    userName: payload.userName,
                    groups: payload.group || '-', // This relies on the frontend passing the group name
                    lastActive: 'Never',
                    created: new Date().toISOString()
                },
                status: 'active'
            });
            await newUser.save();
            
            // Save to resource history
            await saveResourceHistory(
              userId,
              labId,
              'IAM_USER',
              {
                userName: payload.userName,
                group: payload.group || null
              },
              newUser._id,
              stepId
            );
            
            message = `User ${payload.userName} created.`;
        }

        if (action === 'CREATE_IAM_ROLE') {
            const newRole = new SimulatedResource({
               userId,
               labId: labId || null,
               resourceType: 'IAM_ROLE',
               state: {
                   roleName: payload.roleName,
                   description: payload.description || '',
                   trustedEntity: payload.trustedEntity || 'ec2.amazonaws.com',
                   attachedPolicies: payload.policies || [],
                   created: new Date().toISOString()
               },
               status: 'active'
           });
           await newRole.save();
           message = `Role ${payload.roleName} created.`;
       }

       if (action === 'CREATE_IAM_POLICY') {
           const newPolicy = new SimulatedResource({
               userId,
               labId: labId || null,
               resourceType: 'IAM_POLICY',
               state: {
                   policyName: payload.policyName,
                   document: payload.document || {}, // JSON string or object
                   created: new Date().toISOString()
               },
               status: 'active'
           });
           await newPolicy.save();
           message = `Policy ${payload.policyName} created.`;
       }

       if (action === 'CREATE_IAM_GROUP') {
            const newGroup = new SimulatedResource({
                userId,
                labId: labId || null,
                resourceType: 'IAM_GROUP',
                state: {
                    groupName: payload.groupName,
                    description: payload.description || '',
                    attachedPolicies: [],
                    created: new Date().toISOString()
                },
                status: 'active'
            });
             await newGroup.save();
             message = `Group ${payload.groupName} created.`;
        }

        if (action === 'DELETE_IAM_USER') {
             await SimulatedResource.findOneAndDelete({ 
                 userId, 
                 resourceType: 'IAM_USER', 
                 'state.userName': payload.userName 
             });
             message = `User ${payload.userName} deleted.`;
        }

        if (action === 'DELETE_IAM_ROLE') {
             await SimulatedResource.findOneAndDelete({ 
                 userId, 
                 resourceType: 'IAM_ROLE', 
                 'state.roleName': payload.roleName 
             });
             message = `Role ${payload.roleName} deleted.`;
        }

        if (action === 'DELETE_IAM_GROUP') {
             await SimulatedResource.findOneAndDelete({ 
                 userId, 
                 resourceType: 'IAM_GROUP', 
                 'state.groupName': payload.groupName 
             });
             message = `Group ${payload.groupName} deleted.`;
        }

        if (action === 'DELETE_IAM_POLICY') {
             await SimulatedResource.findOneAndDelete({ 
                 userId, 
                 resourceType: 'IAM_POLICY', 
                 'state.policyName': payload.policyName 
             });
             message = `Policy ${payload.policyName} deleted.`;
        }

        // --- NETWORKING HANDLERS (VPC, Subnet, SG) ---
        if (action === 'CREATE_VPC') {
            const newVpc = new SimulatedResource({
                userId,
                labId: labId || null,
                resourceType: 'VPC',
                state: {
                    vpcId: `vpc-${Math.random().toString(36).substr(2, 9)}`,
                    name: payload.name || 'MyVPC',
                    cidrBlock: payload.cidrBlock || '10.0.0.0/16',
                    status: 'available'
                },
                status: 'active'
            });
            await newVpc.save();
            message = `VPC ${payload.name} created.`;
        }
        
        if (action === 'DELETE_VPC') {
            await SimulatedResource.findByIdAndDelete(payload.resourceId);
            message = 'VPC deleted.';
        }

        if (action === 'CREATE_SUBNET') {
            const newSubnet = new SimulatedResource({
                userId,
                labId: labId || null,
                resourceType: 'SUBNET',
                state: {
                    subnetId: `subnet-${Math.random().toString(36).substr(2, 9)}`,
                    vpcId: payload.vpcId,
                    name: payload.name || 'MySubnet',
                    cidrBlock: payload.cidrBlock || '10.0.1.0/24',
                    availabilityZone: payload.az || 'us-east-1a'
                },
                status: 'active'
            });
            await newSubnet.save();
            message = `Subnet ${payload.name} created.`;
        }

         if (action === 'DELETE_SUBNET') {
            await SimulatedResource.findByIdAndDelete(payload.resourceId);
             message = 'Subnet deleted.';
        }

        if (action === 'CREATE_SECURITY_GROUP') {
            const newSg = new SimulatedResource({
                userId,
                labId: labId || null,
                resourceType: 'SECURITY_GROUP',
                state: {
                    groupId: `sg-${Math.random().toString(36).substr(2, 9)}`,
                    groupName: payload.groupName,
                    description: payload.description,
                    vpcId: payload.vpcId,
                    inboundRules: payload.inboundRules || [
                        { type: 'SSH', protocol: 'TCP', portRange: '22', source: '0.0.0.0/0' } // Default rule
                    ]
                },
                status: 'active'
            });
            await newSg.save();
             message = `Security Group ${payload.groupName} created.`;
        }

        if (action === 'DELETE_SECURITY_GROUP') {
             await SimulatedResource.findByIdAndDelete(payload.resourceId);
             message = 'Security Group deleted.';
        }

        if (action === 'UPDATE_SECURITY_GROUP_RULES') {
            const sg = await SimulatedResource.findById(payload.resourceId);
            if (sg) {
                sg.state.inboundRules = payload.inboundRules;
                sg.markModified('state');
                await sg.save();
                message = 'Security Group rules updated.';
            }
        }

        // --- EBS HANDLERS ---
        if (action === 'CREATE_VOLUME') {
             const newVol = new SimulatedResource({
                 userId,
                 labId: labId || null,
                 resourceType: 'EBS_VOLUME',
                 state: {
                     volumeId: `vol-${Math.random().toString(36).substr(2, 10)}`,
                     size: payload.size, // e.g. '8'
                     type: payload.type || 'gp2',
                     az: payload.az || 'us-east-1a',
                     status: 'available',
                     created: new Date().toISOString(),
                     attachment: null 
                 },
                 status: 'active'
             });
             await newVol.save();
             message = 'EBS Volume created.';
        }

        if (action === 'ATTACH_VOLUME') {
             // payload: { volumeId, instanceId, device }
             const vol = await SimulatedResource.findOne({ 
                 userId, 
                 resourceType: 'EBS_VOLUME', 
                 'state.volumeId': payload.volumeId
             });
             
             if (vol) {
                 vol.state.status = 'in-use';
                 vol.state.attachment = {
                     instanceId: payload.instanceId,
                     device: payload.device || '/dev/sdf',
                     attachTime: new Date().toISOString(),
                     state: 'attached'
                 };
                 vol.markModified('state');
                 await vol.save();
                 message = `Volume ${payload.volumeId} attached to ${payload.instanceId}`;
             } else {
                 success = false;
                 message = 'Volume not found.';
             }
        }

        // --- PROGRESS TRACKING ---
        if (stepId) {
            let progress = await UserProgress.findOne({ userId, labId });
            if (!progress) {
                progress = new UserProgress({ userId, labId, completedSteps: [], currentStep: stepId });
            }
            if (!progress.completedSteps.includes(stepId)) {
                progress.completedSteps.push(stepId);
                await progress.save();
            }
        }
    }

    const response = { success, message };
    console.log('📤 [Backend] Sending response:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ [Backend] validateAction error:', {
      error: error.message,
      stack: error.stack,
      userId,
      labId,
      stepId,
      action
    });
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// --- SUBMISSION LOGIC ---

exports.submitLab = async (req, res) => {
  const { userId, labId } = req.body;
  
  try {
      // 1. Calculate Score
      const lab = await Lab.findOne({ labId });
      if (!lab) return res.status(404).json({ message: 'Lab not found' });
      
      const progress = await UserProgress.findOne({ userId, labId });
      const completedCount = progress ? progress.completedSteps.length : 0;
      const totalSteps = lab.steps.length;
      const score = Math.round((completedCount / totalSteps) * 100);

      // 2. Generate Feedback using Gemini AI (if available) or fallback
      let feedback = {
          strengths: [],
          improvements: []
      };

      // Try to get feedback from Gemini AI
      const completedSteps = progress?.completedSteps || [];
      const geminiResult = await geminiService.generateFeedback(lab, progress, completedSteps);
      
      if (geminiResult) {
          // Use Gemini AI feedback (only one feedback object)
          feedback = geminiResult;
          console.log('✅ Generated feedback using Gemini AI');
      } else {
          // Fallback to rule-based feedback
          console.log('⚠️ Using fallback feedback (Gemini AI not available)');
          
          if (score === 100) {
              feedback.strengths.push('Excellent execution! You completed all steps perfectly.');
              feedback.strengths.push('Demonstrated strong understanding of the core concepts.');
          } else if (score > 50) {
              feedback.strengths.push('Good progress! You successfully navigated the core workflow.');
              feedback.improvements.push('Review the final verification steps to ensure resources are correctly deployed.');
          } else {
              feedback.improvements.push('It seems you got stuck early on. Try reviewing the lab scenario again.');
              feedback.improvements.push('Focus on understanding the service prerequisites first.');
          }

          // Add specific feedback based on lab type (Example for EC2)
          if (labId === 'lab-ec2-launch') {
              if (progress?.completedSteps.includes('ec2-select-name')) {
                  feedback.strengths.push('Correctly identified and named the instance.');
              }
              if (!progress?.completedSteps.includes('ec2-select-type')) {
                  feedback.improvements.push('Understanding Instance Types (t2.micro vs others) is crucial for cost management.');
              }
              if (!progress?.completedSteps.includes('ec2-review-launch')) {
                 feedback.improvements.push('Don\'t forget to actually launch the instance after configuration!');
              }
          }
      }

      // 3. YouTube Search based on Suggested Improvements (always fetch 1-2 videos)
      let youtubeResults = [];
      
      if (feedback.improvements && feedback.improvements.length > 0) {
          try {
              // Fetch videos based on improvements (minimum 1-2 videos)
              console.log(`🔍 Searching YouTube for videos based on ${feedback.improvements.length} improvements...`);
              youtubeResults = await youtubeService.searchVideos(feedback.improvements);
              console.log(`✅ Found ${youtubeResults.length} YouTube videos based on improvements`);
          } catch (error) {
              console.error('❌ YouTube API error:', error.message);
              console.error('Error details:', error);
          }
      } else {
          console.log('⚠️ No improvements found, skipping YouTube search');
      }
      
      // Fallback: If no videos found but we have improvements, add at least one fallback video
      if (youtubeResults.length === 0 && feedback.improvements && feedback.improvements.length > 0) {
          console.log('⚠️ No YouTube videos found, using fallback video');
          // Extract key term from first improvement for fallback
          const firstImprovement = feedback.improvements[0];
          const searchTerm = firstImprovement.toLowerCase().includes('ec2') ? 'EC2' : 
                           firstImprovement.toLowerCase().includes('s3') ? 'S3' :
                           firstImprovement.toLowerCase().includes('iam') ? 'IAM' : 'AWS';
          
          youtubeResults.push({
              videoId: '_jEGlMbeV4Q',
              title: `Recommended: AWS ${searchTerm} Tutorial`,
              thumbnail: 'https://img.youtube.com/vi/_jEGlMbeV4Q/mqdefault.jpg',
              channelTitle: 'AWS Tutorials',
              url: 'https://www.youtube.com/watch?v=_jEGlMbeV4Q',
              description: `Learn AWS ${searchTerm} fundamentals`,
              duration: '10:24',
              relatedTo: firstImprovement
          });
      }

      // 4. Save Submission (only one feedback object, no duplicate)
      const submission = new LabSubmission({
          userId,
          labId,
          score,
          feedback, // Single feedback object (from Gemini or fallback)
          youtubeResults
      });
      await submission.save();
      
      console.log(`💾 Saved submission to database with ${youtubeResults.length} videos`);

      res.json({
          success: true,
          submission
      });

  } catch (error) {
      console.error('Submission Error:', error);
      res.status(500).json({ message: error.message });
  }
};

// Get submission by ID
exports.getSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await LabSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.json({
      success: true,
      submission
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user's submission for a lab
exports.getUserSubmission = async (req, res) => {
  try {
    const { userId, labId } = req.query;
    
    if (!userId || !labId) {
      return res.status(400).json({ message: 'userId and labId are required' });
    }
    
    const submission = await LabSubmission.findOne({ userId, labId })
      .sort({ submittedAt: -1 }); // Get most recent
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.json({
      success: true,
      submission
    });
  } catch (error) {
    console.error('Get user submission error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user's progress and resources for all labs or a specific lab
exports.getUserProgress = async (req, res) => {
  try {
    const { userId, labId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    
    // Build query for progress
    const progressQuery = { userId };
    if (labId) {
      progressQuery.labId = labId;
    }
    
    // Get all user progress
    const progressList = await UserProgress.find(progressQuery)
      .sort({ lastUpdated: -1 });
    
    // Get all user resources
    const resources = await SimulatedResource.find({ userId });
    
    // Get all submissions
    const submissionQuery = { userId };
    if (labId) {
      submissionQuery.labId = labId;
    }
    const submissions = await LabSubmission.find(submissionQuery)
      .sort({ submittedAt: -1 });
    
    // Organize progress by labId
    const progressByLab = {};
    progressList.forEach(progress => {
      if (!progressByLab[progress.labId]) {
        progressByLab[progress.labId] = {
          labId: progress.labId,
          completedSteps: [],
          currentStep: null,
          status: 'in-progress',
          lastUpdated: progress.lastUpdated
        };
      }
      progressByLab[progress.labId].completedSteps = progress.completedSteps;
      progressByLab[progress.labId].currentStep = progress.currentStep;
      progressByLab[progress.labId].status = progress.status;
      if (progress.lastUpdated > progressByLab[progress.labId].lastUpdated) {
        progressByLab[progress.labId].lastUpdated = progress.lastUpdated;
      }
    });
    
    // Organize resources by type
    const resourcesByType = {};
    resources.forEach(resource => {
      if (!resourcesByType[resource.resourceType]) {
        resourcesByType[resource.resourceType] = [];
      }
      resourcesByType[resource.resourceType].push(resource);
    });
    
    res.json({
      success: true,
      progress: labId ? progressByLab[labId] || null : progressByLab,
      resources: resourcesByType,
      resourcesCount: resources.length,
      submissions: submissions.map(sub => ({
        labId: sub.labId,
        score: sub.score,
        submittedAt: sub.submittedAt
      }))
    });
  } catch (error) {
    console.error('Get user progress error:', error);
    res.status(500).json({ message: error.message });
  }
};