const mongoose = require('mongoose');
const Lab = require('./models/Lab');
const Step = require('./models/Step');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect('mongodb://localhost:27017/aws-learning-lab')
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => console.error(err));

const seedData = async () => {
  try {
    await Lab.deleteMany({});
    await Step.deleteMany({});

    console.log('Cleared existing data.');

    // 1. EC2 Lab
    const labEc2 = new Lab({
      labId: 'lab-ec2-launch',
      title: 'Launch Your First EC2 Instance',
      description: 'Learn how to configure and launch a t2.micro virtual server using the Amazon EC2 console.',
      difficulty: 'Beginner',
      service: 'EC2',
      estimatedTime: '15 min',
      steps: [] 
    });
    const savedEc2 = await labEc2.save();

    // 2. S3 Lab
    const labS3 = new Lab({
      labId: 'lab-s3-website',
      title: 'Host a Static Website on S3',
      description: 'Create a storage bucket, upload an HTML file, and configure it for public web hosting.',
      difficulty: 'Intermediate',
      service: 'S3',
      estimatedTime: '20 min',
      steps: []
    });
    await labS3.save();

    // 3. IAM Lab
    const labIam = new Lab({
      labId: 'lab-iam-user',
      title: 'Secure Access with IAM Users',
      description: 'Create a new IAM user with specific permissions and assign them to a development group.',
      difficulty: 'Advanced',
      service: 'IAM',
      estimatedTime: '10 min',
      steps: []
    });
    await labIam.save();

    // Re-create EC2 steps linked to the new EC2 lab (using same logic as before, just updated ID)
    const stepsData = [
      {
        stepId: 'ec2-dashboard',
        labId: savedEc2._id, // Use the new MongoDB _id
        title: 'Open EC2 Dashboard',
        instruction: 'Navigate to the EC2 service by clicking on the EC2 service card or using the search.',
        expectedAction: 'NAVIGATE_TO_EC2',
        order: 1,
        uiComponent: 'service-ec2-card'
      },
      {
        stepId: 'ec2-launch-btn',
        labId: savedEc2._id,
        title: 'Start Launch Wizard',
        instruction: 'Click the orange "Launch Instance" button to start creating a new virtual machine.',
        expectedAction: 'CLICK_LAUNCH_INSTANCE',
        order: 2,
        uiComponent: 'btn-launch-instance'
      },
      {
        stepId: 'ec2-select-name',
        labId: savedEc2._id,
        title: 'Name Your Instance',
        instruction: 'Enter a name for your instance (e.g., "MyWebServer") in the Name and tags section.',
        expectedAction: 'INPUT_INSTANCE_NAME',
        order: 3,
        validationLogic: { required: true, minLength: 3 }
      },
      {
        stepId: 'ec2-select-ami',
        labId: savedEc2._id,
        title: 'Choose an Amazon Machine Image (AMI)',
        instruction: 'Select an OS Image (Amazon Linux, Ubuntu, etc.) from the list.',
        expectedAction: 'SELECT_AMI',
        order: 4,
        validationLogic: { required: true }
      },
      {
        stepId: 'ec2-select-type',
        labId: savedEc2._id,
        title: 'Choose Instance Type',
        instruction: 'Select "t2.micro" (Free tier eligible) as the instance type.',
        expectedAction: 'SELECT_INSTANCE_TYPE',
        order: 5,
        validationLogic: { allowedValues: ['t2.micro'] }
      },
      {
        stepId: 'ec2-review-launch',
        labId: savedEc2._id,
        title: 'Launch Instance',
        instruction: 'Review your configuration and click "Launch Instance" in the summary panel.',
        expectedAction: 'CLICK_FINAL_LAUNCH',
        order: 6
      }
    ];

    const createdSteps = await Step.insertMany(stepsData);
    
    // Update EC2 lab with steps
    savedEc2.steps = createdSteps.map(s => s._id);
    await savedEc2.save();

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
