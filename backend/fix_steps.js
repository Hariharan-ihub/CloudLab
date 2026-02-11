
const mongoose = require('mongoose');
const Lab = require('./models/Lab');
const Step = require('./models/Step');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect('mongodb://localhost:27017/aws-learning-lab')
  .then(() => fixSteps())
  .catch(err => console.error(err));

const fixSteps = async () => {
  try {
    console.log('Fixing Step Validation Logic (v2)...');

    // 1. Get the Lab ObjectId
    const lab = await Lab.findOne({ labId: 'lab-ec2-launch' });
    if (!lab) {
        console.error('Lab not found!');
        process.exit(1);
    }
    const labObjectId = lab._id;
    console.log(`Found Lab ObjectId: ${labObjectId}`);

    // Update Steps using the correct labId (ObjectId)
    
    // 1. Open EC2 Dashboard
    const r1 = await Step.updateOne(
        { title: 'Open EC2 Dashboard', labId: labObjectId },
        { $set: { 
            validationLogic: { type: 'URL_CONTAINS', value: '/service/ec2' },
            expectedAction: 'NAVIGATE'
        } }
    );
    console.log('Update 1:', r1);

    // 2. Name Your Instance
    const r2 = await Step.updateOne(
        { title: 'Name Your Instance', labId: labObjectId },
        { $set: { 
            validationLogic: { type: 'INPUT_VALUE', field: 'name', value: 'Marketing-Server' },
            expectedAction: 'INPUT_VALUE'
        } }
    );
    console.log('Update 2:', r2);

    // 3. Choose AMI
    const r3 = await Step.updateOne(
        { title: 'Choose an Amazon Machine Image (AMI)', labId: labObjectId },
        { $set: { 
            validationLogic: { type: 'SELECT_OPTION', field: 'ami', value: 'ami-al2023' },
            expectedAction: 'SELECT_OPTION'
        } }
    );
    console.log('Update 3:', r3);

    // 4. Choose Instance Type
    const r4 = await Step.updateOne(
        { title: 'Choose Instance Type', labId: labObjectId },
        { $set: { 
            validationLogic: { type: 'SELECT_OPTION', field: 'instanceType', value: 't2.micro' },
            expectedAction: 'SELECT_OPTION'
        } }
    );
    console.log('Update 4:', r4);

    // 5. Start Launch Wizard (Button Click)
    const r5 = await Step.updateOne(
        { title: 'Start Launch Wizard', labId: labObjectId },
        { $set: { 
            validationLogic: { type: 'CLICK_BUTTON', value: 'Launch Instance' },
            expectedAction: 'CLICK_BUTTON'
        } }
    );
    console.log('Update 5:', r5);
    
    // 6. Final Launch Verification
    const r6 = await Step.updateOne(
        { title: 'Launch Instance', labId: labObjectId },
        { $set: { 
            validationLogic: { type: 'RESOURCE_CREATED', resourceType: 'EC2_INSTANCE' },
            expectedAction: 'CLICK_FINAL_LAUNCH'
        } }
    );
    console.log('Update 6:', r6);

    console.log('Steps Updated Successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Fix failed:', error);
    process.exit(1);
  }
};
