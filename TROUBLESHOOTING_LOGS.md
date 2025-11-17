# Troubleshooting Upload Timeouts with Backend Logs

## Overview

This backend now includes comprehensive request logging to help diagnose timeout issues when uploading files from the frontend.

## How to View Logs

### On Render (Production)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your `metabackend` service
3. Click on the **"Logs"** tab
4. Logs are shown in real-time

### Locally (Development)

When running `npm run dev` or `npm start`, logs appear directly in your terminal.

## What Gets Logged

### 1. Request Tracking (All Endpoints)

Every incoming request logs:
```
[2025-11-17T13:05:38.992Z] Incoming POST /api/upload-image from ::1
[2025-11-17T13:05:38.992Z] Completed POST /api/upload-image - Status: 200 - Duration: 1234ms
```

**Key Information:**
- **Timestamp**: When request arrived
- **Method & Path**: What endpoint was called
- **IP Address**: Where request came from
- **Status Code**: 200 (success), 400 (client error), 500 (server error)
- **Duration**: How long the request took in milliseconds

### 2. Image Upload Logs

```
[1763384754232] Processing image upload request
[1763384754232] Received file: logo.png, Size: 45678 bytes, Type: image/png
[1763384754232] Uploading to Pinata...
[1763384754232] Successfully uploaded to Pinata: https://gateway.pinata.cloud/ipfs/Qm...
```

**Or on error:**
```
[1763384754232] Error uploading to Pinata: AxiosError: ...
[1763384754232] Axios error details: { status: 401, statusText: 'Unauthorized', data: {...} }
```

### 3. Metadata Upload Logs

```
[1763384770922] Processing metadata upload request
[1763384770922] Metadata size: 256 bytes
[1763384770922] Uploading metadata to Pinata...
[1763384770922] Successfully uploaded metadata to Pinata: https://gateway.pinata.cloud/ipfs/Qm...
```

### 4. Health Check Logs

```
[2025-11-17T13:05:38.992Z] Incoming GET /health from ::1
Health check request received
[2025-11-17T13:05:38.992Z] Completed GET /health - Status: 200 - Duration: 4ms
```

## Diagnosing Timeout Issues

### Scenario 1: Backend Never Receives Request

**Symptoms in logs:**
- No `Incoming POST /api/upload-image` message appears
- No processing logs at all

**Possible causes:**
- Frontend is configured with wrong backend URL
- CORS blocking the request (check browser console)
- Network connectivity issues
- Backend is down or sleeping (on free Render tier)

**Solutions:**
- Verify `NEXT_PUBLIC_BACKEND_URL` in frontend matches your Render URL
- Check browser console for CORS errors
- Test health endpoint: `curl https://your-backend.onrender.com/health`
- Render free tier: First request after 15 min idle takes ~30s to wake up

### Scenario 2: Backend Receives Request but Times Out

**Symptoms in logs:**
```
[timestamp] Incoming POST /api/upload-image from 1.2.3.4
[requestId] Processing image upload request
[requestId] Received file: large-file.png, Size: 5242880 bytes, Type: image/png
[requestId] Uploading to Pinata...
[timestamp] Completed POST /api/upload-image - Status: 200 - Duration: 45000ms
```

**Possible causes:**
- File is very large (see Size in logs)
- Pinata API is slow
- Network between Render and Pinata is slow

**Solutions:**
- Consider implementing file size limits on frontend
- Add loading indicators showing upload progress
- Consider chunked uploads for large files
- Upgrade Pinata plan if hitting rate limits

### Scenario 3: Pinata API Errors

**Symptoms in logs:**
```
[requestId] Error uploading to Pinata: AxiosError: ...
[requestId] Axios error details: { status: 401, statusText: 'Unauthorized', data: {...} }
```

**Possible causes:**
- Invalid Pinata API keys
- Pinata account limits exceeded
- Pinata service issues

**Solutions:**
- Verify `PINATA_API_KEY` and `PINATA_SECRET_API_KEY` in Render environment variables
- Check Pinata dashboard for account status
- Check Pinata API status: https://status.pinata.cloud

### Scenario 4: File Not Provided Error

**Symptoms in logs:**
```
[requestId] Processing image upload request
[requestId] Error: No file provided
[timestamp] Completed POST /api/upload-image - Status: 400 - Duration: 5ms
```

**Possible causes:**
- Frontend not sending file correctly
- File field name mismatch (should be "file")
- Request encoding issue

**Solutions:**
- Check frontend code sends FormData with field name "file"
- Verify Content-Type: multipart/form-data header
- Check browser network tab for request payload

## Expected Timing

### Normal Response Times

- **Health check**: 2-10ms
- **Small image (< 100KB)**: 500-2000ms
- **Medium image (100KB-1MB)**: 1000-5000ms
- **Large image (1MB-5MB)**: 5000-15000ms
- **Metadata upload**: 200-1000ms

### First Request After Sleep (Render Free Tier)

- **Cold start**: 10-30 seconds (backend waking up)
- This happens after 15 minutes of inactivity
- Solution: Use paid tier or implement keep-alive pinger

## Monitoring Tips

### 1. Real-time Monitoring

Keep Render logs open in a browser tab while testing uploads from frontend.

### 2. Filter Logs

In Render dashboard, use the search/filter to focus on specific endpoints:
- Search for `/api/upload-image` to see only image uploads
- Search for `Error` to see only errors
- Search for a specific request ID to track a single upload

### 3. Check Response Times

Look for patterns:
- If all requests are fast (< 1s), the issue is likely frontend-side
- If requests take 30+ seconds consistently, investigate Pinata or file sizes
- If first request is slow but subsequent ones are fast, it's cold start

### 4. Cross-reference with Frontend

Compare backend logs with browser Network tab:
- Backend shows request arrived at time X
- Browser shows request sent at time Y
- Difference reveals network latency or connection issues

## Additional Debugging

### Test Backend Directly

```bash
# Test health endpoint
curl https://your-backend.onrender.com/health

# Test image upload (requires API keys configured)
curl -X POST https://your-backend.onrender.com/api/upload-image \
  -F "file=@/path/to/test-image.png"

# Test metadata upload (requires API keys configured)
curl -X POST https://your-backend.onrender.com/api/upload-metadata \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","symbol":"TST"}'
```

### Check Backend Status

1. **Server Running?**
   ```bash
   curl https://your-backend.onrender.com/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Environment Variables Set?**
   - Check Render dashboard → Environment tab
   - Ensure `PINATA_API_KEY` and `PINATA_SECRET_API_KEY` are present

3. **Recent Deployments?**
   - Check Render dashboard → Events tab
   - Verify latest deployment succeeded

## Getting Help

When reporting timeout issues, include:

1. **Backend logs** showing the problematic request
2. **File size** from logs (e.g., "Size: 5242880 bytes")
3. **Duration** from logs (e.g., "Duration: 45000ms")
4. **Error details** if present in logs
5. **Browser console errors** from frontend
6. **Network tab** screenshot showing the request

This information helps identify whether the issue is:
- Frontend → Backend communication
- Backend → Pinata communication
- File size/performance issue
- Configuration issue
