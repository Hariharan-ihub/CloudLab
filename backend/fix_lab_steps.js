
const mongoose = require('mongoose');
const Lab = require('./models/Lab');
const Step = require('./models/Step');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect('mongodb://localhost:27017/aws-learning-lab')
  .then(() => fixData())
  .catch(err => console.error(err));

const fixData = async () => {
  try {
    const lab = await Lab.findOne({ labId: 'lab-ec2-launch' });
    if (!lab) {
        console.log('Lab not found');
        process.exit(1);
    }
    
    const steps = await Step.find({ labId: lab._id });
    console.log(`Found ${steps.length} steps for lab ${lab.labId}`);
    
    lab.steps = steps.map(s => s._id);
    await lab.save();
    console.log('Updated lab with steps:', lab.steps);
    
    process.exit(0);
  } catch (error) {
    console.error('Fix failed:', error);
    process.exit(1);
  }
};
