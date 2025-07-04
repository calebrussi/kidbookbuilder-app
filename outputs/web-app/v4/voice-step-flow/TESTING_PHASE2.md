# Phase 2 Testing Guide - Real-time Progress Sync

## 🚀 Pre-Testing Setup

### 1. Make Sure Both Servers Are Running

**Terminal 1 (Frontend):**

```bash
cd /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/voice-step-flow
npm run dev
```

Should see: `Local: http://localhost:8082/`

**Terminal 2 (API Server):**

```bash
cd /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/voice-step-flow
npm run api-dev
```

Should see: `🚀 Todo API Server running on port 3001`

### 2. Clear Browser Data (Optional)

- Open Dev Tools (F12)
- Go to Application tab
- Clear localStorage and Session Storage
- This ensures a clean test

---

## 🧪 Test 1: Basic Real-time Connection

### Steps:

1. **Open the app** at http://localhost:8082
2. **Sign in** with your account
3. **Check the debug panel** (bottom-right corner)
   - Should show: Real-time: Connected ✅
   - Should show your email
4. **Check console logs** for:
   - `✅ Real-time progress sync enabled`
   - `📡 Real-time subscription status: SUBSCRIBED`

### ✅ Success Criteria:

- Debug panel shows "Connected"
- No errors in console
- User email displayed in debug panel

---

## 🧪 Test 2: Multi-Tab Real-time Sync

### Steps:

1. **Open two browser tabs** with your app
2. **Sign in to both tabs** with the same account
3. **In Tab 1:** Start a conversation with the AI agent
4. **In Tab 2:** Watch for automatic updates
5. **Complete a step in Tab 1**
6. **Check if Tab 2 updates** with the progress change

### ✅ Success Criteria:

- Both tabs show "Real-time: Connected"
- Progress changes in one tab appear in the other
- Console shows: `📡 Real-time progress update received`

---

## 🧪 Test 3: Data Migration (localStorage → Supabase)

### Steps:

1. **Sign out** of your account
2. **Use the app without signing in** (creates localStorage data)
3. **Complete a step** or make some progress
4. **Check localStorage** in dev tools (should have data)
5. **Sign in** to your account
6. **Check console** for migration messages:
   - `🔄 Migrating localStorage progress to Supabase...`
   - `✅ Progress migrated to Supabase successfully`

### ✅ Success Criteria:

- Console shows successful migration
- Progress from localStorage appears after sign-in
- Debug panel shows both localStorage and Supabase working

---

## 🧪 Test 4: Manual Database Operations

### Steps:

1. **Use the debug panel buttons:**
   - Click "Test Save to Supabase"
   - Click "Test Load from Supabase"
2. **Check console logs** for:
   - `✅ Test save successful`
   - `✅ Test load successful`
   - `📊 Loaded progress: [object]`

### ✅ Success Criteria:

- Both save and load operations succeed
- Console shows detailed progress data
- No database errors

---

## 🧪 Test 5: Offline Resilience

### Steps:

1. **Disconnect from internet** (or block Supabase in dev tools)
2. **Use the app** (should fall back to localStorage)
3. **Make progress** (should still work)
4. **Reconnect internet**
5. **Check if data syncs** when connection restored

### ✅ Success Criteria:

- App continues working offline
- Console shows fallback to localStorage
- Data syncs when connection restored

---

## 📊 What to Look For in Console

### ✅ Good Signs:

```
🔄 Starting progress initialization...
📋 Workflow: {object}
👤 User: [user-id]
🗄️ Attempting to load progress from Supabase...
✅ Real-time progress sync enabled
📡 Real-time subscription status: SUBSCRIBED
✅ Progress initialization complete!
```

### ❌ Warning Signs:

```
❌ Error loading user progress
❌ Real-time subscription error
⚠️ Failed to sync progress to Supabase
❌ Error syncing progress to Supabase
```

---

## 🔧 Troubleshooting

### If Real-time Doesn't Connect:

1. Check Supabase project settings
2. Verify real-time is enabled in Supabase dashboard
3. Check network connectivity
4. Look for CORS errors

### If Migration Fails:

1. Check Supabase RLS policies
2. Verify user authentication
3. Check database table structure
4. Look for permission errors

### If Debug Panel Doesn't Show:

1. Make sure you're in development mode
2. Check console for React errors
3. Verify component imports

---

## 🎯 Expected Results

After all tests pass, you should have:

✅ **Multi-device sync** working
✅ **Real-time updates** across browser tabs
✅ **Automatic data migration** from localStorage
✅ **Offline resilience** with fallback storage
✅ **User-isolated data** (each user sees only their progress)

---

## 🚀 Next Steps

If all tests pass:

- **Phase 2 is complete!** 🎉
- Ready to move to **Phase 3: Personalized Agent System**

If tests fail:

- Check specific error messages
- Verify Supabase configuration
- Ensure database tables exist with correct RLS policies
