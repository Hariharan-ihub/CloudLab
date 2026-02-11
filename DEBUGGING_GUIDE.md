# Debugging Guide - EC2 Instance Launch

## 🔍 Logging Added

Comprehensive logging has been added throughout the EC2 instance launch flow to help debug issues.

## 📍 Where to Check Logs

### Frontend Logs (Browser Console)

Open your browser's Developer Console (F12) and look for:

1. **EC2 Console Component Logs:**
   - `🚀 [EC2 Console] handleAction called:` - When launch button is clicked
   - `✅ [EC2 Console] validateStep result:` - API response received
   - `✅ [EC2 Console] Launch successful:` - Success case
   - `❌ [EC2 Console] Launch failed:` - Failure case
   - `⚠️ [EC2 Console] Validation failed:` - Form validation errors

2. **Redux Store Logs:**
   - `📡 [Redux] validateStep API call:` - Before API call
   - `📤 [Redux] Sending request:` - Request payload
   - `📥 [Redux] Response status:` - HTTP status code
   - `📥 [Redux] Response data:` - API response data
   - `✅ [Redux] API success:` - Success response
   - `❌ [Redux] API error response:` - Error response
   - `⏳ [Redux] validateStep.pending` - Redux state update
   - `✅ [Redux] validateStep.fulfilled` - Redux state update
   - `❌ [Redux] validateStep.rejected` - Redux state update

### Backend Logs (Server Console)

Check your backend server console for:

1. **Request Logs:**
   - `🔍 [Backend] validateAction called:` - Request received
   - `🔍 [Backend] Looking for step:` - Step lookup
   - `✅ [Backend] Step found:` - Step details
   - `⚠️ [Backend] Step not found:` - Step missing

2. **Validation Logs:**
   - `🔍 [Backend] Checking step sequence:` - Step order validation
   - `✅ [Backend] Action validation passed:` - Action matches
   - `⚠️ [Backend] Action mismatch:` - Action doesn't match expected

3. **Launch Process Logs:**
   - `🚀 [Backend] Processing CLICK_FINAL_LAUNCH action`
   - `📦 [Backend] Payload received:` - Launch payload details
   - `💾 [Backend] Creating instance:` - Instance creation
   - `✅ [Backend] Instance saved successfully:` - Database save success
   - `❌ [Backend] Database error saving instance:` - Database error

4. **Response Logs:**
   - `📤 [Backend] Sending response:` - Final response

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to launch instance" - No Error Details

**Check:**
1. Browser console for validation errors
2. Backend console for step validation failures
3. Network tab for API response status

**Look for:**
- `⚠️ [EC2 Console] Validation failed:` - Missing required fields
- `⚠️ [Backend] Step not found:` - Step ID mismatch
- `⚠️ [Backend] Action mismatch:` - Wrong action type

### Issue 2: Step Validation Fails

**Symptoms:**
- Backend logs show: `⚠️ [Backend] Step not found`
- Or: `⚠️ [Backend] Action mismatch`

**Solution:**
- Check that `stepId` matches the step in database
- Verify `expectedAction` in database matches the action being sent
- Check that `labId` is correct

### Issue 3: Step Sequence Validation Fails

**Symptoms:**
- Backend logs show: `⚠️ [Backend] Step sequence validation failed`
- Error message: "Please complete step X first"

**Solution:**
- Complete previous steps in order
- Check UserProgress collection for completed steps

### Issue 4: Database Save Fails

**Symptoms:**
- Backend logs show: `❌ [Backend] Database error saving instance`
- Error details in logs

**Solution:**
- Check MongoDB connection
- Verify SimulatedResource model schema
- Check for required fields

### Issue 5: Missing Payload Fields

**Symptoms:**
- Frontend validation passes but backend fails
- Backend logs show incomplete payload

**Solution:**
- Check wizardState in frontend
- Verify all required fields are set:
  - `name`
  - `ami`
  - `instanceType`
  - `vpcId`
  - `subnetId`

## 🔧 Debugging Steps

1. **Open Browser Console** (F12 → Console tab)
2. **Open Backend Console** (Terminal running `npm start`)
3. **Try to launch instance**
4. **Check logs in order:**
   - Frontend validation logs
   - Redux API call logs
   - Backend request logs
   - Backend validation logs
   - Backend launch logs
   - Backend response logs
   - Frontend result logs

## 📊 Expected Flow

### Successful Launch:
```
🚀 [EC2 Console] handleAction called
📡 [Redux] validateStep API call
📤 [Redux] Sending request
🔍 [Backend] validateAction called
✅ [Backend] Step found
✅ [Backend] Action validation passed
🚀 [Backend] Processing CLICK_FINAL_LAUNCH action
💾 [Backend] Creating instance
✅ [Backend] Instance saved successfully
📤 [Backend] Sending response
📥 [Redux] Response data
✅ [Redux] validateStep.fulfilled
✅ [EC2 Console] Launch successful
```

### Failed Launch:
```
🚀 [EC2 Console] handleAction called
📡 [Redux] validateStep API call
📤 [Redux] Sending request
🔍 [Backend] validateAction called
⚠️ [Backend] Step not found (or validation failed)
📤 [Backend] Sending response (success: false)
📥 [Redux] Response data
✅ [Redux] validateStep.fulfilled (but success: false)
❌ [EC2 Console] Launch failed
```

## 🎯 Quick Debug Checklist

- [ ] Browser console shows launch attempt
- [ ] Redux logs show API call
- [ ] Backend receives request
- [ ] Step is found in database
- [ ] Action matches expected action
- [ ] Payload contains all required fields
- [ ] Database save succeeds
- [ ] Response sent back successfully
- [ ] Frontend receives response
- [ ] Success state updated

## 📝 Log Format

All logs use emoji prefixes for easy identification:
- 🚀 = Action/Process start
- ✅ = Success
- ❌ = Error
- ⚠️ = Warning
- 🔍 = Lookup/Search
- 📡 = Network/API
- 📤 = Sending
- 📥 = Receiving
- 💾 = Database operation
- ⏳ = Pending/Waiting

## 💡 Tips

1. **Keep both consoles open** while testing
2. **Clear console** before each test for cleaner logs
3. **Look for the first error** - subsequent errors may be cascading
4. **Check network tab** if API calls aren't reaching backend
5. **Verify MongoDB** is running if database errors occur

