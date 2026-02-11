# Authentication System Setup

## Overview
A complete authentication system has been implemented with user registration, login, and JWT token-based authentication.

## Backend Implementation

### 1. Dependencies Installed
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation and verification

### 2. Models
- **User Model** (`backend/models/User.js`)
  - Fields: username, email, password, firstName, lastName
  - Password is automatically hashed before saving
  - Includes password comparison method

### 3. Authentication Middleware
- **Auth Middleware** (`backend/middleware/auth.js`)
  - `authenticate` - Verifies JWT token and attaches user to request
  - `optionalAuth` - Non-blocking auth check
  - `generateToken` - Creates JWT tokens (7-day expiration)

### 4. Auth Controller
- **Auth Controller** (`backend/controllers/authController.js`)
  - `register` - Create new user account
  - `login` - Authenticate user and return token
  - `getCurrentUser` - Get authenticated user info

### 5. Routes
- **Auth Routes** (`backend/routes/authRoutes.js`)
  - `POST /api/auth/register` - Register new user
  - `POST /api/auth/login` - Login user
  - `GET /api/auth/me` - Get current user (protected)

## Frontend Implementation

### 1. Redux Auth Slice
- **Auth Slice** (`frontend_app/src/store/authSlice.js`)
  - Manages authentication state
  - Stores user info and token in localStorage
  - Provides `register`, `login`, `logout`, `getCurrentUser` actions

### 2. Auth Components
- **Login Component** (`frontend_app/src/components/Auth/Login.jsx`)
  - Email/password login form
  - Redirects to home after successful login
  
- **Register Component** (`frontend_app/src/components/Auth/Register.jsx`)
  - User registration form
  - Validates password match
  - Auto-login after registration

- **Protected Route** (`frontend_app/src/components/Auth/ProtectedRoute.jsx`)
  - Wraps protected routes
  - Redirects to login if not authenticated

### 3. Auth Hook
- **useAuth Hook** (`frontend_app/src/hooks/useAuth.js`)
  - Convenient hook to access auth state
  - Returns: user, userId, isAuthenticated, loading, token

### 4. Updated Components
All components now use authenticated user instead of hardcoded `user-123`:
- `LabRunner.jsx`
- `LabDashboard.jsx`
- `LabStepPanel.jsx`
- `FakeEC2Console.jsx`
- `FakeS3Console.jsx`
- `FakeIAMConsole.jsx`
- `FakeVPCConsole.jsx`
- `FakeSecurityGroupConsole.jsx`
- `FakeSecretsManagerConsole.jsx`
- `FakeCloudWatchConsole.jsx`
- `FakeEBSConsole.jsx`
- `CloudShellPanel.jsx`
- `AwsTopBar.jsx` (shows username, logout functionality)

### 5. API Integration
All API calls now include JWT token in Authorization header:
- `simulationSlice.js` - All simulation API calls
- Token is automatically included from localStorage

## Environment Variables

Add to `backend/.env`:
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
MONGODB_URI=your-mongodb-connection-string
PORT=5000
```

**Important**: Generate a strong random string for `JWT_SECRET` in production:
```bash
openssl rand -base64 32
```

## Usage

### Registration
1. Navigate to `/register`
2. Fill in username, email, password
3. User is automatically logged in after registration

### Login
1. Navigate to `/login`
2. Enter email and password
3. Redirected to home page on success

### Protected Routes
- All main application routes are protected
- Unauthenticated users are redirected to `/login`
- Token is stored in localStorage and persists across sessions

### Logout
- Click user menu → "Sign Out"
- Clears token and user data
- Redirects to login page

## API Endpoints

### Public Endpoints
- `POST /api/auth/register`
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```

- `POST /api/auth/login`
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

### Protected Endpoints
- `GET /api/auth/me`
  - Requires: `Authorization: Bearer <token>`
  - Returns: Current user information

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt before storage
2. **JWT Tokens**: Secure token-based authentication
3. **Token Expiration**: Tokens expire after 7 days
4. **Protected Routes**: Backend routes can use `authenticate` middleware
5. **Frontend Protection**: Protected routes redirect to login

## Testing

1. Start backend:
   ```bash
   cd backend
   npm start
   ```

2. Start frontend:
   ```bash
   cd frontend_app
   npm run dev
   ```

3. Register a new user at `http://localhost:5173/register`
4. Login at `http://localhost:5173/login`
5. Access protected routes - should work seamlessly

## Migration Notes

- Old hardcoded `user-123` has been replaced with authenticated user ID
- All components check for `userId` before making API calls
- User progress is now tied to authenticated user accounts
- Multiple users can use the system simultaneously with separate progress

