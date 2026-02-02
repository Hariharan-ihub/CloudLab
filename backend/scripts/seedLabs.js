const mongoose = require('mongoose');
console.log('Requiring models...');
const Lab = require('../models/Lab');
const Step = require('../models/Step');
// require('dotenv').config(); 

console.log('Connecting to MongoDB...');
// Matches server.js DB name
const MONGO_URI = 'mongodb://localhost:27017/aws-learning-lab';

const labsData = [
    {
        labId: 'lab-ec2-launch',
        title: 'Launch Your First EC2 Instance',
        description: 'You are a junior cloud engineer. Your team needs a temporary web server for a marketing campaign. Your task is to launch an Amazon Linux 2 instance in the us-east-1 region. Ensure it has a security group allowing HTTP traffic.',
        difficulty: 'Beginner',
        service: 'EC2',
        estimatedTime: '15',
        initialState: {
            vpc: [
                { vpcId: 'vpc-0123456789abcdef0', name: 'Default VPC', cidr: '172.31.0.0/16', isDefault: true }
            ],
            subnet: [
                { subnetId: 'subnet-0123456789abcdef0', vpcId: 'vpc-0123456789abcdef0', name: 'us-east-1a', cidr: '172.31.16.0/20', availabilityZone: 'us-east-1a' }
            ],
            securityGroup: [
                { groupId: 'sg-0123456789abcdef0', vpcId: 'vpc-0123456789abcdef0', groupName: 'default', description: 'default VPC security group' }
            ]
        },
        steps: [
            {
                stepId: 'step-ec2-1',
                title: 'Open EC2 Dashboard',
                instruction: 'Navigate to the EC2 service using the Service Menu or Search bar.',
                validationLogic: { type: 'URL_CONTAINS', value: '/service/ec2' }
            },
            {
                stepId: 'step-ec2-2',
                title: 'Launch Instance Wizard',
                instruction: 'Click the "Launch Instance" button to begin the creation process.',
                validationLogic: { type: 'CLICK_BUTTON', value: 'Launch Instance' }
            },
            {
                stepId: 'step-ec2-3',
                title: 'Configure Name & OS',
                instruction: 'Name the instance "Marketing-Server" and select "Amazon Linux 2" as the Annual Machine Image (AMI).',
                validationLogic: { type: 'INPUT_VALUE', field: 'name', value: 'Marketing-Server' }
            },
            {
                stepId: 'step-ec2-4',
                title: 'Instance Type',
                instruction: 'Select "t2.micro" (Free Tier Eligible) as the instance type to minimize costs.',
                validationLogic: { type: 'SELECT_OPTION', field: 'instanceType', value: 't2.micro' }
            },
            {
                stepId: 'step-ec2-5',
                title: 'Launch',
                instruction: 'Review your settings and click "Launch Instance" to provision the resource.',
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
        estimatedTime: '20',
        steps: [
            {
                stepId: 'step-s3-1',
                title: 'Navigate to S3',
                instruction: 'Go to the S3 Service Console.',
                validationLogic: { type: 'URL_CONTAINS', value: '/service/s3' }
            },
            {
                stepId: 'step-s3-2',
                title: 'Create Bucket',
                instruction: 'Create a new bucket named "corporate-landing-page-[random-number]". Bucket names must be globally unique.',
                validationLogic: { type: 'RESOURCE_CREATED', resourceType: 'S3_BUCKET' }
            },
            {
                stepId: 'step-s3-3',
                title: 'Upload Content',
                instruction: 'Upload the provided "index.html" file to your new bucket.',
                validationLogic: { type: 'FILE_UPLOAD', fileName: 'index.html' }
            },
            {
                stepId: 'step-s3-4',
                title: 'Enable Web Hosting',
                instruction: 'Go to the "Properties" tab of your bucket and enable "Static website hosting".',
                validationLogic: { type: 'CONFIG_CHANGE', setting: 'static_website_hosting', value: true }
            }
        ]
    },
    {
        labId: 'lab-vpc-secure',
        title: 'Build a Secure VPC Network',
        description: 'Our audit revealed legacy resources in the default VPC. You need to create a custom VPC called "Production-VPC" with a private subnet for our database layer to ensure isolation.',
        difficulty: 'Advanced',
        service: 'VPC',
        estimatedTime: '30',
        initialState: {
            vpc: [
                { vpcId: 'vpc-legacy-def', name: 'Default VPC', cidr: '172.31.0.0/16', isDefault: true }
            ],
            subnet: [
                { subnetId: 'subnet-legacy-1', vpcId: 'vpc-legacy-def', name: 'us-east-1a-def', cidr: '172.31.0.0/24', availabilityZone: 'us-east-1a' }
            ]
        },
        steps: [
            {
                stepId: 'step-vpc-1',
                title: 'Access VPC Console',
                instruction: 'Navigate to the VPC Dashboard.',
                validationLogic: { type: 'URL_CONTAINS', value: '/service/vpc' }
            },
            {
                stepId: 'step-vpc-2',
                title: 'Create VPC',
                instruction: 'Create a VPC with IPv4 CIDR block "10.0.0.0/16" and tag it Name="Production-VPC".',
                validationLogic: { type: 'RESOURCE_CREATED', resourceType: 'VPC', cidr: '10.0.0.0/16' }
            },
            {
                stepId: 'step-vpc-3',
                title: 'Create Private Subnet',
                instruction: 'Create a subnet within your new VPC. Name it "Database-Subnet" with CIDR "10.0.1.0/24".',
                validationLogic: { type: 'RESOURCE_CREATED', resourceType: 'SUBNET', cidr: '10.0.1.0/24' }
            },
            {
                stepId: 'step-vpc-4',
                title: 'Configure Security Group',
                instruction: 'Create a Security Group named "DB-Access" that allows traffic only on port 3306 (MySQL) from within the VPC.',
                validationLogic: { type: 'RESOURCE_CREATED', resourceType: 'SECURITY_GROUP', port: 3306 }
            }
        ]
    },
    {
        labId: 'lab-iam-user',
        title: 'Manage IAM User Access',
        description: 'We hired a new data analyst, "Sarah". She needs read-only access to S3 buckets but should not be able to delete any data or modify EC2 instances.',
        difficulty: 'Beginner',
        service: 'IAM',
        estimatedTime: '10',
        initialState: {
             s3: [
                { bucketName: 'finance-data-sensitive', region: 'us-east-1', objects: [] }
             ]
        },
        steps: [
            {
                stepId: 'step-iam-1',
                title: 'Open IAM Dashboard',
                instruction: 'Navigate to the Identity and Access Management (IAM) console.',
                validationLogic: { type: 'URL_CONTAINS', value: '/service/iam' }
            },
            {
                stepId: 'step-iam-2',
                title: 'Create User',
                instruction: 'Add a new user with the username "sarah-analyst". Check "Programmatic access".',
                validationLogic: { type: 'RESOURCE_CREATED', resourceType: 'IAM_USER', username: 'sarah-analyst' }
            },
            {
                stepId: 'step-iam-3',
                title: 'Attach Permissions',
                instruction: 'Attach the "AmazonS3ReadOnlyAccess" managed policy to Sarah\'s account directly.',
                validationLogic: { type: 'POLICY_ATTACHED', policy: 'AmazonS3ReadOnlyAccess' }
            }
        ]
    }
];

mongoose.connect(MONGO_URI)
.then(async () => {
    console.log('Connected to MongoDB');
    
    // Clear existing
    await Lab.deleteMany({});
    await Step.deleteMany({});
    console.log('Cleared existing labs and steps');

    for (const labData of labsData) {
        const stepIds = [];
        
        // Create Steps
        for (let i = 0; i < labData.steps.length; i++) {
            const step = labData.steps[i];
            const newStep = new Step({
                ...step,
                labId: labData.labId,
                order: i + 1,
                expectedAction: 'GENERIC' 
            });
            await newStep.save();
            stepIds.push(newStep._id);
        }

        // Create Lab
        const newLab = new Lab({
            ...labData,
            steps: stepIds
        });
        await newLab.save();
        console.log(`Seeded Lab: ${newLab.title}`);
    }

    console.log('Seeding Complete');
    process.exit(0);
})
.catch(err => {
    console.error('Error seeding database:', err);
    process.exit(1);
});
