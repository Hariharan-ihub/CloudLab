# Google OAuth Setup Guide

## ✅ Implementation Complete!

Google OAuth authentication has been successfully integrated into your application.

## 📋 Setup Steps

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" or "Google Identity"
   - Click **Enable**
4. Create OAuth 2.0 Credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `CloudLab OAuth`
   
   **Authorized JavaScript origins** (where your frontend runs):
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`
   
   **Authorized redirect URIs** (backend callback):
   - Development: `http://localhost:5000/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
   
   - Click **Create**
   - Copy the **Client ID** and **Client Secret**

### 2. Add Credentials to `.env` File

Add these to your `backend/.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Session Secret (can use same as JWT_SECRET)
SESSION_SECRET=your-session-secret-key
```

### 3. Restart Backend Server

After adding credentials, restart your backend server:

```bash
cd backend
npm start
```

## 🎯 How It Works

### User Flow

1. User clicks **"Sign in with Google"** button
2. Redirects to Google OAuth consent screen
3. User grants permissions
4. Google redirects back to `/api/auth/google/callback`
5. Backend creates/finds user and generates JWT token
6. Redirects to frontend `/auth/google/callback` with token
7. Frontend stores token and logs user in

### Features

- ✅ **Automatic User Creation**: Creates user account if doesn't exist
- ✅ **Account Linking**: Links Google account to existing email
- ✅ **JWT Token Generation**: Same token system as regular login
- ✅ **Seamless Integration**: Works with existing auth system

## 🔧 Files Modified/Created

### Backend
- ✅ `backend/models/User.js` - Updated to support OAuth users
- ✅ `backend/config/passport.js` - Google OAuth strategy
- ✅ `backend/controllers/googleAuthController.js` - OAuth handlers
- ✅ `backend/routes/authRoutes.js` - Added Google routes
- ✅ `backend/server.js` - Added Passport and session middleware

### Frontend
- ✅ `frontend_app/src/components/Auth/Login.jsx` - Added Google button
- ✅ `frontend_app/src/components/Auth/Register.jsx` - Added Google button
- ✅ `frontend_app/src/components/Auth/GoogleCallback.jsx` - Callback handler
- ✅ `frontend_app/src/App.jsx` - Added callback route

## 🧪 Testing

1. **Start Backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend**:
   ```bash
   cd frontend_app
   npm run dev
   ```

3. **Test Google Login**:
   - Go to `http://localhost:5173/login`
   - Click **"Sign in with Google"**
   - Complete Google authentication
   - Should redirect back and log you in

## 🔒 Security Notes

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use HTTPS in production** - Update redirect URIs
3. **Rotate secrets regularly** - Especially if exposed
4. **Validate redirect URIs** - Only allow trusted domains

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123456.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxxxx` |
| `GOOGLE_REDIRECT_URI` | Backend callback URL | `http://localhost:5000/api/auth/google/callback` |
| `FRONTEND_URL` | Frontend URL for redirects | `http://localhost:5173` |
| `BACKEND_URL` | Backend URL | `http://localhost:5000` |
| `SESSION_SECRET` | Session encryption secret | Same as JWT_SECRET |

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
- **Solution**: Check redirect URI in Google Console matches exactly:
  - Development: `http://localhost:5000/api/auth/google/callback`
  - Must match exactly (including http/https, port, path)

### Error: "invalid_client"
- **Solution**: Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

### Error: "User not found" after OAuth
- **Solution**: Check MongoDB connection and User model

### Button doesn't redirect
- **Solution**: Check backend is running and `/api/auth/google` route is accessible

## 🚀 Production Deployment

For production, update these in `.env`:

```env
# Production URLs
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Update Google Console redirect URI to match
```

## ✅ Checklist

- [ ] Google Cloud Console project created
- [ ] Google+ API enabled
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URI added to Google Console
- [ ] Credentials added to `backend/.env`
- [ ] Backend server restarted
- [ ] Tested Google login flow
- [ ] User account created successfully
- [ ] JWT token generated correctly

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Ready to use!** Just add your Google OAuth credentials to `backend/.env` and restart the server.

