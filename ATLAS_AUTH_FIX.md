# Fix MongoDB Atlas Authentication Error

## Current Status
✅ Database name is correct (`/aws-learning-lab`)
❌ Authentication is failing

## Step-by-Step Fix

### Step 1: Get Fresh Connection String from Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click **"Connect"** button on your cluster
3. Select **"Connect your application"**
4. Copy the connection string (it will have `<password>` placeholder)

### Step 2: Get Your Actual Password

1. Go to MongoDB Atlas → **"Database Access"** (left menu)
2. Find your user: `hariselvan545_db_user`
3. Click **"Edit"** or **"..."** → **"Edit User"**
4. If you forgot the password, click **"Edit Password"** to reset it
5. **Copy the password** (or set a new one)

### Step 3: Build Your Connection String

**Format:**
```
mongodb+srv://USERNAME:PASSWORD@cluster0.ywq1q4h.mongodb.net/aws-learning-lab?retryWrites=true&w=majority
```

**Replace:**
- `USERNAME` → `hariselvan545_db_user`
- `PASSWORD` → Your actual password (URL-encode if needed)

### Step 4: URL-Encode Password (If Needed)

If your password contains these characters, encode them:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `:` | `%3A` |
| `/` | `%2F` |
| `#` | `%23` |
| `[` | `%5B` |
| `]` | `%5D` |
| `?` | `%3F` |
| ` ` (space) | `%20` |

**Example:**
- Password: `myP@ss:123`
- Encoded: `myP%40ss%3A123`
- Connection string: `mongodb+srv://hariselvan545_db_user:myP%40ss%3A123@cluster0.ywq1q4h.mongodb.net/aws-learning-lab`

### Step 5: Update .env File

Open `backend/.env` and update:

```env
MONGODB_URI=mongodb+srv://hariselvan545_db_user:YOUR_ENCODED_PASSWORD@cluster0.ywq1q4h.mongodb.net/aws-learning-lab?retryWrites=true&w=majority
PORT=5000
```

### Step 6: Verify Network Access

1. Go to MongoDB Atlas → **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Add Current IP Address"** (recommended)
   - OR use `0.0.0.0/0` for development (less secure)
4. Click **"Confirm"**

### Step 7: Verify Database User Permissions

1. Go to MongoDB Atlas → **"Database Access"**
2. Find `hariselvan545_db_user`
3. Click **"Edit"**
4. Under **"Database User Privileges"**, ensure:
   - **"Read and write to any database"** is selected
   - OR **"Read and write to specific database"** → Select `aws-learning-lab`
5. Click **"Update User"**

### Step 8: Test Connection

```bash
cd backend
node fix-atlas-connection.js
```

Or:
```bash
node test-connection.js
```

## Quick Password Encoding Tool

Run this in Node.js to encode your password:

```bash
node -e "console.log('Encoded:', encodeURIComponent('YOUR_PASSWORD_HERE'))"
```

Replace `YOUR_PASSWORD_HERE` with your actual password.

## Common Mistakes

1. ❌ Using `<password>` placeholder instead of actual password
2. ❌ Not encoding special characters in password
3. ❌ Missing database name `/aws-learning-lab`
4. ❌ Network access not configured
5. ❌ User doesn't have read/write permissions

## Still Not Working?

### Option 1: Reset Database User Password

1. MongoDB Atlas → Database Access
2. Click user → Edit Password
3. Set a simple password (no special chars) like: `MyPassword123`
4. Update `.env` with new password
5. Test again

### Option 2: Create New Database User

1. MongoDB Atlas → Database Access → Add New Database User
2. Username: `cloudlab_user`
3. Password: `CloudLab123` (simple, no special chars)
4. Privileges: **"Read and write to any database"**
5. Update `.env` with new credentials
6. Test again

## After Connection Works

Once `node fix-atlas-connection.js` shows ✅ SUCCESS:

```bash
# Seed the database
npm run seed

# Start the server
npm start
```

