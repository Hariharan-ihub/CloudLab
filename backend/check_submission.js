const mongoose = require('mongoose');
const LabSubmission = require('./models/LabSubmission');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect('mongodb://localhost:27017/aws-learning-lab')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
        const latestSubmission = await LabSubmission.findOne().sort({ submittedAt: -1 });
        console.log('--- Latest Submission ---');
        if (latestSubmission) {
            console.log(JSON.stringify(latestSubmission, null, 2));
        } else {
            console.log('No submissions found.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
  })
  .catch(err => console.error(err));
