# Starting the Application with MongoDB Atlas

## Step-by-Step Guide

### 1. Verify MongoDB Atlas Connection

Your `.env` file should contain:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aws-learning-lab
PORT=5000
```

### 2. Seed the Database

First, populate your MongoDB Atlas database with initial data:

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

### 3. Start the Backend Server

Open a terminal and run:

```bash
cd backend
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

Expected output:
```
MongoDB connected
Server running on port 5000
```

### 4. Start the Frontend

Open a **new terminal** and run:

```bash
cd frontend_app
npm run dev
```

Expected output:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## Troubleshooting

### MongoDB Atlas Connection Issues

1. **Check your connection string format**:
   - Should start with `mongodb+srv://`
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database-name`

2. **Verify network access**:
   - Go to MongoDB Atlas → Network Access
   - Add your IP address or use `0.0.0.0/0` for development (not recommended for production)

3. **Check database user**:
   - Go to MongoDB Atlas → Database Access
   - Ensure user has read/write permissions

4. **Test connection**:
   ```bash
   cd backend
   node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✅ Connected!'); process.exit(0); }).catch(err => { console.error('❌ Error:', err.message); process.exit(1); });"
   ```

### Port Already in Use

If port 5000 is busy:
1. Change `PORT` in `.env` to another port (e.g., `5001`)
2. Update frontend proxy in `frontend_app/vite.config.js` if needed

### Database Empty

If you see no labs:
1. Run the seed script: `npm run seed`
2. Check MongoDB Atlas to verify data was inserted
3. Verify connection string is correct

## Quick Start Commands

```bash
# Terminal 1 - Backend
cd backend
npm run seed    # Seed database (first time only)
npm start       # Start backend server

# Terminal 2 - Frontend  
cd frontend_app
npm run dev     # Start frontend dev server
```

## Verification Checklist

- [ ] MongoDB Atlas connection string in `.env`
- [ ] Network access configured in Atlas
- [ ] Database seeded (`npm run seed`)
- [ ] Backend server running (`npm start`)
- [ ] Frontend server running (`npm run dev`)
- [ ] Can access `http://localhost:5173`
- [ ] Can see labs in dashboard

