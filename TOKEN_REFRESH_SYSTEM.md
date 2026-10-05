# JWT Refresh Token System - Implementation Guide

## Overview
A production-ready token refresh system has been implemented to handle JWT token expiration gracefully. The system uses short-lived access tokens (15 minutes) and long-lived refresh tokens (7 days).

## Changes Made

### Backend

#### 1. User Model (`backend/models/User.js`)
- Added `refreshToken` field to store refresh tokens in the database

#### 2. Auth Controller (`backend/controllers/authController.js`)
- **generateAccessToken()** - Creates short-lived access token (15m expiration)
- **generateRefreshToken()** - Creates long-lived refresh token (7d expiration)
- **generateTokens()** - Creates both tokens together
- **registerUser()** - Returns both `accessToken` and `refreshToken`
- **loginUser()** - Returns both tokens and stores refresh token in DB
- **refreshUserToken()** - New endpoint to refresh expired access tokens
- **logoutUser()** - Clears refresh token from database

#### 3. Auth Middleware (`backend/middleware/authMiddleware.js`)
- Enhanced error handling to distinguish `TokenExpiredError`
- Returns specific error code `TOKEN_EXPIRED` for frontend token refresh logic

#### 4. Auth Routes (`backend/routes/authRoutes.js`)
- `POST /api/auth/refresh` - Refresh token endpoint
- `POST /api/auth/logout` - Logout endpoint

### Frontend

#### 1. Auth Context (`frontend/src/context/AuthContext.js`)
- Changed from single `token` to `accessToken` and `refreshToken`
- Added `refreshAccessToken()` method to auto-refresh tokens
- Enhanced `refreshUser()` to catch 401 and trigger token refresh
- Updated `login()`, `register()`, and `logout()` methods

#### 2. Route Guards
- **ProtectedRoute.js** - Updated to use `accessToken`
- **GuestRoute.js** - Updated to use `accessToken`

#### 3. Axios Interceptor (`frontend/src/utils/axios.js`)
- Enhanced request interceptor to use `accessToken`
- Added response interceptor to automatically:
  - Detect 401 responses
  - Call refresh endpoint with `refreshToken`
  - Retry original request with new token
  - Clear auth and redirect to login if refresh fails

#### 4. API Utility (`frontend/src/services/api.js`)
- Alternative fetch-based API utility with automatic token refresh
- Provides `get()`, `post()`, `put()`, `patch()`, `del()` methods

#### 5. Updated Files
- `frontend/src/pages/Profile.js` - All token references updated
- `frontend/src/pages/AchievementPage.js` - Token reference updated
- `frontend/src/pages/QuestList.js` - Token reference updated
- `frontend/src/components/trainer/AddAchievementForm.jsx` - Token reference updated

## How It Works

### Login Flow
```
1. User logs in with credentials
2. Backend generates accessToken (15m) + refreshToken (7d)
3. refreshToken stored in DB, both sent to frontend
4. Frontend stores both in localStorage
```

### API Request Flow
```
1. Frontend sends request with accessToken in Authorization header
2. If token is valid → Request succeeds
3. If token expired (401) → Axios interceptor:
   a. Sends refreshToken to /api/auth/refresh endpoint
   b. Backend validates refreshToken and generates new tokens
   c. Frontend stores new tokens in localStorage
   d. Automatically retries original request with new accessToken
```

### Silent Token Refresh
- Users don't need to re-login if access token expires
- Token refresh happens automatically in the background
- Seamless user experience without interruption

### Logout Flow
```
1. User clicks logout
2. Frontend calls /api/auth/logout with current accessToken
3. Backend clears refreshToken from user's DB record
4. Frontend clears both tokens from localStorage
5. User redirected to login page
```

## Environment Variables

Make sure `.env` file has:
```
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
```

If `JWT_REFRESH_SECRET` is not set, it defaults to `JWT_SECRET`.

## Testing

### Test Token Refresh
1. Login and note the access token expiration time (15 minutes)
2. Wait or modify the expiresIn to 10s for testing
3. Make an API call after token expiration
4. Verify that:
   - Axios interceptor triggers
   - New token is obtained via refresh endpoint
   - Request is retried automatically
   - No re-login required

### Test Logout
1. Login successfully
2. Click logout
3. Verify refresh token cleared from DB
4. Verify localStorage cleared
5. Verify redirect to login page

## Benefits

✅ **Security** - Short-lived access tokens limit exposure
✅ **UX** - Automatic token refresh, no manual re-logins
✅ **Scalability** - Can implement token blacklisting, rotation, etc.
✅ **Production-Ready** - Industry standard implementation
✅ **Recovery** - Graceful handling of expired/invalid tokens

## Migration Notes

Old code used single `token` from localStorage.
New code uses `accessToken` and `refreshToken` separately.

All API calls now use `accessToken` for requests.
`refreshToken` is only used when calling `/api/auth/refresh`.
