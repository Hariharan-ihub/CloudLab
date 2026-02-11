
const mongoose = require('mongoose');
const Lab = require('./models/Lab');
const Step = require('./models/Step');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect('mongodb://localhost:27017/aws-learning-lab')
  .then(() => checkData())
  .catch(err => console.error(err));

const checkData = async () => {
  try {
    const labs = await Lab.find();
    console.log('Labs count:', labs.length);
    labs.forEach(l => {
        console.log(`Lab: ${l.labId}, Steps count: ${l.steps.length}`);
        console.log('Steps IDs:', l.steps);
    });

    const steps = await Step.find();
    console.log('Total Steps count:', steps.length);
    steps.forEach(s => {
        console.log(`Step: ${s.stepId}, LabId(ref): ${s.labId}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
};
