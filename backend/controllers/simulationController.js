const SimulatedResource = require('../models/SimulatedResource');
const UserProgress = require('../models/UserProgress');
const Step = require('../models/Step');
const Lab = require('../models/Lab');

// Initialize Lab Environment
exports.startLab = async (req, res) => {
  const { userId, labId } = req.body;
  try {
    const lab = await Lab.findOne({ labId });
    if (!lab) return res.status(404).json({ message: 'Lab not found' });

    // Reset Environment
    await SimulatedResource.deleteMany({ userId });
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
  const { userId, type } = req.query;
  try {
    const resources = await SimulatedResource.find({ userId, resourceType: type });
    
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

  try {
    // 1. Validate Step (if associated with a Lab Step)
    let success = true;
    let message = 'Action completed.';
    
    if (stepId) {
        const step = await Step.findOne({ stepId: stepId, labId: labId });
        if (step) {
             // 1a. Validate Sequence (New)
             if (step.order > 1) {
                 const progress = await UserProgress.findOne({ userId, labId });
                 // Find explicit previous step by order
                 const prevStep = await Step.findOne({ labId: step.labId, order: step.order - 1 });
                 
                 // If there is a previous step, and user has NO progress OR prev step is NOT in completedSteps
                 if (prevStep && (!progress || !progress.completedSteps.includes(prevStep.stepId))) {
                     return res.json({ success: false, message: `Please complete step ${step.order - 1}: ${prevStep.title} first.` });
                 }
             }

             if (step.expectedAction !== 'GENERIC' && step.expectedAction !== action) {
                 success = false;
                 message = `Incorrect action. Expected ${step.expectedAction}`;
             }
             // Add payload validation logic here if needed details
        }
    }

    // 2. Perform Side Effects (Simulate Cloud State) if validation passed (or if no step validation required)
    if (success) {
        // --- EC2 HANDLERS ---
        if (action === 'CLICK_FINAL_LAUNCH') {
            const newInstance = new SimulatedResource({
                userId,
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
            });
            await newInstance.save();
            message = 'Instance launched successfully!';
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
                resourceType: 'S3_BUCKET',
                state: {
                    bucketName: payload.bucketName,
                    region: 'us-east-1',
                    objects: [] // Array of objects basic
                },
                status: 'active'
            });
            await newBucket.save();
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
            message = `User ${payload.userName} created.`;
        }

        if (action === 'CREATE_IAM_ROLE') {
            const newRole = new SimulatedResource({
               userId,
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

    res.json({ success, message });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- SUBMISSION LOGIC ---
const LabSubmission = require('../models/LabSubmission');
const axios = require('axios');

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

      // 2. Generate Feedback (Simulated AI)
      // Logic: Analyze which steps are missing or done
      const feedback = {
          strengths: [],
          improvements: []
      };

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

      // 3. YouTube Search (Real API)
      let youtubeResults = [];
      const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // Expects this in .env
      
      if (YOUTUBE_API_KEY && feedback.improvements.length > 0) {
          // Construct query from improvements
          const queryTerm = feedback.improvements[0].replace('Review', '').replace('Understanding', '').trim() + ' AWS tutorial';
          const query = encodeURIComponent(queryTerm);
          
          try {
              const ytResponse = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${query}&key=${YOUTUBE_API_KEY}&type=video`);
              
              if (ytResponse.data.items) {
                  youtubeResults = ytResponse.data.items.map(item => ({
                      videoId: item.id.videoId,
                      title: item.snippet.title,
                      thumbnail: item.snippet.thumbnails.medium.url,
                      channelTitle: item.snippet.channelTitle,
                      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
                  }));
              }
          } catch (ytError) {
              console.warn(`YouTube API Warning: ${ytError.message} - Using fallback video.`);
              // Fallback to default video so the user still sees the feature working
              youtubeResults.push({
                  videoId: '_jEGlMbeV4Q', 
                  title: 'Recommended: AWS EC2 Masterclass (Fallback)',
                  thumbnail: 'https://img.youtube.com/vi/_jEGlMbeV4Q/mqdefault.jpg',
                  channelTitle: 'Recommended Channel',
                  url: 'https://www.youtube.com/watch?v=_jEGlMbeV4Q'
              });
          }
      } else {
          // Fallback if no key or perfect score
          if(score < 100) {
             youtubeResults.push({
                 videoId: '_jEGlMbeV4Q', // Valid video ID
                 title: 'Recommended: AWS EC2 Masterclass',
                 thumbnail: 'https://img.youtube.com/vi/_jEGlMbeV4Q/mqdefault.jpg',
                 channelTitle: 'Recommended Channel',
                 url: 'https://www.youtube.com/watch?v=_jEGlMbeV4Q'
             });
          }
      }

      // 4. Save Submission
      const submission = new LabSubmission({
          userId,
          labId,
          score,
          feedback,
          youtubeResults
      });
      await submission.save();

      res.json({
          success: true,
          submission
      });

  } catch (error) {
      console.error('Submission Error:', error);
      res.status(500).json({ message: error.message });
  }
};
