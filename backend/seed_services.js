
const mongoose = require('mongoose');
const Lab = require('./models/Lab');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect('mongodb://localhost:27017/aws-learning-lab')
  .then(() => seedServices())
  .catch(err => console.error(err));

const seedServices = async () => {
  try {
    console.log('Seeding initial service states...');

    // 1. EC2 Lab - Needs VPC, Subnets, and Security Groups
    const vpcId = 'vpc-0d123456789abcdef';
    const subnetPublicId = 'subnet-0123456789abcdef0';
    const subnetPrivateId = 'subnet-0fedcba9876543210';
    const sgId = 'sg-0832917462';

    const ec2State = {
        vpc: [{
            vpcId: vpcId,
            name: 'Project-VPC',
            cidrBlock: '10.0.0.0/16',
            status: 'available'
        }],
        subnet: [
            {
                subnetId: subnetPublicId,
                vpcId: vpcId,
                name: 'Public-Subnet-1',
                cidrBlock: '10.0.1.0/24',
                availabilityZone: 'us-east-1a',
                mapPublicIpOnLaunch: true
            },
            {
                subnetId: subnetPrivateId,
                vpcId: vpcId,
                name: 'Private-Subnet-1',
                cidrBlock: '10.0.2.0/24',
                availabilityZone: 'us-east-1b',
                mapPublicIpOnLaunch: false
            }
        ],
        securityGroup: [{
            groupId: sgId,
            groupName: 'default',
            description: 'default VPC security group',
            vpcId: vpcId,
            inboundRules: [
                { protocol: '-1', portRange: 'All', source: '0.0.0.0/0', type: 'All traffic' },
                { protocol: 'TCP', portRange: '22', source: '0.0.0.0/0', type: 'SSH' }
            ]
        }]
    };

    const ec2Lab = await Lab.findOneAndUpdate(
        { labId: 'lab-ec2-launch' },
        { $set: { initialState: ec2State } },
        { new: true }
    );
    console.log(`Updated EC2 Lab (${ec2Lab.labId}) with initial VPC/Subnet state.`);


    // 2. S3 Lab - Needs a bucket
    const s3State = {
        s3: [{
            bucketName: 'company-branding-assets',
            region: 'us-east-1',
            objects: [
                { key: 'logo.png', size: '15 KB', lastModified: new Date().toISOString() },
                { key: 'index.html', size: '2 KB', lastModified: new Date().toISOString() }
            ],
            versioning: 'Suspended'
        }]
    };

    const s3Lab = await Lab.findOneAndUpdate(
        { labId: 'lab-s3-website' },
        { $set: { initialState: s3State } },
        { new: true }
    );
    console.log(`Updated S3 Lab (${s3Lab.labId}) with initial Bucket state.`);


    // 3. IAM Lab - Needs an existing Group
    const iamState = {
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
    };

    const iamLab = await Lab.findOneAndUpdate(
        { labId: 'lab-iam-user' },
        { $set: { initialState: iamState } },
        { new: true }
    );
    console.log(`Updated IAM Lab (${iamLab.labId}) with initial Groups/Policies.`);

    console.log('Service Seeding Complete.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Services failed:', error);
    process.exit(1);
  }
};
