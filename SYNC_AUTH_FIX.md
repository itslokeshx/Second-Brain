# Sync Authentication Fix

## Problem

The sync functionality was failing with "Not authenticated" errors even after successful user registration. The console showed:

```
[Sync] ❌ Failed: Error: Not authenticated
[Auth] ❌ DENIED - No valid session or token
```

## Root Cause

The `SessionManager` was only checking the `/v64/user/config` API endpoint for authentication status, but:
1. After registration, cookies were set correctly (ACCT, UID, NAME, JSESSIONID)
2. The API endpoint wasn't always returning user data immediately
3. The `SessionManager.currentUser` remained `null`, causing `SyncService.authenticatedFetch()` to throw "Not authenticated"

## Solution

Enhanced `session-manager.js` with three improvements:

### 1. Cookie-Based Fallback Authentication
Added `getUserFromCookies()` method that extracts user data from cookies:
- Checks for `ACCT` (email) and `UID` (user ID) cookies
- Extracts `NAME` (username) and `JSESSIONID` (session token)
- Returns user object if cookies exist

### 2. Dual-Mode Authentication Check
Modified `checkLoginStatus()` to:
1. **First**: Check cookies for existing session
2. **Then**: Try API endpoint `/v64/user/config`
3. **Fallback**: Use cookie data if API doesn't return user or fails

This ensures authentication is detected even if the API is slow or returns empty data.

### 3. Automatic Session Detection
Added two monitoring mechanisms:

**Periodic Check** (every 5 seconds):
```javascript
setInterval(() => {
    SessionManager.checkLoginStatus();
}, 5000);
```

**Cookie Monitor** (every 1 second):
```javascript
setInterval(() => {
    if (document.cookie !== lastCookies) {
        console.log('[Session] Cookies changed, re-checking auth...');
        SessionManager.checkLoginStatus();
    }
}, 1000);
```

This automatically detects when:
- User logs in
- User registers
- Session cookies are set by the backend

## Expected Behavior After Fix

1. **After Registration**:
   - Cookies are set: `ACCT`, `UID`, `NAME`, `JSESSIONID`
   - Cookie monitor detects change within 1 second
   - `SessionManager` extracts user from cookies
   - `currentUser` is set
   - Sync button becomes functional

2. **After Login**:
   - Same process as registration
   - Session is detected immediately

3. **On Page Reload**:
   - `SessionManager.init()` runs
   - Checks cookies first
   - User remains authenticated

4. **Sync Button Click**:
   - `SyncService.authenticatedFetch()` checks `currentUser`
   - Finds valid user from cookies
   - Sync proceeds successfully

## Testing

To verify the fix:

1. **Clear all data**:
   ```javascript
   localStorage.clear();
   document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"));
   location.reload();
   ```

2. **Register a new account**:
   - Fill in registration form
   - Click "Sign Up"
   - Watch console for: `[Session] Cookies changed, re-checking auth...`
   - Should see: `[Session] Using cookie-based auth: your@email.com`

3. **Click Sync Button**:
   - Should no longer see "Not authenticated" error
   - Should see sync data being sent to backend

## Files Modified

- `js/session-manager.js` - Enhanced authentication detection with cookie fallback and monitoring

## Next Steps

If sync still fails, check:
1. Backend `/v64/sync` endpoint authentication middleware
2. Session cookie parsing in backend
3. CORS and credentials settings
