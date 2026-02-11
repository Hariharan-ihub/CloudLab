# API Keys Setup Guide - Gemini AI & YouTube

## Quick Setup

Add these two API keys to your `backend/.env` file:

```env
# Gemini AI API Key (for intelligent feedback)
GEMINI_API_KEY=your-gemini-api-key-here

# YouTube Data API v3 Key (for video suggestions)
YOUTUBE_API_KEY=your-youtube-api-key-here
```

## How to Get API Keys

### 1. Gemini API Key (Free)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click **"Create API Key"**
4. Copy the key
5. Add to `.env` as `GEMINI_API_KEY`

**Free tier**: 60 requests/minute - Perfect for development!

### 2. YouTube Data API v3 Key (Free)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable **YouTube Data API v3**:
   - APIs & Services → Library
   - Search "YouTube Data API v3"
   - Click **Enable**
4. Create API Key:
   - APIs & Services → Credentials
   - Create Credentials → API Key
   - Copy the key
5. Add to `.env` as `YOUTUBE_API_KEY`

**Free tier**: 10,000 units/day - More than enough!

## Complete .env Example

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aws-learning-lab

# Server
PORT=5000
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# AI & Media APIs
GEMINI_API_KEY=AIzaSy...your-gemini-key
GEMINI_MODEL=gemini-1.5-flash  # Optional: gemini-1.5-pro, gemini-2.0-flash-exp
YOUTUBE_API_KEY=AIzaSy...your-youtube-key
```

## How It Works

### After Lab Submission:

1. **Steps sent to Gemini AI** → Analyzes completed steps
2. **Gemini generates feedback**:
   - ✅ "What's working well" (strengths)
   - 🔧 "Suggested Improvements" (actionable feedback)
3. **YouTube API searches** for videos based on improvements
4. **Everything stored** in database
5. **Displayed** in "Practice Feedback & Learning Guidance" popup

### Fallback Behavior:

- **No Gemini API**: Uses rule-based feedback (still works!)
- **No YouTube API**: Shows fallback video recommendations
- **Both APIs**: Full AI-powered experience ✨

## Testing

1. Add both API keys to `backend/.env`
2. Restart backend: `npm start`
3. Complete and submit a lab
4. Check console for:
   - `✅ Generated feedback using Gemini AI`
   - `✅ Found X YouTube videos`
5. View feedback popup - should show AI feedback and videos!

## Files Created

- ✅ `backend/services/geminiService.js` - Gemini AI integration
- ✅ `backend/services/youtubeService.js` - YouTube API integration
- ✅ `GEMINI_YOUTUBE_SETUP.md` - Detailed documentation

## Files Modified

- ✅ `backend/models/LabSubmission.js` - Added `geminiFeedback` field
- ✅ `backend/controllers/simulationController.js` - Integrated Gemini & YouTube

## Troubleshooting

**Gemini not working?**
- Check `GEMINI_API_KEY` in `.env`
- Verify key is active in Google AI Studio
- Check console for errors

**YouTube videos not showing?**
- Check `YOUTUBE_API_KEY` in `.env`
- Ensure YouTube Data API v3 is enabled
- Check API quota hasn't been exceeded

**Both working?**
- You'll see intelligent AI feedback
- Relevant video suggestions
- Personalized learning path! 🎉

---

**That's it!** Add the keys, restart server, and enjoy AI-powered feedback! 🚀

