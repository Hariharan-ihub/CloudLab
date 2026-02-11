# Quick Start Guide - CloudLab

## 🚀 Getting Started

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend_app
npm install
```

### Step 2: Start MongoDB

Make sure MongoDB is running on your system:
- Default: `mongodb://localhost:27017`
- Or configure in `backend/.env` file

### Step 3: Seed the Database

**Option 1: Using npm script (Recommended)**
```bash
cd backend
npm run seed
```

**Option 2: Direct execution**
```bash
cd backend
node scripts/seedDatabase.js
```

**Expected Output:**
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

### Step 4: Start the Backend Server

```bash
cd backend
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Step 5: Start the Frontend

Open a new terminal:

```bash
cd frontend_app
npm run dev
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

### Step 6: Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## 📊 What's Loaded

After seeding, you'll have:

- **4 Labs:**
  1. Launch Your First EC2 Instance (Beginner) - 6 steps
  2. Host a Static Website on S3 (Intermediate) - 4 steps
  3. Secure Access with IAM Users (Beginner) - 3 steps
  4. Build a Secure VPC Network (Advanced) - 4 steps

- **17 Total Steps** across all labs
- **Initial States** for each lab (VPCs, Subnets, Security Groups, S3 buckets, IAM resources)

## 🔧 Environment Configuration

Create `backend/.env` file (optional):

```env
MONGODB_URI=mongodb://localhost:27017/aws-learning-lab
PORT=5000
YOUTUBE_API_KEY=your_youtube_api_key_here
```

## ✅ Verify Everything Works

1. **Check Backend API:**
   ```bash
   curl http://localhost:5000/api/labs
   ```
   Or visit: http://localhost:5000/api/labs

2. **Check Frontend:**
   - Open http://localhost:5173
   - You should see the Lab Dashboard with 4 lab cards

3. **Test a Lab:**
   - Click on "Launch Your First EC2 Instance"
   - You should see the lab runner with steps

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env` file
- Default: `mongodb://localhost:27017`

### Port Already in Use
- Backend: Change `PORT` in `.env` (default: 5000)
- Frontend: Vite will automatically use next available port

### Database Empty
- Run the seed script again: `npm run seed`
- Check MongoDB is accessible
- Verify no errors in console

## 📝 Useful Commands

```bash
# Seed database
npm run seed

# Start backend server
npm start

# Start backend with auto-reload
npm run dev

# Frontend development
cd frontend_app
npm run dev

# Frontend build
cd frontend_app
npm run build
```

## 🎯 Next Steps

1. ✅ Database seeded
2. ✅ Backend running
3. ✅ Frontend running
4. 🎉 Start learning with the labs!

For detailed information, see `backend/README_SEEDING.md`

