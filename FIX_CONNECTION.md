# Fix Your MongoDB Atlas Connection

## Current Issue

Your connection string is missing the database name. It shows:
```
mongodb+srv://hariselvan545_db_user:****@cluster0.ywq1q4h.mongodb.net/
```

## Fix Your .env File

Update your `backend/.env` file to include the database name:

```env
MONGODB_URI=mongodb+srv://hariselvan545_db_user:YOUR_PASSWORD@cluster0.ywq1q4h.mongodb.net/aws-learning-lab?retryWrites=true&w=majority
PORT=5000
```

**Important**: 
1. Replace `YOUR_PASSWORD` with your actual password
2. Add `/aws-learning-lab` before the `?` 
3. If password has special characters, URL-encode them:
   - `@` → `%40`
   - `:` → `%3A`
   - `/` → `%2F`
   - `#` → `%23`
   - ` ` (space) → `%20`

## Example

If your password is `myP@ss:123`, encode it as `myP%40ss%3A123`:

```env
MONGODB_URI=mongodb+srv://hariselvan545_db_user:myP%40ss%3A123@cluster0.ywq1q4h.mongodb.net/aws-learning-lab?retryWrites=true&w=majority
```

## Steps to Fix

1. **Open** `backend/.env` file
2. **Find** the `MONGODB_URI` line
3. **Add** `/aws-learning-lab` before the `?` (or at the end if no `?`)
4. **Check** password encoding if it has special characters
5. **Save** the file
6. **Test** again: `node test-connection.js`

## Verify Network Access

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click **"Network Access"** in left menu
3. Click **"Add IP Address"**
4. Click **"Add Current IP Address"** (or use `0.0.0.0/0` for development)
5. Click **"Confirm"**

## Verify Database User

1. Go to MongoDB Atlas → **"Database Access"**
2. Find user `hariselvan545_db_user`
3. Ensure it has **"Read and write to any database"** permissions
4. If not, edit user and set permissions

## Test Again

After fixing, run:

```bash
cd backend
node test-connection.js
```

You should see:
```
✅ MongoDB Atlas connected successfully!
✅ Connection test passed!
```

## Then Run Application

```bash
# Seed database
npm run seed

# Start server
npm start
```

