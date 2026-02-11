
const mongoose = require('mongoose');
const Lab = require('./models/Lab');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect('mongodb://localhost:27017/aws-learning-lab')
  .then(() => checkServices())
  .catch(err => console.error(err));

const checkServices = async () => {
  try {
    const labs = await Lab.find();
    labs.forEach(l => {
        console.log(`\nLab: ${l.labId}`);
        if (l.initialState) {
            console.log('Initial State Keys:', Object.keys(l.initialState));
            console.log('Initial State Preview:', JSON.stringify(l.initialState).substring(0, 150) + '...');
        } else {
            console.log('No Initial State found.');
        }
    });

    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
};
