# Google OAuth Configuration Guide

## ✅ Correct Configuration

When setting up Google OAuth in Google Cloud Console, you need to configure **TWO** different settings:

### 1. Authorized JavaScript Origins
**This is your FRONTEND URL** ✅

- **Development**: `http://localhost:5173`
- **Production**: `https://yourdomain.com`

**Purpose**: This tells Google which domains are allowed to initiate OAuth requests from JavaScript.

### 2. Authorized Redirect URIs
**This is your BACKEND Callback URL** ✅

- **Development**: `http://localhost:5000/api/auth/google/callback`
- **Production**: `https://yourdomain.com/api/auth/google/callback`

**Purpose**: This is where Google redirects the user after they grant permission.

---

## 📋 Step-by-Step Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Fill in the form:

   ```
   Application type: Web application
   Name: CloudLab OAuth
   
   Authorized JavaScript origins:
   + Add URI: http://localhost:5173
   
   Authorized redirect URIs:
   + Add URI: http://localhost:5000/api/auth/google/callback
   ```

6. Click **Create**
7. Copy **Client ID** and **Client Secret**

---

## 🔧 Your `.env` File

Add these to `backend/.env`:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Backend callback URL (must match Google Console redirect URI)
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Frontend URL (must match Google Console JavaScript origins)
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

---

## 🎯 Quick Reference

| Setting | Google Console | Your .env | Purpose |
|---------|---------------|-----------|---------|
| **JavaScript Origins** | `http://localhost:5173` | `FRONTEND_URL` | Where frontend runs |
| **Redirect URI** | `http://localhost:5000/api/auth/google/callback` | `GOOGLE_REDIRECT_URI` | Backend callback |

---

## ⚠️ Common Mistakes

❌ **Wrong**: Using frontend URL as redirect URI
✅ **Correct**: Frontend URL = JavaScript origins, Backend URL = Redirect URI

❌ **Wrong**: Using `http://localhost:5173/api/auth/google/callback`
✅ **Correct**: Using `http://localhost:5000/api/auth/google/callback`

❌ **Wrong**: Forgetting to add both JavaScript origins AND redirect URIs
✅ **Correct**: Add both in Google Console

---

## 🧪 Testing

After configuration:

1. **Check Google Console**:
   - ✅ JavaScript origins: `http://localhost:5173`
   - ✅ Redirect URI: `http://localhost:5000/api/auth/google/callback`

2. **Check your `.env`**:
   - ✅ `GOOGLE_CLIENT_ID` matches Google Console
   - ✅ `GOOGLE_CLIENT_SECRET` matches Google Console
   - ✅ `GOOGLE_REDIRECT_URI` matches Google Console redirect URI
   - ✅ `FRONTEND_URL` matches Google Console JavaScript origins

3. **Test the flow**:
   - Click "Sign in with Google" button
   - Should redirect to Google login
   - After login, should redirect back to your app

---

## 🚀 Production

For production, update both in Google Console:

**Authorized JavaScript origins**:
- `https://yourdomain.com`

**Authorized redirect URIs**:
- `https://yourdomain.com/api/auth/google/callback`
- Or if backend is separate: `https://api.yourdomain.com/api/auth/google/callback`

And update `.env`:
```env
FRONTEND_URL=https://yourdomain.com
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
```

---

**Summary**: Yes, `FRONTEND_URL=http://localhost:5173` goes in **Authorized JavaScript origins**, and the backend callback URL goes in **Authorized redirect URIs**! ✅

