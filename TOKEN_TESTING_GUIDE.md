# Token System Testing & Debugging Guide

## What Was Fixed

### Root Cause
The `JsonWebTokenError: jwt malformed` was caused by a **React state closure issue**:

1. After login, `setAccessToken()` and `setRefreshToken()` were called
2. Immediately, `refreshUser()` was called via `setTimeout(() => refreshUser(), 0)`
3. But `refreshUser()` used the OLD `accessToken` from the closure (still null)
4. This caused "Bearer undefined" to be sent to the API
5. Backend received malformed JWT and threw error

### Solution Implemented

1. **Modified `refreshUser(tokenParam)`** - Now accepts token as parameter
2. **Removed setTimeout calls** - After login/register
3. **Let useEffect handle refreshUser** - When `accessToken` state changes, useEffect automatically calls `refreshUser(accessToken)` with the correct token
4. **Added console logs** - For debugging token flow

## Testing Steps

### Step 1: Clear Old Data
```javascript
// Open browser DevTools Console and run:
localStorage.clear();
location.reload();
```

### Step 2: Test Login
1. Go to login page
2. Enter credentials: `abc@gmail.com` / `abc123`
3. Click Login
4. **Open DevTools Console** and look for:
   - ✅ `🟢 Login response received:`
   - ✅ `✅ Login successful, tokens stored`
   - ✅ `📍 Token changed, refreshing user profile...`
   - ✅ `✅ User profile refreshed`

### Step 3: Verify Tokens in localStorage
```javascript
// In DevTools Console:
localStorage.getItem("accessToken")   // Should be a long JWT string
localStorage.getItem("refreshToken")  // Should be a long JWT string
localStorage.getItem("user")          // Should be user object
```

### Step 4: Check Network Requests
1. Open DevTools Network tab
2. Look for `api/auth/login` - should see response with both tokens
3. Look for `api/user/me` - should succeed with 200 status
4. You should NOT see 401 errors with malformed JWT

### Step 5: Test Token Expiration
To verify auto-refresh works (optional, for 15-min access tokens):

**Modify backend temporarily** to test (don't commit):
```javascript
// In authController.js, change this:
{ expiresIn: "15m" }

// To this:
{ expiresIn: "10s" }  // 10 seconds for testing
```

Then:
1. Login
2. Wait 11+ seconds
3. Try making an API call from dashboard
4. Should NOT see 401 errors - auto-refresh should happen silently

## What Each Log Message Means

| Log | Meaning |
|-----|---------|
| `🟢 Login response received:` | Backend returned tokens successfully |
| `✅ Login successful, tokens stored` | Frontend validated and stored tokens |
| `📍 Token changed, refreshing user profile...` | useEffect detected new token |
| `✅ User profile refreshed` | User data loaded from `/api/user/me` |
| `✅ Token refreshed successfully` | Access token was expired, successfully refreshed |
| `❌ Token refresh failed:` | Refresh token is invalid - user needs to re-login |

## If You Still See Errors

### Error: "jwt malformed"
- **Check**: Are you still using old code?
- **Fix**: Hard refresh frontend (`Ctrl+Shift+R`)
- **Check**: Is `accessToken` actually being sent?
  ```javascript
  // In DevTools, check if token exists:
  JSON.parse(localStorage.getItem("accessToken"))
  ```

### Error: "jwt expired"
- **Expected** - This means access token is expired
- **Should be handled** - Axios interceptor should auto-refresh
- **Check**: Is refreshToken also stored in localStorage?
  ```javascript
  localStorage.getItem("refreshToken")
  ```

### Error: "Invalid refresh token"
- **Means**: Refresh token invalid or doesn't match DB
- **Fix**: Clear localStorage and re-login
  ```javascript
  localStorage.clear();
  location.reload();
  ```

### Error: "JsonWebTokenError: jwt malformed"
- **Likely cause**: Token value is undefined, null, or corrupted
- **Debug**: Check Network tab
  - Click failed request
  - Look at Headers tab
  - Check Authorization header value
  - It should look like: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - NOT like: `Bearer undefined` or `Bearer null`

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 after login | Old code still running | Clear browser cache & reload |
| State not updating | useState hook not triggering | Check dependency arrays |
| Tokens not persisting | localStorage cleared by other code | Check other tabs/extensions |
| Auto-refresh not working | Axios interceptor not configured | Verify axios.js changes |
| Getting 401 on protected routes | Using old `token` instead of `accessToken` | Verify all components updated |

## API Endpoints Reference

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/auth/login` | POST | Get access + refresh tokens | ❌ |
| `/api/auth/register` | POST | Register & get tokens | ❌ |
| `/api/auth/refresh` | POST | Get new access token | refreshToken in body |
| `/api/auth/logout` | POST | Clear refresh token from DB | ✅ Bearer token |
| `/api/user/me` | GET | Get current user profile | ✅ Bearer token |

## Architecture Overview

```
Login → Backend generates accessToken + refreshToken
       ↓
Frontend stores both in localStorage & state
       ↓
Request API with Authorization: Bearer {accessToken}
       ↓
If 401 (expired) → Axios interceptor triggers
                 ↓
                 POST /api/auth/refresh with refreshToken
                 ↓
                 Get new accessToken + refreshToken
                 ↓
                 Retry original request with new token
                 ↓
                 Original request succeeds ✅
```

## Files Modified

**Backend:**
- ✅ models/User.js - Added refreshToken field
- ✅ controllers/authController.js - New refresh endpoints
- ✅ middleware/authMiddleware.js - Better error handling
- ✅ routes/authRoutes.js - New routes

**Frontend:**
- ✅ context/AuthContext.js - Fixed state closure issue (THIS WAS THE KEY FIX!)
- ✅ utils/axios.js - Auto-refresh interceptor
- ✅ components/ProtectedRoute.js - Use accessToken
- ✅ components/GuestRoute.js - Use accessToken
- ✅ services/api.js - Alternative fetch utility
- ✅ pages/Profile.js, AchievementPage.js, QuestList.js - Updated token refs

## Next Steps

1. ✅ Frontend should now properly login without jwt malformed errors
2. ✅ Automatic token refresh happens in background
3. ✅ No manual re-logins required when token expires
4. ✅ Secure implementation with short-lived access tokens

If you still encounter issues, run the tests above and share the console logs!
