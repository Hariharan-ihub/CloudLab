# Gemini AI & YouTube API Setup Guide

## Overview

This guide explains how to set up Gemini AI for feedback evaluation and YouTube API for video suggestions in your CloudLab application.

## Features

1. **Gemini AI Feedback**: After submitting a lab, steps are sent to Gemini AI for intelligent feedback evaluation
2. **YouTube Video Suggestions**: Based on "Suggested Improvements", relevant tutorial videos are fetched from YouTube API
3. **Database Storage**: Feedback and video suggestions are stored in the database

## Environment Variables

Add these to your `backend/.env` file:

```env
# Gemini AI API Key
GEMINI_API_KEY=your-gemini-api-key-here

# YouTube Data API v3 Key
YOUTUBE_API_KEY=your-youtube-api-key-here
```

## Getting API Keys

### 1. Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the API key
5. Add to `.env` as `GEMINI_API_KEY`

**Note**: Gemini API is free for development with generous limits.

### 2. YouTube Data API v3 Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**:
   - Go to **APIs & Services** → **Library**
   - Search for "YouTube Data API v3"
   - Click **Enable**
4. Create credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **API Key**
   - Copy the API key
   - (Optional) Restrict the key to YouTube Data API v3 only
5. Add to `.env` as `YOUTUBE_API_KEY`

## How It Works

### Submission Flow

1. **User submits lab** → `POST /api/simulation/submit`
2. **Backend calculates score** based on completed steps
3. **Gemini AI evaluates**:
   - Lab details (title, description, steps)
   - User progress (completed steps)
   - Generates personalized feedback:
     - "What's working well" (strengths)
     - "Suggested Improvements" (actionable feedback)
4. **YouTube API searches** for videos based on improvements
5. **Data stored** in `LabSubmission` collection:
   - Score
   - Feedback (strengths & improvements)
   - Gemini feedback (if used)
   - YouTube video results
6. **Frontend displays** feedback and video suggestions

### Database Schema

```javascript
{
  userId: String,
  labId: String,
  score: Number (0-100),
  feedback: {
    strengths: [String],
    improvements: [String]
  },
  geminiFeedback: {
    strengths: [String],
    improvements: [String],
    generatedAt: Date
  },
  youtubeResults: [{
    videoId: String,
    title: String,
    thumbnail: String,
    channelTitle: String,
    url: String,
    description: String,
    relatedTo: String // Which improvement this addresses
  }],
  submittedAt: Date
}
```

## Fallback Behavior

### If Gemini API Key is Missing:
- Uses rule-based feedback generation
- Still provides useful feedback based on completed steps
- Logs warning: "Using fallback feedback"

### If YouTube API Key is Missing:
- Shows fallback video recommendations
- Logs warning: "YouTube API key not configured"

### If Both APIs Work:
- ✅ Intelligent AI-powered feedback
- ✅ Relevant video suggestions
- ✅ Personalized learning path

## Testing

1. **Add API keys** to `backend/.env`
2. **Restart backend server**:
   ```bash
   npm start
   ```
3. **Complete a lab** and submit it
4. **Check console logs**:
   - `✅ Generated feedback using Gemini AI`
   - `✅ Found X YouTube videos`
5. **View feedback** in the "Practice Feedback & Learning Guidance" popup

## API Usage & Limits

### Gemini API
- **Free tier**: 60 requests per minute
- **Model**: `gemini-1.5-flash` (fast and efficient)
- **Alternative models**: `gemini-1.5-pro`, `gemini-2.0-flash-exp`
- **Cost**: Free for development

### YouTube Data API v3
- **Free tier**: 10,000 units per day
- **Search request**: 100 units
- **Cost**: Free within quota

## Troubleshooting

### Gemini API Errors

**Error: "API key not valid"**
- Verify `GEMINI_API_KEY` in `.env`
- Check API key is active in Google AI Studio

**Error: "Quota exceeded"**
- Wait for quota reset (per minute)
- Check usage in Google AI Studio

### YouTube API Errors

**Error: "API key not valid"**
- Verify `YOUTUBE_API_KEY` in `.env`
- Ensure YouTube Data API v3 is enabled

**Error: "Quota exceeded"**
- Check daily quota usage
- Wait for daily reset or request quota increase

**No videos returned**
- Check API key permissions
- Verify search queries are valid
- Check API quota hasn't been exceeded

## Files Modified/Created

### Backend
- ✅ `backend/services/geminiService.js` - Gemini AI integration
- ✅ `backend/services/youtubeService.js` - YouTube API integration
- ✅ `backend/models/LabSubmission.js` - Updated schema
- ✅ `backend/controllers/simulationController.js` - Updated submit logic

### Dependencies
- ✅ `@google/generative-ai` - Gemini AI SDK
- ✅ `axios` - Already installed for YouTube API

## Example .env Configuration

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Server
PORT=5000
JWT_SECRET=...
SESSION_SECRET=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# AI & Media APIs
GEMINI_API_KEY=AIzaSy...your-gemini-key
YOUTUBE_API_KEY=AIzaSy...your-youtube-key

# Frontend URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

## Security Notes

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Restrict API keys** in production:
   - Gemini: Restrict by IP/domain
   - YouTube: Restrict to YouTube Data API v3 only
3. **Rotate keys regularly** if exposed
4. **Monitor usage** to detect abuse

## Next Steps

1. ✅ Add API keys to `.env`
2. ✅ Restart backend server
3. ✅ Test lab submission
4. ✅ Verify feedback generation
5. ✅ Check video suggestions appear

---

**Ready to use!** Once API keys are added, the system will automatically use Gemini AI for feedback and YouTube API for video suggestions.

