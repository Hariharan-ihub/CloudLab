# Environment Variables Setup Guide

## Quick Start

1. Copy the example file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` with your values (see below)

## Environment Variables

### Required Variables

#### `MONGODB_URI`
- **Description**: MongoDB connection string
- **Default**: `mongodb://localhost:27017/aws-learning-lab`
- **Example (Local)**: `mongodb://localhost:27017/aws-learning-lab`
- **Example (MongoDB Atlas)**: `mongodb+srv://username:password@cluster.mongodb.net/aws-learning-lab`
- **Required**: No (has default)

#### `PORT`
- **Description**: Port for the backend server
- **Default**: `5000`
- **Example**: `5000`
- **Required**: No (has default)

### Optional Variables

#### `YOUTUBE_API_KEY`
- **Description**: YouTube Data API key for video recommendations in lab submissions
- **Default**: None (feature disabled if not provided)
- **How to get**: 
  1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  2. Create a new project or select existing
  3. Enable YouTube Data API v3
  4. Create credentials (API Key)
  5. Copy the API key
- **Required**: No

#### `NODE_ENV`
- **Description**: Node.js environment
- **Default**: `development`
- **Options**: `development`, `production`, `test`
- **Required**: No

## Sample .env File

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/aws-learning-lab

# Server Port
PORT=5000

# YouTube API Key (Optional)
YOUTUBE_API_KEY=your_youtube_api_key_here

# Node Environment
NODE_ENV=development
```

## Setup Instructions

### For Local Development

1. **Install MongoDB** (if not already installed):
   - Windows: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - macOS: `brew install mongodb-community`
   - Linux: Follow [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB**:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   mongod
   ```

3. **Create .env file**:
   ```bash
   cd backend
   cp .env.example .env
   ```

4. **Edit .env** (if needed):
   - Most defaults work for local development
   - Only change if MongoDB is on different port/host

### For Production

1. **Set up MongoDB**:
   - Use MongoDB Atlas (cloud) or your own MongoDB server
   - Get connection string

2. **Create .env file**:
   ```bash
   cd backend
   cp .env.example .env
   ```

3. **Update .env**:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aws-learning-lab
   PORT=5000
   NODE_ENV=production
   YOUTUBE_API_KEY=your_actual_api_key_here
   ```

## Security Notes

⚠️ **Important**: 
- Never commit `.env` file to git (it's in `.gitignore`)
- Keep `.env.example` as a template
- Use different API keys for development and production
- Don't share your `.env` file publicly

## Verification

After setting up `.env`, verify it works:

1. **Start the backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Check console output**:
   - Should see: `MongoDB connected`
   - Should see: `Server running on port 5000`

3. **Test API**:
   ```bash
   curl http://localhost:5000/api/labs
   ```

## Troubleshooting

### MongoDB Connection Error
- Check if MongoDB is running
- Verify `MONGODB_URI` is correct
- Check MongoDB logs for errors

### Port Already in Use
- Change `PORT` in `.env` to another port (e.g., `5001`)
- Or stop the process using port 5000

### YouTube API Not Working
- Check if API key is valid
- Verify YouTube Data API v3 is enabled in Google Cloud Console
- Feature will work without API key (just no video recommendations)

