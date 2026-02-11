
const mongoose = require('mongoose');
const Lab = require('./models/Lab');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect('mongodb://localhost:27017/aws-learning-lab')
  .then(() => listLabs())
  .catch(err => console.error(err));

const listLabs = async () => {
  try {
    const labs = await Lab.find({}, 'labId title service');
    console.log(`COUNT: ${labs.length}`);
    labs.forEach(l => console.log(`[${l.labId}] '${l.title}' (len: ${l.title.length})`));
    console.log('DONE');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
