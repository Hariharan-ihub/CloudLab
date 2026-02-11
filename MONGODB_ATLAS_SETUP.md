# MongoDB Atlas Connection Setup Guide

## Common Issues & Solutions

### Issue: "bad auth : authentication failed"

This usually means:
1. **Wrong username/password** in connection string
2. **Special characters** in password need URL encoding
3. **Database user** doesn't exist or lacks permissions

## Fix Your Connection String

### Step 1: Get Your Connection String from Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string

It should look like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Step 2: Update Your .env File

**Important**: If your password contains special characters, you MUST URL-encode them:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `:` | `%3A` |
| `/` | `%2F` |
| `?` | `%3F` |
| `#` | `%23` |
| `[` | `%5B` |
| `]` | `%5D` |
| ` ` (space) | `%20` |

**Example**:
- Password: `myP@ssw:rd`
- Encoded: `myP%40ssw%3Ard`
- Connection string: `mongodb+srv://username:myP%40ssw%3Ard@cluster0.xxxxx.mongodb.net/aws-learning-lab`

### Step 3: Add Database Name

Add `/aws-learning-lab` at the end (before query parameters):

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aws-learning-lab?retryWrites=true&w=majority
```

### Step 4: Verify Network Access

1. Go to MongoDB Atlas → **Network Access**
2. Click **"Add IP Address"**
3. For development, you can use:
   - **"Add Current IP Address"** (recommended)
   - Or **"Allow Access from Anywhere"** (`0.0.0.0/0`) - Only for development!

### Step 5: Verify Database User

1. Go to MongoDB Atlas → **Database Access**
2. Ensure your user exists
3. User should have **"Read and write to any database"** permissions
4. Or at minimum: Read/Write access to `aws-learning-lab` database

## Test Connection

Run this command to test:

```bash
cd backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); console.log('Testing connection...'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✅ Connected successfully!'); process.exit(0); }).catch(err => { console.error('❌ Error:', err.message); process.exit(1); });"
```

## Complete .env Example

```env
# MongoDB Atlas Connection
# Format: mongodb+srv://username:encoded_password@cluster.mongodb.net/database-name?options
MONGODB_URI=mongodb+srv://myuser:myp%40ssw0rd@cluster0.abc123.mongodb.net/aws-learning-lab?retryWrites=true&w=majority

# Server Port
PORT=5000

# Optional: YouTube API Key
YOUTUBE_API_KEY=

# Environment
NODE_ENV=development
```

## Quick Checklist

- [ ] Connection string starts with `mongodb+srv://`
- [ ] Username and password are correct
- [ ] Special characters in password are URL-encoded
- [ ] Database name `/aws-learning-lab` is included
- [ ] Network access allows your IP address
- [ ] Database user has read/write permissions
- [ ] Connection string is in `.env` file (not committed to git)

## Still Having Issues?

1. **Double-check credentials** in MongoDB Atlas → Database Access
2. **Try creating a new database user** with a simple password (no special chars)
3. **Check MongoDB Atlas logs** for connection attempts
4. **Verify cluster is running** (not paused)
5. **Test with MongoDB Compass** using the same connection string

