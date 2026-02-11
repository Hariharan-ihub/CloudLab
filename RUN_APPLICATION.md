# Running the Application with MongoDB Atlas

## Step 1: Fix MongoDB Atlas Connection

You're getting an authentication error. Follow these steps:

### A. Check Your Connection String Format

Your `.env` file should have:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aws-learning-lab
```

**Important**: 
- Replace `username` and `password` with your actual credentials
- If password has special characters, URL-encode them:
  - `@` → `%40`
  - `:` → `%3A`
  - `/` → `%2F`
  - `#` → `%23`

### B. Test Connection

Run this test script:

```bash
cd backend
node test-connection.js
```

If it fails, check:
1. **MongoDB Atlas → Network Access**: Add your IP address
2. **MongoDB Atlas → Database Access**: Verify user exists and has permissions
3. **Connection string**: Ensure it includes `/aws-learning-lab` database name

## Step 2: Seed the Database

Once connection works, seed your database:

```bash
cd backend
npm run seed
```

Expected output:
```
✅ MongoDB connected successfully
🗑️  Clearing existing data...
✅ Existing data cleared
📦 Seeding labs and steps...
✅ Created lab: Launch Your First EC2 Instance (6 steps)
✅ Created lab: Host a Static Website on S3 (4 steps)
✅ Created lab: Secure Access with IAM Users (3 steps)
✅ Created lab: Build a Secure VPC Network (4 steps)
🎉 Database seeding completed successfully!
```

## Step 3: Start Backend Server

Open **Terminal 1**:

```bash
cd backend
npm start
```

Expected output:
```
MongoDB connected
Server running on port 5000
```

## Step 4: Start Frontend Server

Open **Terminal 2** (new terminal):

```bash
cd frontend_app
npm run dev
```

Expected output:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

## Step 5: Access Application

Open your browser:
```
http://localhost:5173
```

## Quick Commands Summary

```bash
# Terminal 1 - Backend
cd backend
node test-connection.js  # Test MongoDB connection
npm run seed             # Seed database (first time)
npm start                # Start backend server

# Terminal 2 - Frontend
cd frontend_app
npm run dev              # Start frontend server
```

## Troubleshooting

### Authentication Error
- Check username/password in `.env`
- URL-encode special characters in password
- Verify user exists in MongoDB Atlas → Database Access

### Network Access Error
- Go to MongoDB Atlas → Network Access
- Add your current IP address
- Or temporarily allow `0.0.0.0/0` for development

### Connection String Format
- Must start with `mongodb+srv://`
- Must include database name: `/aws-learning-lab`
- Format: `mongodb+srv://user:pass@cluster.net/dbname`

See `MONGODB_ATLAS_SETUP.md` for detailed troubleshooting.

