# OAuth Client IDs & Secrets Setup Guide

## Where to Add OAuth Credentials

Add OAuth client IDs and secrets to your **`backend/.env`** file.

## Environment Variables Location

**File:** `backend/.env`

Create this file if it doesn't exist (it's gitignored for security).

## Supported OAuth Providers

### 1. Google OAuth

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

**How to get Google OAuth credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `http://localhost:5173/auth/google/callback`
7. Copy Client ID and Client Secret

---

### 2. GitHub OAuth

```env
# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:5173/auth/github/callback
```

**How to get GitHub OAuth credentials:**
1. Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps**
2. Click **New OAuth App**
3. Application name: Your app name
4. Homepage URL: `http://localhost:5173`
5. Authorization callback URL: `http://localhost:5173/auth/github/callback`
6. Copy Client ID and generate Client Secret

---

### 3. Facebook OAuth

```env
# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:5173/auth/facebook/callback
```

**How to get Facebook OAuth credentials:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add **Facebook Login** product
4. Settings → Basic → Copy App ID and App Secret
5. Valid OAuth Redirect URIs: `http://localhost:5173/auth/facebook/callback`

---

### 4. Microsoft/Azure AD OAuth

```env
# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/microsoft/callback
```

**How to get Microsoft OAuth credentials:**
1. Go to [Azure Portal](https://portal.azure.com/)
2. **Azure Active Directory** → **App registrations** → **New registration**
3. Redirect URI: `http://localhost:5173/auth/microsoft/callback`
4. Copy Application (client) ID and Directory (tenant) ID
5. **Certificates & secrets** → Create new client secret

---

## Complete .env Example

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aws-learning-lab

# Server Port
PORT=5000

# JWT Secret (for regular auth)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:5173/auth/github/callback

# Facebook OAuth (Optional)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_REDIRECT_URI=http://localhost:5173/auth/facebook/callback

# Microsoft OAuth (Optional)
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=
MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/microsoft/callback

# Node Environment
NODE_ENV=development
```

## Production Environment Variables

For production, update redirect URIs:

```env
# Production URLs
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
GITHUB_REDIRECT_URI=https://yourdomain.com/auth/github/callback
FACEBOOK_REDIRECT_URI=https://yourdomain.com/auth/facebook/callback
MICROSOFT_REDIRECT_URI=https://yourdomain.com/auth/microsoft/callback
```

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use different credentials** for development and production
3. **Rotate secrets regularly** - Especially if exposed
4. **Use environment-specific configs** - Separate `.env` files for dev/staging/prod
5. **Store production secrets** in secure vaults (AWS Secrets Manager, Azure Key Vault, etc.)

## Accessing Environment Variables in Code

### Backend (Node.js)
```javascript
// Access in your code
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
```

### Frontend (React)
**Note:** Never expose secrets in frontend! Only use client IDs.

For frontend, you'll need to proxy OAuth through backend or use environment variables prefixed with `VITE_`:

```env
# Frontend .env (frontend_app/.env)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GITHUB_CLIENT_ID=your-github-client-id
```

Then access in React:
```javascript
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
```

## Quick Setup Checklist

- [ ] Create `backend/.env` file
- [ ] Add MongoDB URI
- [ ] Add JWT_SECRET
- [ ] Add OAuth client IDs and secrets (if using OAuth)
- [ ] Update redirect URIs for your environment
- [ ] Verify `.env` is in `.gitignore`
- [ ] Restart backend server after changes

## Need Help?

- **Google OAuth**: [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- **GitHub OAuth**: [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps)
- **Facebook OAuth**: [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- **Microsoft OAuth**: [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)

