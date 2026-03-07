const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const resetOnboarding = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully.');

        console.log('Resetting onboarding status for all users...');
        const result = await User.updateMany({}, {
            $set: {
                hasCompletedOnboarding: false,
                onboardingPhase: 'role',
                selectedRole: null,
                onboardingRepo: null
            }
        });

        console.log(`Successfully reset ${result.modifiedCount} users.`);
        console.log('Sequence enforced: Role Selection -> GitHub Link -> Jenkins Build -> Services');
        
        process.exit(0);
    } catch (error) {
        console.error('Error resetting onboarding:', error);
        process.exit(1);
    }
};

resetOnboarding();
