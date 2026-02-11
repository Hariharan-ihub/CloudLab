
const mongoose = require('mongoose');
const Lab = require('./models/Lab');
const Step = require('./models/Step');
const UserProgress = require('./models/UserProgress');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect('mongodb://localhost:27017/aws-learning-lab')
  .then(() => checkData())
  .catch(err => console.error(err));

const checkData = async () => {
  try {
    const lab = await Lab.findOne({ labId: 'lab-ec2-launch' }).populate('steps');
    console.log('--- LAB STEPS ---');
    if (lab) {
        lab.steps.forEach(s => {
            console.log(`Step ID: ${s.stepId}`);
            console.log(`Title: ${s.title}`);
            console.log(`Expected Action: ${s.expectedAction}`);
            console.log(`Logic:`, JSON.stringify(s.validationLogic));
            console.log('---');
        });
    } else {
        console.log('Lab not found');
    }

    console.log('\n--- USER PROGRESS ---');
    const prog = await UserProgress.findOne({ userId: 'user-123', labId: 'lab-ec2-launch' });
    if (prog) {
        console.log('Completed Steps:', prog.completedSteps);
        console.log('Current Step:', prog.currentStep);
    } else {
        console.log('No progress found for user-123');
    }

    // flush
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
