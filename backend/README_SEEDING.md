# Database Seeding Guide

This guide explains how to seed the database with initial data for the CloudLab application.

## Prerequisites

1. **MongoDB must be running** on your system
   - Default: `mongodb://localhost:27017`
   - Or set `MONGODB_URI` in `.env` file

2. **Install dependencies** (if not already done)
   ```bash
   npm install
   ```

## Quick Start

### Option 1: Using npm script (Recommended)
```bash
npm run seed
```

### Option 2: Direct execution
```bash
node scripts/seedDatabase.js
```

## What Gets Seeded

The seeding script creates:

### Labs Created:
1. **lab-ec2-launch** - Launch Your First EC2 Instance (Beginner)
   - 6 steps
   - Includes initial VPC, Subnet, and Security Group

2. **lab-s3-website** - Host a Static Website on S3 (Intermediate)
   - 4 steps
   - Includes initial S3 bucket with sample objects

3. **lab-iam-user** - Secure Access with IAM Users (Beginner)
   - 3 steps
   - Includes initial IAM groups and policies

4. **lab-vpc-secure** - Build a Secure VPC Network (Advanced)
   - 4 steps
   - Includes initial VPC and subnet

### Total Data:
- **4 Labs**
- **17 Steps** (across all labs)
- **Initial States** for each lab (VPC, Subnets, Security Groups, S3 buckets, IAM resources)

## Environment Variables

Create a `.env` file in the `backend` directory (optional):

```env
MONGODB_URI=mongodb://localhost:27017/aws-learning-lab
PORT=5000
YOUTUBE_API_KEY=your_youtube_api_key_here
```

If `MONGODB_URI` is not set, it defaults to `mongodb://localhost:27017/aws-learning-lab`.

## Verification

After seeding, you can verify the data:

1. **Start the backend server:**
   ```bash
   npm start
   ```

2. **Check the API:**
   ```bash
   curl http://localhost:5000/api/labs
   ```

   Or visit `http://localhost:5000/api/labs` in your browser.

3. **Expected Response:**
   You should see an array of 4 lab objects with their details.

## Troubleshooting

### MongoDB Connection Error
```
Error: MongoDB connection error: ...
```

**Solution:**
- Ensure MongoDB is running: `mongodb://localhost:27017`
- Check your MongoDB connection string in `.env`
- Verify MongoDB service is started

### Port Already in Use
```
Error: Port 5000 is already in use
```

**Solution:**
- Stop any existing server instances
- Or change the PORT in `.env` file

### Database Already Has Data
The seeding script will **clear all existing data** before seeding. If you want to keep existing data, modify the script to skip the `deleteMany()` calls.

## Resetting the Database

To reset and reseed the database:

```bash
npm run seed
```

This will:
1. Delete all existing Labs
2. Delete all existing Steps
3. Create fresh data from the seed script

## Additional Notes

- The seeding script uses the `labId` string (not MongoDB `_id`) to link Steps to Labs
- Each lab includes an `initialState` object that defines pre-existing resources
- Steps are ordered by their `order` field (1, 2, 3, etc.)
- All labs are ready to use immediately after seeding

## Support

If you encounter issues:
1. Check MongoDB is running
2. Verify your `.env` file configuration
3. Check the console output for specific error messages
4. Ensure all dependencies are installed (`npm install`)

