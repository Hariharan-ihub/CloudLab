const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Lab = require('../models/Lab');
const Step = require('../models/Step');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aws-learning-lab';

// Comprehensive lab data with steps and initial states
const labsData = [
  {
    labId: 'lab-ec2-launch',
    title: 'Launch Your First EC2 Instance',
    description: 'You are a junior cloud engineer. Your team needs a temporary web server for a marketing campaign. Your task is to launch an Amazon Linux 2 instance in the us-east-1 region. Ensure it has a security group allowing HTTP traffic.',
    difficulty: 'Beginner',
    service: 'EC2',
    estimatedTime: '15 min',
    initialState: {
      vpc: [{
        vpcId: 'vpc-0123456789abcdef0',
        name: 'Default VPC',
        cidrBlock: '172.31.0.0/16',
        status: 'available'
      }],
      subnet: [{
        subnetId: 'subnet-0123456789abcdef0',
        vpcId: 'vpc-0123456789abcdef0',
        name: 'us-east-1a',
        cidrBlock: '172.31.16.0/20',
        availabilityZone: 'us-east-1a'
      }],
      securityGroup: [{
        groupId: 'sg-0123456789abcdef0',
        groupName: 'default',
        description: 'default VPC security group',
        vpcId: 'vpc-0123456789abcdef0',
        inboundRules: [
          { type: 'SSH', protocol: 'TCP', portRange: '22', source: '0.0.0.0/0' }
        ]
      }]
    },
    steps: [
      {
        stepId: 'ec2-dashboard',
        title: 'Open EC2 Dashboard',
        instruction: 'Navigate to the EC2 service by clicking on the EC2 service card or using the search.',
        expectedAction: 'NAVIGATE',
        order: 1,
        uiComponent: 'service-ec2-card',
        validationLogic: { type: 'URL_CONTAINS', value: '/service/ec2' }
      },
      {
        stepId: 'ec2-launch-btn',
        title: 'Start Launch Wizard',
        instruction: 'Click the orange "Launch Instance" button to start creating a new virtual machine.',
        expectedAction: 'CLICK_BUTTON',
        order: 2,
        uiComponent: 'btn-launch-instance',
        validationLogic: { type: 'CLICK_BUTTON', value: 'Launch Instance' }
      },
      {
        stepId: 'ec2-select-name',
        title: 'Name Your Instance',
        instruction: 'Enter a name for your instance (e.g., "Marketing-Server") in the Name and tags section.',
        expectedAction: 'INPUT_VALUE',
        order: 3,
        validationLogic: { type: 'INPUT_VALUE', field: 'name', value: 'Marketing-Server' }
      },
      {
        stepId: 'ec2-select-ami',
        title: 'Choose an Amazon Machine Image (AMI)',
        instruction: 'Select an OS Image (Amazon Linux, Ubuntu, etc.) from the list.',
        expectedAction: 'SELECT_AMI',
        order: 4,
        validationLogic: { type: 'SELECT_OPTION', field: 'ami', value: 'ami-al2023' }
      },
      {
        stepId: 'ec2-select-type',
        title: 'Choose Instance Type',
        instruction: 'Select "t2.micro" (Free tier eligible) as the instance type.',
        expectedAction: 'SELECT_INSTANCE_TYPE',
        order: 5,
        validationLogic: { type: 'SELECT_OPTION', field: 'instanceType', value: 't2.micro' }
      },
      {
        stepId: 'ec2-review-launch',
        title: 'Launch Instance',
        instruction: 'Review your configuration and click "Launch Instance" in the summary panel.',
        expectedAction: 'CLICK_FINAL_LAUNCH',
        order: 6,
        validationLogic: { type: 'RESOURCE_CREATED', resourceType: 'EC2_INSTANCE' }
      }
    ]
  },
  {
    labId: 'lab-s3-website',
    title: 'Host a Static Website on S3',
    description: 'The creative team has designed a new landing page. Your goal is to host this static content cost-effectively. Create a public S3 bucket and configure it for static website hosting.',
    difficulty: 'Intermediate',
    service: 'S3',
    estimatedTime: '20 min',
    initialState: {
      s3: [{
        bucketName: 'company-branding-assets',
        region: 'us-east-1',
        objects: [
          { key: 'logo.png', size: '15 KB', lastModified: new Date().toISOString() },
          { key: 'index.html', size: '2 KB', lastModified: new Date().toISOString() }
        ],
        versioning: 'Suspended'
      }]
    },
    steps: [
      {
        stepId: 's3-dashboard',
        title: 'Navigate to S3',
        instruction: 'Go to the S3 Service Console.',
        expectedAction: 'NAVIGATE',
        order: 1,
        validationLogic: { type: 'URL_CONTAINS', value: '/service/s3' }
      },
      {
        stepId: 's3-create-bucket',
        title: 'Create Bucket',
        instruction: 'Create a new bucket named "corporate-landing-page-[random-number]". Bucket names must be globally unique.',
        expectedAction: 'CREATE_BUCKET',
        order: 2,
        validationLogic: { type: 'RESOURCE_CREATED', resourceType: 'S3_BUCKET' }
      },
      {
        stepId: 's3-upload-content',
        title: 'Upload Content',
        instruction: 'Upload the provided "index.html" file to your new bucket.',
        expectedAction: 'UPLOAD_OBJECT',
        order: 3,
        validationLogic: { type: 'FILE_UPLOAD', fileName: 'index.html' }
      },
      {
        stepId: 's3-enable-hosting',
        title: 'Enable Web Hosting',
        instruction: 'Go to the "Properties" tab of your bucket and enable "Static website hosting".',
        expectedAction: 'GENERIC',
        order: 4,
        validationLogic: { type: 'CONFIG_CHANGE', setting: 'static_website_hosting', value: true }
      }
    ]
  },
  {
    labId: 'lab-iam-user',
    title: 'Secure Access with IAM Users',
    description: 'We hired a new data analyst, "Sarah". She needs read-only access to S3 buckets but should not be able to delete any data or modify EC2 instances.',
    difficulty: 'Beginner',
    service: 'IAM',
    estimatedTime: '10 min',
    initialState: {
      iamGroup: [{
        groupName: 'Developers',
        description: 'Main development team with EC2 access',
        attachedPolicies: ['arn:aws:iam::aws:policy/AmazonEC2FullAccess'],
        created: new Date().toISOString()
      }],
      iamPolicies: [{
        policyName: 'S3-Read-Only',
        document: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{ Effect: 'Allow', Action: ['s3:Get*', 's3:List*'], Resource: '*' }]
        }),
        created: new Date().toISOString()
      }]
    },
    steps: [
      {
        stepId: 'iam-dashboard',
        title: 'Open IAM Dashboard',
        instruction: 'Navigate to the Identity and Access Management (IAM) console.',
        expectedAction: 'NAVIGATE',
        order: 1,
        validationLogic: { type: 'URL_CONTAINS', value: '/service/iam' }
      },
      {
        stepId: 'iam-create-user',
        title: 'Create User',
        instruction: 'Add a new user with the username "sarah-analyst". Check "Programmatic access".',
        expectedAction: 'CREATE_IAM_USER',
        order: 2,
        validationLogic: { type: 'RESOURCE_CREATED', resourceType: 'IAM_USER', username: 'sarah-analyst' }
      },
      {
        stepId: 'iam-attach-permissions',
        title: 'Attach Permissions',
        instruction: 'Attach the "AmazonS3ReadOnlyAccess" managed policy to Sarah\'s account directly.',
        expectedAction: 'GENERIC',
        order: 3,
        validationLogic: { type: 'POLICY_ATTACHED', policy: 'AmazonS3ReadOnlyAccess' }
      }
    ]
  },
  {
    labId: 'lab-vpc-secure',
    title: 'Build a Secure VPC Network',
    description: 'Our audit revealed legacy resources in the default VPC. You need to create a custom VPC called "Production-VPC" with a private subnet for our database layer to ensure isolation.',
    difficulty: 'Advanced',
    service: 'VPC',
    estimatedTime: '30 min',
    initialState: {
      vpc: [{
        vpcId: 'vpc-legacy-def',
        name: 'Default VPC',
        cidrBlock: '172.31.0.0/16',
        status: 'available'
      }],
      subnet: [{
        subnetId: 'subnet-legacy-1',
        vpcId: 'vpc-legacy-def',
        name: 'us-east-1a-def',
        cidrBlock: '172.31.0.0/24',
        availabilityZone: 'us-east-1a'
      }]
    },
    steps: [
      {
        stepId: 'vpc-dashboard',
        title: 'Access VPC Console',
        instruction: 'Navigate to the VPC Dashboard.',
        expectedAction: 'NAVIGATE',
        order: 1,
        validationLogic: { type: 'URL_CONTAINS', value: '/service/vpc' }
      },
      {
        stepId: 'vpc-create',
        title: 'Create VPC',
        instruction: 'Create a VPC with IPv4 CIDR block "10.0.0.0/16" and tag it Name="Production-VPC".',
        expectedAction: 'CREATE_VPC',
        order: 2,
        validationLogic: { type: 'RESOURCE_CREATED', resourceType: 'VPC', cidr: '10.0.0.0/16' }
      },
      {
        stepId: 'vpc-create-subnet',
        title: 'Create Private Subnet',
        instruction: 'Create a subnet within your new VPC. Name it "Database-Subnet" with CIDR "10.0.1.0/24".',
        expectedAction: 'CREATE_SUBNET',
        order: 3,
        validationLogic: { type: 'RESOURCE_CREATED', resourceType: 'SUBNET', cidr: '10.0.1.0/24' }
      },
      {
        stepId: 'vpc-create-sg',
        title: 'Configure Security Group',
        instruction: 'Create a Security Group named "DB-Access" that allows traffic only on port 3306 (MySQL) from within the VPC.',
        expectedAction: 'CREATE_SECURITY_GROUP',
        order: 4,
        validationLogic: { type: 'RESOURCE_CREATED', resourceType: 'SECURITY_GROUP', port: 3306 }
      }
    ]
  }
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await Lab.deleteMany({});
    await Step.deleteMany({});
    console.log('✅ Existing data cleared');

    // Seed labs and steps
    console.log('\n📦 Seeding labs and steps...');
    
    for (const labData of labsData) {
      const stepIds = [];
      
      // Create Steps first (using labId string, not MongoDB _id)
      for (const stepData of labData.steps) {
        const step = new Step({
          ...stepData,
          labId: labData.labId // Use labId string, not MongoDB _id
        });
        const savedStep = await step.save();
        stepIds.push(savedStep._id);
        console.log(`  ✓ Created step: ${stepData.stepId} - ${stepData.title}`);
      }

      // Create Lab with steps references
      const lab = new Lab({
        labId: labData.labId,
        title: labData.title,
        description: labData.description,
        difficulty: labData.difficulty,
        service: labData.service,
        estimatedTime: labData.estimatedTime,
        initialState: labData.initialState,
        steps: stepIds
      });
      
      await lab.save();
      console.log(`✅ Created lab: ${labData.title} (${labData.steps.length} steps)`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Labs created: ${labsData.length}`);
    console.log(`   - Total steps: ${labsData.reduce((sum, lab) => sum + lab.steps.length, 0)}`);
    console.log(`\n✨ You can now start the application and use the labs!`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding
seedDatabase();

